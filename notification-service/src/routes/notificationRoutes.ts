import { Router } from 'express';
import { handleSendNotification, handleHealthCheck } from '../controllers/notificationController.js';

const router = Router();

router.get('/health', handleHealthCheck);
router.post('/send', handleSendNotification);

export default router;
