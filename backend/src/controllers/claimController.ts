import { Request, Response, NextFunction } from 'express';
import { ClaimService } from '../services/claimService.js';
import { createClaimSchema, reviewClaimSchema } from '../validators/index.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const createClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required to submit an ownership claim.', 401);
    }

    const validated = createClaimSchema.parse(req.body);
    const claim = await ClaimService.createClaim({
      ...validated,
      claimantId: req.user.id,
    });

    return sendSuccess(res, claim, 'Ownership claim submitted successfully! A reference number has been generated.', 201);
  } catch (error: any) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export const getClaims = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    const claims = await ClaimService.getClaims({
      claimantId: req.query.claimantId as string,
      itemId: req.query.itemId as string,
      status: req.query.status as string,
      currentUserId: req.user.id,
      userRole: req.user.role,
    });

    return sendSuccess(res, claims);
  } catch (error: any) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export const getClaimById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    const { id } = req.params;
    const claim = await ClaimService.getClaimById(id, req.user.id, req.user.role);
    return sendSuccess(res, claim);
  } catch (error: any) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export const reviewClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }

    const { id } = req.params;
    const validated = reviewClaimSchema.parse(req.body);
    const updated = await ClaimService.reviewClaim(id, req.user.id, req.user.role, validated);
    return sendSuccess(res, updated, `Claim has been ${validated.status.toLowerCase().replace('_', ' ')}.`);
  } catch (error: any) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};
