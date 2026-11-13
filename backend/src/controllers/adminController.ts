import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/adminService.js';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await AdminService.getDashboardMetrics();
    return sendSuccess(res, metrics);
  } catch (error: any) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = {
      search: req.query.search as string,
      role: req.query.role as string,
      status: req.query.status as string,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 15,
    };

    const result = await AdminService.getUsers(params);
    return sendSuccess(res, result);
  } catch (error: any) {
    next(error);
  }
};

export const toggleUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      return sendError(res, 'Status must be ACTIVE or SUSPENDED.', 400);
    }

    const updated = await AdminService.toggleUserStatus(id, req.user.id, status);
    return sendSuccess(res, updated, `User account ${status.toLowerCase()} successfully.`);
  } catch (error: any) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export const getAdminItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.itemType) where.itemType = req.query.itemType;
    if (req.query.status) where.status = req.query.status;
    if (req.query.search) {
      const term = (req.query.search as string).trim();
      where.OR = [
        { itemName: { contains: term } },
        { referenceNumber: { contains: term } },
        { location: { contains: term } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          images: true,
          reporter: {
            select: { id: true, fullName: true, email: true, studentId: true, department: true },
          },
          _count: { select: { claims: true } },
        },
      }),
      prisma.item.count({ where }),
    ]);

    return sendSuccess(res, {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getAdminClaims = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.status) where.status = req.query.status;

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          item: {
            include: { category: true, images: true, reporter: { select: { id: true, fullName: true, email: true } } },
          },
          claimant: {
            select: { id: true, fullName: true, email: true, studentId: true, department: true, yearOfStudy: true },
          },
          collection: true,
        },
      }),
      prisma.claim.count({ where }),
    ]);

    return sendSuccess(res, {
      claims,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    next(error);
  }
};
