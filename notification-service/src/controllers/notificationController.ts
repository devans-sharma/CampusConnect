import { Request, Response } from 'express';
import { z } from 'zod';
import { notificationService } from '../services/notificationService.js';

const sendNotificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  recipientEmail: z.string().email().optional(),
  recipientName: z.string().optional(),
  type: z.string().min(1, 'Notification type is required'),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  metadata: z.record(z.any()).optional(),
});

export const handleSendNotification = async (req: Request, res: Response) => {
  try {
    const validatedData = sendNotificationSchema.parse(req.body);
    const result = await notificationService.processNotification(validatedData);

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Notification processed by notification microservice successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('[NotificationController] Error processing notification:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal notification service error',
      message: error.message,
    });
  }
};

export const handleHealthCheck = (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'healthy',
    service: 'CampusConnect Notification Microservice',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
};
