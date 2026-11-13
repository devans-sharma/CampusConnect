import { Request, Response, NextFunction } from 'express';
import { CollectionService } from '../services/collectionService.js';
import { scheduleCollectionSchema, confirmCollectionSchema } from '../validators/index.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const scheduleCollection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    const { claimId } = req.body;
    if (!claimId) {
      return sendError(res, 'Claim ID is required to schedule collection.', 400);
    }

    const validated = scheduleCollectionSchema.parse(req.body);
    const collection = await CollectionService.scheduleCollection({
      claimId,
      schedulerId: req.user.id,
      schedulerRole: req.user.role,
      collectionLocation: validated.collectionLocation,
      collectionInstructions: validated.collectionInstructions,
      scheduledAt: validated.scheduledAt,
    });

    return sendSuccess(res, collection, 'Collection scheduled successfully.', 201);
  } catch (error: any) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export const confirmCollection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    const { id } = req.params;
    const validated = confirmCollectionSchema.parse(req.body);
    const confirmed = await CollectionService.confirmCollection(
      id,
      req.user.id,
      req.user.role,
      validated.handoverNotes
    );

    return sendSuccess(res, confirmed, 'Item collection confirmed! Status updated to RETURNED.');
  } catch (error: any) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export const getCollectionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    const { id } = req.params;
    const collection = await CollectionService.getCollectionById(id, req.user.id, req.user.role);
    return sendSuccess(res, collection);
  } catch (error: any) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};
