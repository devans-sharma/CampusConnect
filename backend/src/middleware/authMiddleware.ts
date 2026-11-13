import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { prisma } from '../config/prisma.js';
import { sendError } from '../utils/apiResponse.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  studentId: string;
  role: string;
  accountStatus: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        studentId: true,
        role: true,
        accountStatus: true,
      },
    });

    if (!user) {
      return sendError(res, 'User account not found.', 401);
    }

    if (user.accountStatus === 'SUSPENDED') {
      return sendError(res, 'This account has been suspended by campus administration.', 403);
    }

    req.user = user;
    next();
  } catch (error: any) {
    return sendError(res, 'Invalid or expired authentication token.', 401);
  }
};

/**
 * Optional authentication: attaches user if valid token exists, but doesn't block if missing
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          studentId: true,
          role: true,
          accountStatus: true,
        },
      });
      if (user && user.accountStatus === 'ACTIVE') {
        req.user = user;
      }
    }
  } catch (e) {
    // Ignore error in optional auth
  }
  next();
};
