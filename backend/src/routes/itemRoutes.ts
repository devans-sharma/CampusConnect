import { Router } from 'express';
import {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  updateItemStatus,
  getCategories,
  uploadMedia,
} from '../controllers/itemController.js';
import { authenticate, optionalAuth } from '../middleware/authMiddleware.js';
import { upload } from '../config/multer.js';

const router = Router();

// Categories
router.get('/categories', getCategories);

// Upload images endpoint (up to 5 images)
router.post('/upload', authenticate, upload.array('images', 5), uploadMedia);

// Items CRUD
router.get('/', optionalAuth, getItems);
router.get('/:id', optionalAuth, getItemById);
router.post('/', authenticate, upload.array('images', 5), createItem);
router.put('/:id', authenticate, updateItem);
router.delete('/:id', authenticate, deleteItem);
router.patch('/:id/status', authenticate, updateItemStatus);

export default router;
