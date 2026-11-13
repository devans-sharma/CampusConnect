import { v2 as cloudinary } from 'cloudinary';
import { config } from './env.js';

if (config.nodeEnv === 'production') {
  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
    console.warn(
      '[Cloudinary] WARNING: Cloudinary credentials are not configured. ' +
      'Image uploads will fail in production. Set CLOUDINARY_CLOUD_NAME, ' +
      'CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.'
    );
  }
}

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export { cloudinary };
