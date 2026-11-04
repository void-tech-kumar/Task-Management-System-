import { Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { AppError } from '../utils/appError.js';
import { sendResponse } from '../utils/apiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createBulkNotifications } from '../services/notification.service.js';

export const getProjects = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const status = req.query.status as any;
    const search = req.query.search as string | undefined;

    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (user.role === 'FACULTY') {
      whereClause.facultyId = user.userId;
    } else if (user.role === 'STUDENT') {
      whereClause.members = {
        some: { userId: user.userId },
      };
    }
    // Admin gets all projects (subject to filter)

    const rawProjects = await prisma.project.findMany({
      where: whereClause,
      include: {
        faculty: {
          select: { id: true, fullName: true, email: true, department: true },
        },
        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const projects = rawProjects.map((project) => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter((t) => t.status === 'COMPLETED').length;
      const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const { tasks, ...rest } = project;
      return {
        ...rest,
        totalTasks,
        completedTasks,
        progressPercent,
      };
    });

    sendResponse({
      res,
      data: { projects },
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const user = req.user!;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        faculty: {
          select: { id: true, fullName: true, email: true, department: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, department: true, avatarUrl: true },
            },
          },
        },
        tasks: {
          include: {
            assignments: {
              include: {
                user: {
                  select: { id: true, fullName: true, email: true, avatarUrl: true },
                },
              },
            },
            submissions: {
              select: {
                id: true,
                studentId: true,
                status: true,
                grade: true,
              },
            },
          },
          orderBy: [{ orderIndex: 'asc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!project) {
      return next(new AppError('Project not found.', 404));
    }

    // Role-based visibility check
    if (user.role === 'STUDENT') {
      const isMember = project.members.some((m) => m.userId === user.userId);
      if (!isMember) {
        return next(new AppError('Forbidden: You are not enrolled in this project.', 403));
      }
    } else if (user.role === 'FACULTY' && project.facultyId !== user.userId) {
      return next(new AppError('Forbidden: You do not own this project.', 403));
    }

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t) => t.status === 'COMPLETED').length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    sendResponse({
      res,
      data: {
        project: {
          ...project,
          totalTasks,
          completedTasks,
          progressPercent,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { title, code, description, department, startDate, endDate, memberStudentIds } = req.body;

    const facultyId = user.role === 'FACULTY' ? user.userId : req.body.facultyId || user.userId;

    const existingCode = await prisma.project.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (existingCode) {
      return next(new AppError(`Project code '${code}' is already registered.`, 409));
    }

    const project = await prisma.project.create({
      data: {
        title,
        code: code.toUpperCase(),
        description: description || null,
        department: department || null,
        facultyId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        members: memberStudentIds?.length
          ? {
              create: memberStudentIds.map((userId: string) => ({ userId })),
            }
          : undefined,
      },
      include: {
        faculty: {
          select: { id: true, fullName: true, email: true },
        },
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });

    if (memberStudentIds?.length) {
      await createBulkNotifications(memberStudentIds, {
        title: 'Enrolled in New Project',
        message: `You have been enrolled into project "${project.title}" (${project.code}).`,
        type: 'TASK_ASSIGNED',
        referenceUrl: `/app/projects/${project.id}`,
      });
    }

    sendResponse({
      res,
      statusCode: 201,
      message: 'Project created successfully',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const user = req.user!;
    const { title, description, department, startDate, endDate, status } = req.body;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError('Project not found.', 404));
    }

    if (user.role === 'FACULTY' && existing.facultyId !== user.userId) {
      return next(new AppError('Forbidden: You can only edit projects you manage.', 403));
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(department !== undefined && { department }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(status && { status }),
      },
    });

    sendResponse({
      res,
      message: 'Project updated successfully',
      data: { project: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const addProjectMembers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const user = req.user!;
    const { studentIds } = req.body;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return next(new AppError('Project not found.', 404));
    }

    if (user.role === 'FACULTY' && project.facultyId !== user.userId) {
      return next(new AppError('Forbidden: You do not manage this project.', 403));
    }

    const memberData = studentIds.map((userId: string) => ({
      projectId: id,
      userId,
    }));

    await prisma.projectMember.createMany({
      data: memberData,
      skipDuplicates: true,
    });

    await createBulkNotifications(studentIds, {
      title: 'Enrolled in Project',
      message: `You were added to "${project.title}" (${project.code}).`,
      type: 'TASK_ASSIGNED',
      referenceUrl: `/app/projects/${project.id}`,
    });

    sendResponse({
      res,
      message: 'Members enrolled successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const removeProjectMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.params.userId as string;
    const user = req.user!;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return next(new AppError('Project not found.', 404));
    }

    if (user.role === 'FACULTY' && project.facultyId !== user.userId) {
      return next(new AppError('Forbidden: You do not manage this project.', 403));
    }

    await prisma.projectMember.deleteMany({
      where: {
        projectId: id,
        userId,
      },
    });

    sendResponse({
      res,
      message: 'Member removed from project',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const user = req.user!;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return next(new AppError('Project not found.', 404));
    }

    if (user.role === 'FACULTY' && project.facultyId !== user.userId) {
      return next(new AppError('Forbidden: You do not manage this project.', 403));
    }

    await prisma.project.delete({ where: { id } });

    sendResponse({
      res,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
