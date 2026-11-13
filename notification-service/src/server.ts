import app from './app.js';
import { config } from './config/env.js';

app.listen(config.port, '0.0.0.0', () => {
  console.log(`[NotificationMicroservice] Running independently on port ${config.port}`);
  console.log(`[NotificationMicroservice] Health check at http://localhost:${config.port}/api/notifications/health`);
});
