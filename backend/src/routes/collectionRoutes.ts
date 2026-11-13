import { Router } from 'express';
import {
  scheduleCollection,
  confirmCollection,
  getCollectionById,
} from '../controllers/collectionController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/schedule', authenticate, scheduleCollection);
router.patch('/:id/confirm', authenticate, confirmCollection);
router.get('/:id', authenticate, getCollectionById);

export default router;
