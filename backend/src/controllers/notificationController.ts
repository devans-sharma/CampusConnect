import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    return sendSuccess(res, { notifications, unreadCount });
  } catch (error: any) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification || notification.userId !== req.user.id) {
      return sendError(res, 'Notification not found.', 404);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return sendSuccess(res, updated, 'Notification marked as read.');
  } catch (error: any) {
    next(error);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });

    return sendSuccess(res, null, 'All notifications marked as read.');
  } catch (error: any) {
    next(error);
  }
};
