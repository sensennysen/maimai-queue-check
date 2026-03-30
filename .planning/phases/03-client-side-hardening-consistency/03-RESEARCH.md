# Phase 03: Client-Side Hardening Consistency - Research

**Researched:** 2026-03-20  
**Domain:** DOMPurify standardization across rich-text UI surfaces; service-layer image upload validation for Supabase storage uploads  
**Confidence:** MEDIUM

<sec_03>
## SEC-03: Standardize DOMPurify configuration

**Observed current behavior (in repo):**
- `src/components/profile/IntroductionCard.jsx` imports `dompurify` directly and uses a local `ALLOWED_TAGS` / `ALLOWED_ATTR` allowlist.
- `src/features/queue/components/QueueForm.jsx` imports `dompurify` directly and uses an ad-hoc config (`ALLOWED_TAGS: []`) to sanitize player names.
- `src/features/queue/components/QueueRulesModal.jsx` imports `dompurify` directly with default sanitization (no shared pinned policy).
- A centralized sanitizer boundary exists but is not consistently used:
  - `src/utils/sanitizeHtml.js` (DOMPurify + pinned forbids, plus a deterministic JSDOM setup for tests).

**Why this matters:**
- Multiple component-local DOMPurify configs lead to drift (different allowed tags/attrs, different event handler protections, different link behavior).
- Drift is especially risky in rich-text UIs that use `dangerouslySetInnerHTML`.

**Recommended approach (standardize through a single wrapper):**
1. Upgrade `src/utils/sanitizeHtml.js` into the single policy surface for the client:
   - Export `sanitizeHtml(dirtyHtml, { mode })` with stable modes:
     - `mode: "rich"` (default): use the pinned “rich HTML” policy (FORBID_TAGS + FORBID_ATTR, JSDOM-based deterministic DOMPurify).
     - `mode: "text"`: enforce plain-text sanitization (strip all tags/attrs via `ALLOWED_TAGS: []` / `ALLOWED_ATTR: []`).
2. Remove direct `dompurify` imports from UI surfaces and route sanitization through the wrapper:
   - `IntroductionCard.jsx`: use `sanitizeHtml(introduction, { mode: "rich" })`.
   - `QueueRulesModal.jsx`: use `sanitizeHtml(rules.rules, { mode: "rich" })`.
   - `QueueForm.jsx`: sanitize player names via `sanitizeHtml(text.trim(), { mode: "text" })`.
3. Tighten test coverage so the standardized policy doesn’t regress:
   - Extend `src/__tests__/sanitizeHtml.test.js` to assert `mode: "text"` removes tags.
   - Keep existing assertions for script removal and event handler stripping.
</sec_03>

<sec_04>
## SEC-04: Service-layer upload validation

**Observed current behavior (in repo):**
- `src/services/supabase/user.js#uploadProfilePicture`:
  - Uploads directly to Supabase Storage based on `file.name` extension.
  - No service-layer validation on MIME type or file size.
- `src/services/supabase/posts.js#uploadPostImage`:
  - Same pattern: trusts `file.name` extension and uploads without validating `file.type` or size.
- UI components may show client-side errors, but SEC-04 requires service-layer validation so invalid files cannot be uploaded via other client entry points.

**Recommended approach:**
1. Create a small, shared validator in the service layer:
   - `src/utils/uploadValidation.js`
   - Export `validateImageUpload(file)` that:
     - Enforces `MAX_FILE_SIZE` (repo uses 5MB in `src/utils/validation.js`).
     - Enforces `ALLOWED_IMAGE_TYPES`:
       - `image/jpeg`, `image/png`, `image/gif`, `image/webp`.
     - Validates that the input has `size` and `type` and throws clear errors when invalid.
2. Update both service upload methods to call the validator before any storage upload:
   - `userService.uploadProfilePicture(userId, file)`
   - `postsService.uploadPostImage(userId, file)`
3. Ensure Storage upload metadata is consistent:
   - Pass `contentType: file.type` to Supabase `storage.upload(...)`.
4. Add unit tests (deterministic; no Supabase required):
   - `src/__tests__/uploadValidation.test.js` for allowed/disallowed types and size rejection.
</sec_04>

<sources>
## Sources
- Repo policy constants in `src/utils/validation.js` (MAX_FILE_SIZE + ALLOWED_IMAGE_TYPES)
- Existing sanitizer boundary design in `src/utils/sanitizeHtml.js` (JSDOM + pinned forbids + unit tests)
</sources>

## Validation Architecture

Phase 3 is successful when:

### Required artifacts
- `src/utils/sanitizeHtml.js`:
  - exports `sanitizeHtml(dirtyHtml, { mode })`
  - supports `mode: "rich"` (default) and `mode: "text"`
- UI surfaces no longer import `dompurify` directly for rendering/sanitization:
  - `src/components/profile/IntroductionCard.jsx`
  - `src/features/queue/components/QueueForm.jsx`
  - `src/features/queue/components/QueueRulesModal.jsx`
- Upload validation exists in the service layer:
  - `src/utils/uploadValidation.js`
  - `user.js#uploadProfilePicture` calls `validateImageUpload(file)` before storage upload
  - `posts.js#uploadPostImage` calls `validateImageUpload(file)` before storage upload
- Tests exist and are runnable locally (deterministic, no live Supabase):
  - `src/__tests__/sanitizeHtml.test.js`
  - `src/__tests__/uploadValidation.test.js`

### Green commands (proof)
- `npm test`
- `npm run lint`
- `npm run build`

