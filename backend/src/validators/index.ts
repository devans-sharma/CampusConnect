import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid university email address'),
  studentId: z.string().min(3, 'Student ID must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  department: z.string().min(2, 'Department is required'),
  yearOfStudy: z.coerce.number().int().min(1).max(8),
  role: z.enum(['STUDENT', 'ADMIN']).optional().default('STUDENT'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createItemSchema = z.object({
  itemName: z.string().min(3, 'Item name must be at least 3 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  itemType: z.enum(['LOST', 'FOUND']),
  publicDescription: z.string().min(10, 'Public description must be at least 10 characters'),
  privateVerificationDetails: z.string().optional(),
  location: z.string().min(3, 'Location is required'),
  dateOccurred: z.string().min(1, 'Date is required'),
  colour: z.string().optional(),
  brand: z.string().optional(),
  distinguishingFeatures: z.string().optional(),
  currentHoldingLocation: z.string().optional(),
  contactPreference: z.enum(['EMAIL', 'PHONE', 'IN_APP']).default('IN_APP'),
});

export const updateItemStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
});

export const createClaimSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  claimDescription: z.string().min(15, 'Please provide a detailed claim explanation (at least 15 characters)'),
  identifyingCharacteristics: z.string().min(5, 'Please describe unique identifying features'),
  supportingEvidence: z.string().optional(),
});

export const reviewClaimSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'ADDITIONAL_INFORMATION_REQUIRED', 'UNDER_REVIEW']),
  rejectionReason: z.string().optional(),
  verificationNotes: z.string().optional(),
}).refine(data => {
  if (data.status === 'REJECTED' && (!data.rejectionReason || data.rejectionReason.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'A rejection reason is strictly required when rejecting a claim.',
  path: ['rejectionReason'],
});

export const scheduleCollectionSchema = z.object({
  collectionLocation: z.string().min(5, 'Collection location is required (e.g., Campus Security West Desk)'),
  collectionInstructions: z.string().min(5, 'Collection instructions are required'),
  scheduledAt: z.string().min(1, 'Scheduled date and time is required'),
});

export const confirmCollectionSchema = z.object({
  handoverNotes: z.string().optional(),
});
