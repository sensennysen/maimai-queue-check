import { z } from 'zod';

// Config constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * User Profile Schemas
 */
export const userProfileSchema = z.object({
  display_name: z.string()
    .min(1, 'Display name is required')
    .max(20, 'Display name must be 20 characters or less')
    .trim()
    .optional(),
  queue_name: z.string()
    .min(1, 'Queue name is required')
    .max(10, 'Queue name must be 10 characters or less')
    .trim()
    .optional()
    .or(z.literal('')),
  branch_ids: z.array(z.number().int()).optional(),
  maimai_dx_name: z.string()
    .max(20, 'Maimai DX name must be 20 characters or less')
    .trim()
    .nullable()
    .optional(),
  slug: z.string()
    .min(3, 'Profile URL must be at least 3 characters')
    .max(20, 'Profile URL must be 20 characters or less')
    .regex(/^[a-zA-Z0-9-]+$/, 'Profile URL can only contain letters, numbers, and hyphens')
    .trim()
    .lowercase()
    .optional()
    .or(z.literal('')),
  introduction: z.string()
    .max(4000, 'Introduction is too long')
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
  branch_id: z.number().int(),
  cabinet_num: z.number().int().min(1),
  order_position: z.number().int()
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
  file: z.instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, `File size must be less than 5MB`)
    .refine((file) => ALLOWED_IMAGE_TYPES.includes(file.type), 'Only .jpg, .png, .gif, and .webp formats are supported')
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
