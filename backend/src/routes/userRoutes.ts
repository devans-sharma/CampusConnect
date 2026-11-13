import { Router } from 'express';
import { getMyItems, getMyClaims, updateProfile } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/me/items', authenticate, getMyItems);
router.get('/me/claims', authenticate, getMyClaims);
router.put('/me/profile', authenticate, updateProfile);

export default router;
