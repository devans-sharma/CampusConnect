import { Router } from 'express';
import {
  createClaim,
  getClaims,
  getClaimById,
  reviewClaim,
} from '../controllers/claimController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authenticate, createClaim);
router.get('/', authenticate, getClaims);
router.get('/:id', authenticate, getClaimById);
router.patch('/:id/review', authenticate, reviewClaim);

export default router;
