import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceSecret: process.env.NOTIFICATION_SERVICE_SECRET || '',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'CampusConnect Notifications <noreply@campusconnect.edu>',
  },
};

if (config.nodeEnv === 'production' && !config.serviceSecret) {
  console.error('[NotificationService] FATAL: NOTIFICATION_SERVICE_SECRET is required in production.');
  process.exit(1);
}
