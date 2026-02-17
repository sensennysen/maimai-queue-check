import { z } from 'zod';

// Config constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * User Profile Schemas
 */
export const userProfileSchema = z.object({
  displayName: z.string()
    .min(1, 'Display name is required')
    .max(20, 'Display name must be 20 characters or less')
    .trim()
    .optional(),
  branchIds: z.array(z.number().int()).optional(),
  maimaiDxName: z.string()
    .max(20, 'Maimai DX name must be 20 characters or less')
    .trim()
    .nullable()
    .optional()
});

/**
 * Queue Entry Schemas
 */
export const queueEntrySchema = z.object({
  player1: z.string()
    .min(1, 'Player 1 name is required')
    .max(10, 'Player names must be 10 characters or less')
    .trim(),
  player2: z.string()
    .max(10, 'Player names must be 10 characters or less')
    .trim()
    .optional()
    .or(z.literal('')),
  branchId: z.number().int(),
  cabinetNum: z.number().int().min(1),
  orderPosition: z.number().int()
});

/**
 * Contact Report Schemas
 */
export const contactReportSchema = z.object({
  report_type: z.enum(['bug', 'feature', 'other', 'security']),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be 1000 characters or less')
    .trim(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  file: z.any()
    .refine((file) => {
      if (!file) return true; // Optional
      return file.size <= MAX_FILE_SIZE;
    }, `File size must be less than 5MB`)
    .refine((file) => {
      if (!file) return true; // Optional
      return ALLOWED_IMAGE_TYPES.includes(file.type);
    }, 'Only .jpg, .png, .gif, and .webp formats are supported')
    .optional()
});

/**
 * Helper to validate data against a schema
 * @param {z.ZodSchema} schema 
 * @param {any} data 
 * @returns {{success: boolean, data?: any, error?: string}}
 */
export const validateData = (schema, data) => {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return the first error message
      const message = error.errors?.[0]?.message || 'Validation error';
      return { success: false, error: message };
    }
    console.error('Unexpected validation error:', error);
    return { success: false, error: 'Validation failed' };
  }
};
