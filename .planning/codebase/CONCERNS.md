# Codebase Concerns

**Analysis Date:** 2025-02-24

## Tech Debt

**Legacy user_roles dual-write and deprecated field:**
- Issue: `user_profiles` is primary; preferences are still synced to `user_roles` for compatibility. `user_roles.preferred_branches` is deprecated but still deleted before sync. Failure to sync is only logged with `console.warn`.
- Files: `src/services/supabase/profile.js` (lines 33–46, 36)
- Impact: Extra write path and table; if sync fails, legacy consumers may see stale data. Deprecated field lingers in schema.
- Fix approach: Migrate all consumers to `user_profiles` only, then remove sync and deprecate `user_roles.preferred_branches` in DB.

**Legacy auth storage key migration:**
- Issue: One-time migration in client from `smf-queue-auth` to `auth` runs on every load (read + conditional write + remove). Harmless but redundant after first run.
- Files: `src/services/supabase/client.js` (lines 11–16)
- Impact: Minor: a few localStorage ops per load.
- Fix approach: Run migration once (e.g. feature flag or version check), then remove block.

**Duplicate / legacy song database assets:**
- Issue: `src/assets/otoge-db_old.json` is a very large duplicate (order of 200k+ lines). `otoge-db.json` is the active asset; the `_old` copy is legacy.
- Files: `src/assets/otoge-db_old.json`
- Impact: Repo bloat, slower clones, risk of editing the wrong file.
- Fix approach: Remove `otoge-db_old.json` from the repo if no longer needed; otherwise document and gate usage.

**Bookmarklet source vs built artifact:**
- Issue: Bookmarklet exists as readable source in `src/assets/bookmarklet.js` and as minified bundle in `public/bookmarklet.js`. Sync and build path are not obvious from structure.
- Files: `src/assets/bookmarklet.js`, `public/bookmarklet.js`
- Impact: Risk of deploying stale bookmarklet if `public` is not rebuilt from `src`.
- Fix approach: Document build step for bookmarklet; ideally derive `public/bookmarklet.js` from `src/assets/bookmarklet.js` in the build (e.g. Vite asset or script).

**No automated test suite:**
- Issue: No test runner config (no Jest/Vitest) and no `*.test.*` / `*.spec.*` files in the repo.
- Files: Project root (missing `jest.config.*`, `vitest.config.*`, test files)
- Impact: Regressions and refactors are not guarded by tests; behavior is only verified manually.
- Fix approach: Introduce a test runner (e.g. Vitest for Vite), add unit tests for validation, services, and hooks; then add integration tests for critical flows.

## Known Bugs

No explicitly tagged known bugs (no TODO/FIXME/HACK in source). The only "XXX" matches are in song titles in JSON assets (e.g. "PANDORA PARADOXXX"), not code comments.

## Security Considerations

**HTML injection and dangerouslySetInnerHTML:**
- Queue rules: User-defined HTML is sanitized with DOMPurify before render. Low risk if DOMPurify is kept up to date.
- Files: `src/features/queue/components/QueueRulesModal.jsx` (lines 37–38, 72), `src/features/queue/components/QueueForm.jsx` (lines 71–73 for player names).
- Risk: If DOMPurify is bypassed or misconfigured, stored rules could lead to XSS.
- Current mitigation: `DOMPurify.sanitize(rules.rules)`; player names sanitized with `ALLOWED_TAGS: []`.
- Recommendations: Keep `dompurify` updated; consider CSP headers for the app.

**Static CSS via dangerouslySetInnerHTML:**
- Issue: Inline `<style>` content is injected with `dangerouslySetInnerHTML` in song UI. Content is static template literals, not user input.
- Files: `src/features/songs/components/SongSelectionModal.jsx` (lines 76–84), `src/features/songs/components/SongDatabase.jsx` (lines 98–106)
- Risk: Low (no user input); still uses raw HTML API.
- Recommendation: Prefer CSS-in-JS or imported CSS for responsive layout to avoid `dangerouslySetInnerHTML` for style.

**Auth and role cache in localStorage:**
- Issue: Auth session and role cache live in `localStorage` (e.g. `auth`, `user_roles_${uid}`). Client can be compromised or shared.
- Files: `src/services/supabase/client.js` (auth storage), `src/contexts/AuthContext.jsx` (lines 18–31, 204–216)
- Current mitigation: Session persistence is Supabase default; AuthContext clears role keys on logout and iterates to remove legacy keys.
- Recommendations: Rely on short-lived tokens and server-side checks; treat role cache as UX-only; avoid storing highly sensitive data in localStorage.

