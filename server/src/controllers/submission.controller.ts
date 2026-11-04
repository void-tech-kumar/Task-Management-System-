import { Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { AppError } from '../utils/appError.js';
import { sendResponse } from '../utils/apiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createNotification } from '../services/notification.service.js';

export const submitTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;
    const user = req.user!;
    const { content, attachmentUrl } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: { id: true, title: true, facultyId: true },
        },
        assignments: true,
      },
    });

    if (!task) {
      return next(new AppError('Task not found.', 404));
    }

    // Verify student is assigned to this task or enrolled in project
    const isAssigned = task.assignments.some((a) => a.userId === user.userId);
    if (!isAssigned && user.role === 'STUDENT') {
      return next(new AppError('Forbidden: You are not assigned to this task.', 403));
    }

    // Upsert submission
    const submission = await prisma.taskSubmission.upsert({
      where: {
        taskId_studentId: {
          taskId,
          studentId: user.userId,
        },
      },
      update: {
        content,
        attachmentUrl: attachmentUrl || null,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      create: {
        taskId,
        studentId: user.userId,
        content,
        attachmentUrl: attachmentUrl || null,
        status: 'SUBMITTED',
      },
      include: {
        task: { select: { title: true } },
      },
    });

    // Move task status to IN_REVIEW if currently TODO or IN_PROGRESS
    if (task.status === 'TODO' || task.status === 'IN_PROGRESS') {
      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'IN_REVIEW' },
      });
    }

    // Notify faculty owner
    await createNotification({
      userId: task.project.facultyId,
      title: 'New Student Submission',
      message: `${user.fullName} submitted work for "${task.title}".`,
      type: 'TASK_ASSIGNED',
      referenceUrl: `/app/evaluations`,
    });

    sendResponse({
      res,
      statusCode: 201,
      message: 'Deliverable submitted successfully',
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskSubmissions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;

    const submissions = await prisma.taskSubmission.findMany({
      where: { taskId },
      include: {
        student: {
          select: { id: true, fullName: true, email: true, department: true, avatarUrl: true },
        },
        evaluator: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    sendResponse({
      res,
      data: { submissions },
    });
  } catch (error) {
    next(error);
  }
};

export const getMySubmissions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;

    const submissions = await prisma.taskSubmission.findMany({
      where: { studentId: user.userId },
      include: {
        task: {
          include: {
            project: {
              select: { id: true, title: true, code: true },
            },
          },
        },
        evaluator: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    sendResponse({
      res,
      data: { submissions },
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingEvaluations = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;

    const whereClause: any = {
      status: 'SUBMITTED',
    };

    if (user.role === 'FACULTY') {
      whereClause.task = {
        project: {
          facultyId: user.userId,
        },
      };
    }

    const pending = await prisma.taskSubmission.findMany({
      where: whereClause,
      include: {
        task: {
          include: {
            project: {
              select: { id: true, title: true, code: true },
            },
          },
        },
        student: {
          select: { id: true, fullName: true, email: true, department: true, avatarUrl: true },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });

    sendResponse({
      res,
      data: { pending },
    });
  } catch (error) {
    next(error);
  }
};

export const evaluateSubmission = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const user = req.user!;
    const { grade, feedback, status } = req.body;

    const submission = await prisma.taskSubmission.findUnique({
      where: { id },
      include: {
        task: {
          include: { project: true },
        },
      },
    });

    if (!submission) {
      return next(new AppError('Submission not found.', 404));
    }

    if (user.role === 'FACULTY' && submission.task.project.facultyId !== user.userId) {
      return next(new AppError('Forbidden: You can only evaluate submissions for your own courses.', 403));
    }

    if (grade > submission.task.maxPoints) {
      return next(
        new AppError(`Grade (${grade}) cannot exceed task maximum points (${submission.task.maxPoints}).`, 400)
      );
    }

    const updated = await prisma.taskSubmission.update({
      where: { id },
      data: {
        grade,
        feedback,
        status: status || 'EVALUATED',
        evaluatorId: user.userId,
        evaluatedAt: new Date(),
      },
      include: {
        student: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (status === 'EVALUATED') {
      await prisma.task.update({
        where: { id: submission.taskId },
        data: { status: 'COMPLETED' },
      });
    }

    // Send notification to student
    await createNotification({
      userId: submission.studentId,
      title: 'Task Submission Evaluated',
      message: `Your work for "${submission.task.title}" has been evaluated: Grade ${grade}/${submission.task.maxPoints}. Feedback: "${feedback}".`,
      type: 'SUBMISSION_EVALUATED',
      referenceUrl: `/app/my-submissions`,
    });

    sendResponse({
      res,
      message: 'Submission evaluated successfully',
      data: { submission: updated },
    });
  } catch (error) {
    next(error);
  }
};
