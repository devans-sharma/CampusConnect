import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number.parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'campus_connect_jwt_secret_dev_key_2026_xyz987'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5001',
  notificationServiceSecret: process.env.NOTIFICATION_SERVICE_SECRET || '',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
};

// Validate required environment variables in production
if (config.nodeEnv === 'production') {
  const required: string[] = [
    'JWT_SECRET', 'DATABASE_URL', 'FRONTEND_URL', 'NOTIFICATION_SERVICE_URL',
    'NOTIFICATION_SERVICE_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
  ];
  const missing = required.filter((key) => !process.env[key]);
  if ((process.env.JWT_SECRET || '').length < 32) missing.push('JWT_SECRET (minimum 32 characters)');
  if (!process.env.DATABASE_URL?.startsWith('postgresql://') && !process.env.DATABASE_URL?.startsWith('postgres://')) {
    missing.push('DATABASE_URL (must use PostgreSQL in production)');
  }
  if (missing.length > 0) {
    console.error(`[Backend] FATAL: Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

}
