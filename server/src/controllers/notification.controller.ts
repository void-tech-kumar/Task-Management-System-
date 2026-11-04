import { Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { sendResponse } from '../utils/apiResponse.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;

    // Check and trigger deadline notifications for student or faculty
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Find incomplete tasks due in <= 48 hours assigned to this user
    const urgentTasks = await prisma.task.findMany({
      where: {
        status: { in: ['TODO', 'IN_PROGRESS'] },
        dueDate: {
          gte: now,
          lte: in48Hours,
        },
        assignments: {
          some: { userId: user.userId },
        },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
      },
    });

    for (const task of urgentTasks) {
      const existingNotif = await prisma.notification.findFirst({
        where: {
          userId: user.userId,
          referenceUrl: `/app/tasks/${task.id}`,
          type: 'DEADLINE_APPROACHING',
        },
      });

      if (!existingNotif) {
        const hoursLeft = Math.max(1, Math.round((task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)));
        await prisma.notification.create({
          data: {
            userId: user.userId,
            title: 'Upcoming Deadline Warning',
            message: `Task "${task.title}" is due in approximately ${hoursLeft} hours!`,
            type: 'DEADLINE_APPROACHING',
            referenceUrl: `/app/tasks/${task.id}`,
          },
        });
      }
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.userId },
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.userId,
        isRead: false,
      },
    });

    sendResponse({
      res,
      data: { notifications, unreadCount },
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const user = req.user!;

    await prisma.notification.updateMany({
      where: { id, userId: user.userId },
      data: { isRead: true },
    });

    sendResponse({
      res,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;

    await prisma.notification.updateMany({
      where: { userId: user.userId, isRead: false },
      data: { isRead: true },
    });

    sendResponse({
      res,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};
