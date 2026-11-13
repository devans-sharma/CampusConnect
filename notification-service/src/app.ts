import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

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