**Environment variables:**
- Issue: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SONG_JACKETS_URL` are exposed to the client (expected for Vite). Anon key must be restricted via Supabase RLS.
- Files: `src/services/supabase/client.js`, `src/config/maimai-constants.js`
- Recommendation: Ensure RLS and policies are strict; never expose service_role or other secrets via VITE_*.

## Performance Bottlenecks

**Large page and service files:**
- Problem: Several files exceed ~400 lines and mix many responsibilities: `PublicProfilePage.jsx` (671), `UserTable.jsx` (543), `QueueManager.jsx` (476), `profile.js` (442), `BranchEditModal.jsx` (413), `BranchList.jsx` (387), `admin.js` (369), `geolocation.js` (301).
- Files: As listed above.
- Cause: Feature growth without splitting; modals and admin tables hold a lot of inline logic.
- Improvement path: Extract subcomponents, hooks, and service helpers; split admin services by domain.

**Large JSON assets:**
- Problem: Song database JSON under `src/assets/` (e.g. `otoge-db.json`) is very large. Loaded and parsed at runtime.
- Files: `src/assets/otoge-db.json`, `src/assets/otoge-db_old.json`
- Cause: Full dataset shipped and parsed in the client.
- Improvement path: Lazy-load or chunk the dataset; serve from CDN or backend with pagination/search; remove `otoge-db_old.json` if unused.

**Realtime event rate:**
- Current: Client-side limit `eventsPerSecond: 10` is set in Supabase client (PERF-01).
- File: `src/services/supabase/client.js` (lines 26–31)
- No change needed unless product requirements increase realtime load; then tune or move heavy updates off realtime.

## Fragile Areas

**Profile service dual-write and validation:**
- Files: `src/services/supabase/profile.js`
- Why fragile: Many functions throw if `userId` is missing; dual-write to `user_profiles` and `user_roles`; 60-day profile URL rule and "URL taken" checks; file/URL handling in multiple places.
- Safe modification: Always pass validated `userId`; add unit tests for validation and error paths; consider extracting URL and file logic into small functions.

**useQueueActions hook:**
- Files: `src/hooks/useQueueActions.js`
- Why fragile: Central place for queue operations with many `catch` blocks and shared `ERRORS`; depends on branch context and Supabase.
- Safe modification: Keep errors in a single constant; ensure all callers handle thrown errors or returned error state; add tests for "no branch" and failure paths.

**Geolocation service:**
- Files: `src/services/geolocation.js`
- Why fragile: Depends on browser APIs (`navigator.permissions`, `navigator.geolocation`), timeouts, and Supabase `allowed_places`; contains commented-out debug logs.
- Safe modification: Wrap browser API usage in feature checks; consider extracting permission and "nearest branch" logic for testability; remove or gate debug logs.

**Auth and role loading:**
- Files: `src/contexts/AuthContext.jsx`
- Why fragile: Role fetch is raced with 5s timeout; roles cached in localStorage with fallback key names; logout clears multiple key patterns.
- Safe modification: Keep timeout; ensure all role consumers handle "no roles" and loading state; avoid adding more localStorage key variants.

## Scaling Limits

**Realtime:**
- Current: 10 events per second per client (client config).
- Limit: High-frequency updates (e.g. many queue changes) could hit the limit or increase server load.
- Scaling path: Increase only with backend capacity; consider batching or moving some updates to REST.

**Admin lists:**
- No pagination was evident in admin components (e.g. UserTable, BranchList). Large datasets could slow the UI and increase payload size.
- Files: `src/features/admin/components/UserTable.jsx`, `src/features/admin/components/BranchList.jsx`
- Scaling path: Add server-side pagination and filtering; lazy-load or virtualize long lists.

## Dependencies at Risk

No specific at-risk dependencies identified. Stack is current (React 19, Vite 7, Supabase client 2.x, Mantine 8). Keep `dompurify` and `@supabase/supabase-js` updated for security.

## Missing Critical Features

None identified as blocking from this review. Feature flags and branch/location logic are present.

## Test Coverage Gaps

**Entire application:**
- What's not tested: All features—auth, queue, profile, admin, geolocation, song DB, bookmarklet, validation, hooks.
- Files: All under `src/`
- Risk: Regressions and refactors are untested; fixes can introduce new bugs.
- Priority: High for core flows (auth, queue, profile updates); medium for admin and song DB; lower for bookmarklet and static UI.

---

*Concerns audit: 2025-02-24*
