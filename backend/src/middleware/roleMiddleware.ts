import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse.js';

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Access denied. You do not have permission to perform this administrative action.', 403);
    }

    next();
  };
};
