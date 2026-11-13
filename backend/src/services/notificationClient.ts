import axios from 'axios';
import { prisma } from '../config/prisma.js';
import { config } from '../config/env.js';

export interface DispatchNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

export class NotificationClient {
  static async send(params: DispatchNotificationParams) {
    try {
      // 1. Persist notification directly in relational database
      const dbNotification = await prisma.notification.create({
        data: {
          userId: params.userId,
          title: params.title,
          message: params.message,
          type: params.type,
          link: params.link,
          isRead: false,
        },
      });

      // 2. Look up user details for microservice dispatch (email & name)
      const recipient = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { email: true, fullName: true },
      });

      // 3. Dispatch to Notification Microservice over HTTP
      const payload = {
        userId: params.userId,
        recipientEmail: recipient?.email,
        recipientName: recipient?.fullName,
        type: params.type,
        title: params.title,
        message: params.message,
        metadata: params.metadata || {},
      };

      try {
        const response = await axios.post(`${config.notificationServiceUrl}/api/notifications/send`, payload, {
          timeout: 4000,
        });
        console.log(`[NotificationClient] Dispatched to microservice: ${response.data.message || 'Success'}`);
      } catch (microserviceError: any) {
        // Log microservice dispatch issue without throwing — in-app notification is already safely saved in DB
        console.warn(`[NotificationClient] Notice: Notification microservice dispatch skipped or offline (${microserviceError.message}). In-app notification saved successfully.`);
      }

      return dbNotification;
    } catch (error: any) {
      console.error('[NotificationClient] Failed to persist notification:', error);
      return null;
    }
  }
}
