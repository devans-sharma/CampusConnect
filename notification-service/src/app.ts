import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import notificationRoutes from './routes/notificationRoutes.js';
import { config } from './config/env.js';
import { timingSafeEqual } from 'crypto';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan(config.nodeEnv === 'production' ? 'tiny' : 'dev'));

app.use('/api/notifications/send', (req, res, next) => {
  if (!config.serviceSecret) return config.nodeEnv === 'production'
    ? res.status(503).json({ success: false, error: 'Notification service authentication is not configured.' })
    : next();
  const supplied = req.header('x-notification-service-secret') || '';
  const expectedBuffer = Buffer.from(config.serviceSecret);
  const suppliedBuffer = Buffer.from(supplied);
  const valid = expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
  if (!valid) return res.status(401).json({ success: false, error: 'Unauthorized service request.' });
  next();
});

// Mount routes
app.use('/api/notifications', notificationRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'CampusConnect Notification Microservice',
    status: 'online',
    endpoints: {
      health: 'GET /api/notifications/health',
      send: 'POST /api/notifications/send',
    },
  });
});

export default app;
