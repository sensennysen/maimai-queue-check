# Phase 06: Service-layer upload validation - Research

**Date:** 2026-03-20
**Requirement:** SEC-04

## Research Summary

### Current Implementation
- **Validation Utility**: `src/utils/uploadValidation.js` contains a `validateImageUpload` function that checks `size` and `type` against `MAX_IMAGE_SIZE_BYTES` (5MB) and `ALLOWED_IMAGE_TYPES`.
- **Services**:
    - `src/services/supabase/posts.js` and `src/services/supabase/user.js` both call `validateImageUpload(file)`.
    - Both services duplicate an `extensionByMimeType` object and logic to generate a `fileName` using `Date.now()`.
- **Constants**:
    - `src/constants/database.js` defines `BUCKETS` but lacks `POST_IMAGES`.
    - `posts.js` attempts to use `BUCKETS.POST_IMAGES`, which leads to an undefined bucket name.

### Findings & Nuances
1. **SSRF/Injection Mitigation**: By generating the `fileName` on the server-side as `${userId}/${Date.now()}.${fileExt}`, we effectively ignore any malicious characters or paths in the user-provided filename.
2. **Missing Constant**: `BUCKETS.POST_IMAGES` should be added to `database.js` and should likely point to `community-media` based on the context of post attachments.
3. **Redundancy**: Centralizing the extension mapping ensures that if we support new image types (e.g., `image/avif`), we only need to update one file.

## Validation Architecture

### Dimension 8: Verification Hooks
- **Unit Testing**: `src/__tests__/uploadValidation.test.js` already uses `vitest` to verify basic constraints. We should expand it to cover the new `getNormalizedFileExtension` helper.
- **Integration/Dry-Run**: A manual script to test service methods with a mock File object will ensure the e2e flow (validation -> extension -> upload) works even without a real Supabase connection in the test environment (using vitest mocks).

---

*Phase: 06-service-layer-upload-validation*
*Research completed: 2026-03-20*
