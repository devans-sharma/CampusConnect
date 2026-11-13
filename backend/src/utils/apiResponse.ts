import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, message?: string, statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message: message || 'Operation completed successfully',
  });
};

export const sendError = (res: Response, message: string, statusCode: number = 400, details?: any) => {
  return res.status(statusCode).json({
    success: false,
    error: message,
    details: details || null,
  });
};
