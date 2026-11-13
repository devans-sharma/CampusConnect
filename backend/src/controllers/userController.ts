import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getMyItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    const items = await prisma.item.findMany({
      where: { reporterId: req.user.id },
      include: {
        category: true,
        images: true,
        claims: {
          include: {
            claimant: {
              select: {
                id: true,
                fullName: true,
                email: true,
                studentId: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, items);
  } catch (error: any) {
    next(error);
  }
};

export const getMyClaims = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    const claims = await prisma.claim.findMany({
      where: { claimantId: req.user.id },
      include: {
        item: {
          include: {
            category: true,
            images: true,
          },
        },
        collection: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, claims);
  } catch (error: any) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    const { fullName, department, yearOfStudy, profileImage } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName: fullName || undefined,
        department: department || undefined,
        yearOfStudy: yearOfStudy ? parseInt(yearOfStudy, 10) : undefined,
        profileImage: profileImage || undefined,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        studentId: true,
        department: true,
        yearOfStudy: true,
        role: true,
        profileImage: true,
      },
    });

    return sendSuccess(res, updated, 'Profile updated successfully.');
  } catch (error: any) {
    next(error);
  }
};
