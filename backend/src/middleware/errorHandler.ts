import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Backend Error]', err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    return res.status(400).json({
      success: false,
      error: tooLarge ? 'Each image must be 5 MB or smaller.' : `File upload error: ${err.message}`,
    });
  }

  if (err.message === 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.') {
    return res.status(400).json({ success: false, error: err.message });
  }

  if (err.statusCode === 413) {
    return res.status(413).json({ success: false, error: 'Image files must be 5 MB or smaller.' });
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational || (err.statusCode && statusCode < 500)
    ? err.message
    : 'An unexpected error occurred on the server.';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
  });
};
