import { Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { AppError } from '../utils/appError.js';
import { sendResponse } from '../utils/apiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Priority, TaskCategory, TaskStatus } from '@prisma/client';
import { createBulkNotifications } from '../services/notification.service.js';

export const getTasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const projectId = req.query.projectId as string | undefined;
    const status = req.query.status as TaskStatus | undefined;
    const priority = req.query.priority as Priority | undefined;
    const category = req.query.category as TaskCategory | undefined;
    const assignedToMe = req.query.assignedToMe as string | undefined;

    const whereClause: any = {};

    if (projectId) whereClause.projectId = projectId;
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (category) whereClause.category = category;

    if (user.role === 'STUDENT') {
      if (assignedToMe === 'true') {
        whereClause.assignments = {
          some: { userId: user.userId },
        };
      } else {
        whereClause.project = {
          members: {
            some: { userId: user.userId },
          },
        };
      }
    } else if (user.role === 'FACULTY') {
      whereClause.project = {
        facultyId: user.userId,
      };
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        project: {
          select: { id: true, title: true, code: true },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatarUrl: true },
            },
          },
        },
        submissions: {
          where: user.role === 'STUDENT' ? { studentId: user.userId } : undefined,
          select: {
            id: true,
            studentId: true,
            status: true,
            grade: true,
            submittedAt: true,
          },
        },
        _count: {
          select: {
            comments: true,
            submissions: true,
          },
        },
      },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'desc' }],
    });

    sendResponse({
      res,
      data: { tasks },
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            faculty: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        creator: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        assignments: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, department: true, avatarUrl: true },
            },
          },
        },
        submissions: {
          include: {
            student: {
              select: { id: true, fullName: true, email: true, avatarUrl: true },
            },
            evaluator: {
              select: { id: true, fullName: true },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: { id: true, fullName: true, role: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!task) {
      return next(new AppError('Task not found.', 404));
    }

    sendResponse({
      res,
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const {
      title,
      description,
      projectId,
      priority,
      category,
      dueDate,
      maxPoints,
      assignedStudentIds,
    } = req.body;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return next(new AppError('Project not found.', 404));
    }

    if (user.role === 'FACULTY' && project.facultyId !== user.userId) {
      return next(new AppError('Forbidden: You can only create tasks in your own projects.', 403));
    }

    const maxOrder = await prisma.task.aggregate({
      where: { projectId, status: 'TODO' },
      _max: { orderIndex: true },
    });
    const orderIndex = (maxOrder._max.orderIndex ?? -1) + 1;

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        projectId,
        creatorId: user.userId,
        priority: priority || 'MEDIUM',
        category: category || 'ASSIGNMENT',
        dueDate: new Date(dueDate),
        maxPoints: maxPoints || 100,
        orderIndex,
        assignments: assignedStudentIds?.length
          ? {
              create: assignedStudentIds.map((userId: string) => ({ userId })),
            }
          : undefined,
      },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, fullName: true } },
          },
        },
        project: {
          select: { title: true, code: true },
        },
      },
    });

    if (assignedStudentIds?.length) {
      await createBulkNotifications(assignedStudentIds, {
        title: 'New Task Assigned',
        message: `You were assigned task "${task.title}" in ${task.project.code}. Due: ${new Date(dueDate).toLocaleDateString()}.`,
        type: 'TASK_ASSIGNED',
        referenceUrl: `/app/tasks/${task.id}`,
      });
    }

    sendResponse({
      res,
      statusCode: 201,
      message: 'Task created successfully',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const user = req.user!;
    const {
      title,
      description,
      priority,
      category,
      dueDate,
      maxPoints,
      assignedStudentIds,
    } = req.body;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      return next(new AppError('Task not found.', 404));
    }

    if (user.role === 'FACULTY' && task.project.facultyId !== user.userId) {
      return next(new AppError('Forbidden: You can only update tasks in your own projects.', 403));
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority) updateData.priority = priority;
    if (category) updateData.category = category;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (maxPoints !== undefined) updateData.maxPoints = maxPoints;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    if (assignedStudentIds !== undefined) {
      await prisma.taskAssignment.deleteMany({ where: { taskId: id } });
      if (assignedStudentIds.length > 0) {
        await prisma.taskAssignment.createMany({
          data: assignedStudentIds.map((userId: string) => ({
            taskId: id,
            userId,
          })),
        });
      }
    }

    sendResponse({
      res,
      message: 'Task updated successfully',
      data: { task: updatedTask },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status, orderIndex } = req.body;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignments: true },
    });

    if (!task) {
      return next(new AppError('Task not found.', 404));
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: status as TaskStatus,
        ...(orderIndex !== undefined && { orderIndex }),
      },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
    });

    sendResponse({
      res,
      message: 'Task status updated successfully',
      data: { task: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const user = req.user!;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      return next(new AppError('Task not found.', 404));
    }

    if (user.role === 'FACULTY' && task.project.facultyId !== user.userId) {
      return next(new AppError('Forbidden: You can only delete tasks in your own projects.', 403));
    }

    await prisma.task.delete({ where: { id } });

    sendResponse({
      res,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
