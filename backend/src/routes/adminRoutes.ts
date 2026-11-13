import { Router } from 'express';
import {
  getDashboard,
  getUsers,
  toggleUserStatus,
  getAdminItems,
  getAdminClaims,
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = Router();

// Protect all admin routes with authentication + ADMIN role check
router.use(authenticate, requireRole('ADMIN'));

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.get('/items', getAdminItems);
router.get('/claims', getAdminClaims);

export default router;
