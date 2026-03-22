import { describe, expect, it } from 'vitest';

import { 
  validateImageUpload, 
  ALLOWED_IMAGE_TYPES, 
  MAX_IMAGE_SIZE_BYTES,
  getNormalizedFileExtension
} from '../utils/uploadValidation.js';

describe('validateImageUpload', () => {
  it('throws for unsupported MIME type', () => {
    expect(() => validateImageUpload({ size: 123, type: 'image/bmp' }))
      .toThrow(/Unsupported file type/);
  });

  it('throws when file size is above the limit', () => {
    expect(() => validateImageUpload({ size: MAX_IMAGE_SIZE_BYTES + 1, type: 'image/png' }))
      .toThrow(/File too large/);
  });

  it('does not throw for allowed MIME types under the size limit', () => {
    for (const type of ALLOWED_IMAGE_TYPES) {
      expect(() => validateImageUpload({ size: MAX_IMAGE_SIZE_BYTES, type })).not.toThrow();
    }
  });

  it('throws if MIME type is missing from extension mapping', () => {
    // Mock type that is in ALLOWED but missing from EXTENSIONS (if they drift)
    expect(() => validateImageUpload({ size: 123, type: 'image/svg+xml' }))
      .toThrow(/Unsupported file type/);
  });
});

describe('getNormalizedFileExtension', () => {
  it('returns correct extension for valid MIME types', () => {
    expect(getNormalizedFileExtension('image/jpeg')).toBe('jpg');
    expect(getNormalizedFileExtension('image/png')).toBe('png');
    expect(getNormalizedFileExtension('image/webp')).toBe('webp');
    expect(getNormalizedFileExtension('image/gif')).toBe('gif');
  });

  it('returns null for unsupported MIME types', () => {
    expect(getNormalizedFileExtension('application/pdf')).toBeNull();
    expect(getNormalizedFileExtension('image/bmp')).toBeNull();
  });
});

