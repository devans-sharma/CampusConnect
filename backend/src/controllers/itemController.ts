import { Request, Response, NextFunction } from 'express';
import { ItemService } from '../services/itemService.js';
import { createItemSchema, updateItemStatusSchema } from '../validators/index.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { prisma } from '../config/prisma.js';

export const createItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required to report an item.', 401);
    }

    const validated = createItemSchema.parse(req.body);

    // Extract uploaded files if any
    let imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      imageUrls = (req.files as Express.Multer.File[]).map(file => `/uploads/${file.filename}`);
    } else if (req.body.imageUrls && Array.isArray(req.body.imageUrls)) {
      imageUrls = req.body.imageUrls;
    }

    const primaryIndex = req.body.primaryImageIndex !== undefined 
      ? parseInt(req.body.primaryImageIndex, 10) 
      : 0;

    const result = await ItemService.createItem({
      ...validated,
      reporterId: req.user.id,
      imageUrls,
      primaryImageIndex: primaryIndex,
    });

    return sendSuccess(res, result, 'Item reported successfully!', 201);
  } catch (error: any) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export const getItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      search: req.query.search as string,
      itemType: req.query.itemType as any,
      categoryId: req.query.categoryId as string,
      location: req.query.location as string,
      status: req.query.status as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      sortBy: req.query.sortBy as any,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 12,
    };

    const currentUserId = req.user?.id;
    const userRole = req.user?.role;

    const result = await ItemService.getItems(filters, currentUserId, userRole);
    return sendSuccess(res, result);
  } catch (error: any) {
    next(error);
  }
};

export const getItemById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const userRole = req.user?.role;

    const result = await ItemService.getItemById(id, currentUserId, userRole);
    return sendSuccess(res, result);
  } catch (error: any) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export const updateItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    const { id } = req.params;
    const updated = await ItemService.updateItem(id, req.user.id, req.user.role, req.body);
    return sendSuccess(res, updated, 'Item updated successfully');
  } catch (error: any) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export const deleteItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    const { id } = req.params;
    const result = await ItemService.deleteItem(id, req.user.id, req.user.role);
    return sendSuccess(res, result);
  } catch (error: any) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export const updateItemStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    const { id } = req.params;
    const { status } = updateItemStatusSchema.parse(req.body);
    const updated = await ItemService.updateStatus(id, req.user.id, req.user.role, status);
    return sendSuccess(res, updated, `Item status updated to ${status}`);
  } catch (error: any) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
    return sendSuccess(res, categories);
  } catch (error: any) {
    next(error);
  }
};

export const uploadMedia = (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return sendError(res, 'No files were uploaded.', 400);
    }

    const files = req.files as Express.Multer.File[];
    const uploadedUrls = files.map(file => `/uploads/${file.filename}`);

    return sendSuccess(res, {
      urls: uploadedUrls,
      count: uploadedUrls.length,
    }, 'Images uploaded successfully');
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
};
