import { NotificationType } from '@prisma/client';
import { prisma } from '../config/db.js';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  referenceUrl?: string;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        referenceUrl: params.referenceUrl,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const createBulkNotifications = async (
  userIds: string[],
  data: Omit<CreateNotificationParams, 'userId'>
) => {
  try {
    if (!userIds.length) return;
    const records = userIds.map((userId) => ({
      userId,
      title: data.title,
      message: data.message,
      type: data.type,
      referenceUrl: data.referenceUrl,
    }));
    await prisma.notification.createMany({
      data: records,
    });
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
  }
};

