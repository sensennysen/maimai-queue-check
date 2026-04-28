# Phase 06: Service-layer upload validation - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning
**Source:** User Request (SEC-04)

<domain>
## Phase Boundary

This phase delivers hardened service-layer validation for image uploads in `posts.js` and `user.js`. It ensures that every upload follows a strict MIME-to-extension mapping, adheres to size limits, and uses a centralized validation utility. It also fixes a bug where `BUCKETS.POST_IMAGES` was missing from the service constants.

</domain>

<decisions>
## Implementation Decisions

### [SEC] Validation Centralization
- [Requirement] All image upload validation must go through `src/utils/uploadValidation.js`.
- [Requirement] MIME type allowlist is restricted to `image/jpeg`, `image/png`, `image/gif`, `image/webp`.
- [Requirement] File size limit is 5MB.
- [Requirement] Extension normalization must derive the extension from the MIME type, not the user-provided filename.

### [SEC] Service Hardening
- [Requirement] Fix `BUCKETS.POST_IMAGES` in `src/constants/database.js` to point to `'community-media'`.
- [Requirement] Update both `postsService.uploadPostImage` and `userService.uploadProfilePicture` to use the same centralized extension normalization.

### Claude's Discretion
- [Discretion] Move `extensionByMimeType` mapping to `uploadValidation.js` to ensure consistency.
- [Discretion] Add `getNormalizedFileExtension` as a helper function.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### [Service Layer]
- `src/services/supabase/posts.js` — [Upload logic implementation]
- `src/services/supabase/user.js` — [Upload logic implementation]
- `src/constants/database.js` — [Bucket constants]

### [Utilities]
- `src/utils/uploadValidation.js` — [Validation logic]
- `src/__tests__/uploadValidation.test.js` — [Validation unit tests]

</canonical_refs>

<specifics>
## Specific Ideas

- The `extensionByMimeType` mapping currently exists in both service files; it should be unified.
- `BUCKETS.POST_IMAGES` is missing from `database.js` but used in `posts.js`.

</specifics>

<deferred>
## Deferred Ideas

- None — SEC-04 covers the entire phase scope for upload hardening.

</deferred>

---

*Phase: 06-service-layer-upload-validation*
*Context gathered: 2026-03-20*
