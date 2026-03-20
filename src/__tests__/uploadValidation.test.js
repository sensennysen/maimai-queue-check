import { describe, expect, it } from 'vitest';

import { validateImageUpload, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from '../utils/uploadValidation.js';

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
});

