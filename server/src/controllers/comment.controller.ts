import { Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { AppError } from '../utils/appError.js';
import { sendResponse } from '../utils/apiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { createBulkNotifications } from '../services/notification.service.js';

export const getComments = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;

    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, fullName: true, role: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    sendResponse({
      res,
      data: { comments },
    });
  } catch (error) {
    next(error);
  }
};

export const createComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.taskId as string;
    const user = req.user!;
    const { content } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: true,
        project: true,
      },
    });

    if (!task) {
      return next(new AppError('Task not found.', 404));
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId: user.userId,
        content,
      },
      include: {
        user: {
          select: { id: true, fullName: true, role: true, avatarUrl: true },
        },
      },
    });

    // Notify other assignees + task creator + faculty owner
    const recipientIds = new Set<string>();
    task.assignments.forEach((a) => {
      if (a.userId !== user.userId) recipientIds.add(a.userId);
    });
    if (task.creatorId !== user.userId) recipientIds.add(task.creatorId);
    if (task.project.facultyId !== user.userId) recipientIds.add(task.project.facultyId);

    if (recipientIds.size > 0) {
      await createBulkNotifications(Array.from(recipientIds), {
        title: 'New Comment on Task',
        message: `${user.fullName} commented on "${task.title}": "${content.slice(0, 60)}${content.length > 60 ? '...' : ''}"`,
        type: 'COMMENT_POSTED',
        referenceUrl: `/app/tasks/${task.id}`,
      });
    }

    sendResponse({
      res,
      statusCode: 201,
      message: 'Comment posted',
      data: { comment },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const user = req.user!;

    const comment = await prisma.taskComment.findUnique({ where: { id } });
    if (!comment) {
      return next(new AppError('Comment not found.', 404));
    }

    if (comment.userId !== user.userId && user.role !== 'ADMIN') {
      return next(new AppError('Forbidden: You can only delete your own comments.', 403));
    }

    await prisma.taskComment.delete({ where: { id } });

    sendResponse({
      res,
      message: 'Comment deleted',
    });
  } catch (error) {
    next(error);
  }
};
