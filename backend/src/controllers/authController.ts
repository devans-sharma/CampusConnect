import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { registerSchema, loginSchema } from '../validators/index.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = registerSchema.parse(req.body);
    const result = await AuthService.register(validated);
    return sendSuccess(res, result, 'Registration successful. Welcome to CampusConnect!', 201);
  } catch (error: any) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await AuthService.login(validated.email, validated.password);
    return sendSuccess(res, result, 'Logged in successfully');
  } catch (error: any) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }
    const user = await AuthService.getMe(req.user.id);
    return sendSuccess(res, user);
  } catch (error: any) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

export const logout = (req: Request, res: Response) => {
  return sendSuccess(res, null, 'Logged out successfully');
};
