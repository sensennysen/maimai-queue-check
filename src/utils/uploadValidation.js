// Centralized file upload validation for Supabase storage uploads.
// Service-layer validation ensures security regardless of UI behavior.

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export function validateImageUpload(file) {
  if (!file) throw new Error('File is required');

  const { size, type } = file;

  if (typeof size !== 'number' || !type) {
    throw new Error('Missing file size or type');
  }

  if (size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('File too large');
  }

  if (!ALLOWED_IMAGE_TYPES.includes(type)) {
    throw new Error('Unsupported file type');
  }

  return true;
}

