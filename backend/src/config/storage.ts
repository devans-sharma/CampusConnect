/**
 * Storage Adapter
 * - Development: Local Multer disk storage (./uploads)
 * - Production:  Cloudinary persistent cloud storage
 *
 * Usage:
 *   import { upload, getFileUrl } from './config/storage.js';
 *   router.post('/upload', upload.array('images', 5), handler);
 *
 *   In handler:
 *   const urls = await getFileUrls(req.files as Express.Multer.File[]);
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import { config } from './env.js';

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

// ─── Development: Local disk storage ───────────────────────────────────────────
const uploadDir = path.resolve(process.cwd(), config.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `item-${uniqueSuffix}${ext}`);
  },
});

// ─── Production: Cloudinary via memory storage + upload stream ─────────────────
const memoryStorage = multer.memoryStorage();

// ─── Export upload middleware ──────────────────────────────────────────────────
export const upload = multer({
  storage: config.nodeEnv === 'production' ? memoryStorage : diskStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 5,
  },
  fileFilter,
});

// ─── Helper: resolve file URLs after upload ────────────────────────────────────
export async function getFileUrls(files: Express.Multer.File[]): Promise<string[]> {
  if (config.nodeEnv === 'production') {
    // Validate Cloudinary is configured before attempting upload
    if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
      throw Object.assign(
        new Error(
          'Image storage is not configured. ' +
          'Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET ' +
          'in the production environment.'
        ),
        { statusCode: 503, isOperational: true }
      );
    }

    // Dynamic import to avoid loading Cloudinary in dev
    const { cloudinary } = await import('./cloudinary.js');

    const uploaded: Array<{ url: string; publicId: string }> = [];
    try {
      for (const file of files) {
        await new Promise<void>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'campusconnect/items',
              resource_type: 'image',
              transformation: [{ quality: 'auto', fetch_format: 'auto' }],
            },
            (error, result) => {
              if (error || !result) reject(error || new Error('Cloudinary upload failed'));
              else {
                uploaded.push({ url: result.secure_url, publicId: result.public_id });
                resolve();
              }
            }
          );
          uploadStream.end(file.buffer);
        });
      }
      return uploaded.map((asset) => asset.url);
    } catch (error) {
      await Promise.allSettled(uploaded.map(({ publicId }) => cloudinary.uploader.destroy(publicId)));
      throw Object.assign(new Error('One or more images could not be stored. Please try again.'), {
        statusCode: 502,
        isOperational: true,
        cause: error,
      });
    }
  }

  // Development: return local URL paths
  return files.map((file) => `/uploads/${file.filename}`);
}

export async function removeFileUrls(urls: string[]): Promise<void> {
  if (config.nodeEnv !== 'production' || urls.length === 0) return;
  const { cloudinary } = await import('./cloudinary.js');
  const publicIds = urls.flatMap((url) => {
    try {
      const pathParts = new URL(url).pathname.split('/').filter(Boolean);
      const uploadIndex = pathParts.indexOf('upload');
      if (uploadIndex < 0) return [];
      const afterUpload = pathParts.slice(uploadIndex + 1);
      const versionIndex = afterUpload.findIndex((part) => /^v\d+$/.test(part));
      if (versionIndex < 0) return [];
      const assetParts = afterUpload.slice(versionIndex + 1);
      if (assetParts.length === 0) return [];
      return [assetParts.join('/').replace(/\.[^.]+$/, '')];
    } catch {
      return [];
    }
  });
  await Promise.allSettled(publicIds.map((publicId) => cloudinary.uploader.destroy(publicId)));
}
