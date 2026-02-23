# Codebase Concerns

**Analysis Date:** 2025-02-23

## Tech Debt

**Monolithic Supabase service:**
- Issue: All Supabase-backed logic lives in a single file `src/services/supabase.js` (~1,642 lines, 81+ `.from()`/`.rpc()` usages). The file exports many service objects (authService, rolesService, branchService, queueService, rulesService, profileService, favoritesService, playlistService, adminService, requestService, notificationService, etc.) and is the primary data layer.
- Files: `src/services/supabase.js`
- Impact: Hard to navigate, test in isolation, or tree-shake; merge conflicts and cognitive load increase as features grow.
- Fix approach: Split by domain into modules under e.g. `src/services/supabase/` (auth.js, roles.js, branches.js, queue.js, rules.js, profiles.js, favorites.js, playlists.js, admin.js, requests.js, notifications.js) and re-export a thin facade or keep a single client export in `supabase.js`.

**ESLint disables:**
- Issue: Several intentional disables for hooks and refresh rules.
- Files: `src/components/layout/BranchSelector.jsx` (react-hooks/exhaustive-deps), `src/pages/PublicProfilePage.jsx` (react-hooks/exhaustive-deps), `src/hooks/useMouseDragScroll.js` (react-hooks/immutability), `src/contexts/ThemeContext.jsx` (react-refresh/only-export-components), `src/contexts/BranchContext.jsx` (react-refresh/only-export-components), `src/components/modals/AccessRequestModal.jsx` (react-hooks/exhaustive-deps).
- Impact: Dependency arrays and component export patterns may drift from best practice; future refactors might miss hidden dependencies.
- Fix approach: Where possible, fix the underlying dependency (e.g. add missing deps or extract stable callbacks) and remove the disable; where the disable is intentional (e.g. ref callback identity), add a short comment explaining why.

**Weak validation for file uploads:**
- Issue: Contact report file field uses `z.any()` with refine for size/type only.
- Files: `src/utils/validation.js` (contactReportSchema, `file: z.any()`).
- Impact: No type narrowing for the file object; typos or wrong shapes are not caught by schema.
- Fix approach: Replace with a schema that accepts `File | undefined` or a branded type and keep the same refines.

**Swallowed promise rejections:**
- Issue: Queue fetch errors in realtime subscription path are ignored.
- Files: `src/hooks/useQueueData.js` (`.catch(() => {})` on `queueService.getQueueEntries`).
- Impact: Failures when refreshing queue after realtime events are silent; debugging is harder.
- Fix approach: At minimum log the error; optionally surface a non-blocking error state or retry.

## Known Bugs

**getUserRoles API mismatch:**
- Symptoms: No runtime error, but second argument is ignored. `rolesService.getUserRoles(userId)` accepts one parameter; callers sometimes pass two.
- Files: `src/contexts/AuthContext.jsx` calls `rolesService.getUserRoles(user.id, branchId)`; `src/services/supabase.js` defines `getUserRoles(userId)` only.
- Trigger: Normal auth/roles refresh flow.
- Workaround: None required for correctness; `branchId` is simply unused. Align call sites with the single-argument API or extend the service to use branchId if branch-scoped roles are desired.

## Security Considerations

**Client-side Supabase config:**
- Risk: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are baked into the client bundle. Anon key is intended to be public but must be protected by Row Level Security (RLS) and policies.
- Files: `src/services/supabase.js` (env read, client creation).
- Current mitigation: App throws at startup if env vars are missing; all data access is via Supabase client. Security depends entirely on Supabase RLS and auth.
- Recommendations: Ensure RLS is enabled and policies are reviewed for every table; do not store secrets in VITE_* env vars.

**dangerouslySetInnerHTML usage:**
- Risk: XSS if user-controlled or unsanitized content is rendered.
- Files: `src/features/queue/components/QueueRulesModal.jsx` (renders `rules.rules` via DOMPurify), `src/features/songs/components/SongSelectionModal.jsx`, `src/features/songs/components/SongDatabase.jsx` (static CSS strings only).
- Current mitigation: QueueRulesModal sanitizes with DOMPurify before rendering. SongSelectionModal and SongDatabase use literal template strings for `<style>` content only (no user input).
- Recommendations: Keep DOMPurify for any user-editable or DB-sourced HTML; avoid adding further dangerouslySetInnerHTML without sanitization. Prefer CSS-in-JS or static styles where possible.

**Cached roles in localStorage:**
- Risk: Stale or tampered role data if cache is not invalidated on logout or role change.
- Files: `src/contexts/AuthContext.jsx` (getCachedRoles, cacheRoles with `smf_user_roles_${uid}`).
- Current mitigation: Cache is keyed by user id; roles are refreshed on auth state change and on branch change.
- Recommendations: Clear `smf_user_roles_*` on sign-out; consider short TTL or version to invalidate after admin role updates.

## Performance Bottlenecks

**Single large service bundle:**
- Problem: `src/services/supabase.js` is a single module; any import of one service pulls in the whole file.
- Files: `src/services/supabase.js`
- Cause: No code-splitting or lazy loading of service layer.
- Improvement path: Split services as in “Monolithic Supabase service” above; then route-level or feature-based dynamic imports if needed.

**Realtime event rate:**
- Problem: Supabase realtime configured with `eventsPerSecond: 10`.
- Files: `src/services/supabase.js` (createClient realtime.params).
- Cause: Default/configured limit; may be more than needed for queue updates in low-traffic branches.
- Improvement path: Measure subscription volume; lower if appropriate to reduce client/server load.

## Fragile Areas

**BranchContext load and storage:**
- Files: `src/contexts/BranchContext.jsx`
- Why fragile: Branch selection and persistence depend on `localStorage` key `maimai-selected-branch`. Saved branch is resolved with loose equality `b.id == savedBranchId`; IDs may be number or string from storage. Load order and presence of `userLocation` affect which branch is auto-selected.
- Safe modification: When changing storage key or shape, handle both number and string IDs; consider normalizing to number. Ensure branch list is loaded before reading from storage.

**Auth and roles loading:**
- Files: `src/contexts/AuthContext.jsx`, `src/App.jsx`
- Why fragile: App renders route tree only after auth loading completes; `App.jsx` returns `null` while `authLoading` is true. Profile redirect and other auth-dependent routes assume `user` and `userRoles` are in sync. Roles fetch is raced with a 5s timeout and on failure falls back to default permissions without surfacing error to user.
- Safe modification: Keep auth/roles loading gate in App; when changing role refresh logic, ensure cache invalidation and timeout behavior are consistent. Consider showing a non-blocking “roles could not be loaded” state instead of silent fallback.

**Early returns and guard clauses:**
- Files: Widespread; e.g. `src/services/supabase.js` (many `if (!x) return null`/`return []`), `src/components/profile/PlaylistDetailModal.jsx`, `src/contexts/AuthContext.jsx`, `src/features/queue/components/NowPlayingCard.jsx`.
- Why fragile: Many functions return `null`, `[]`, or `{}` on missing inputs or empty results. Callers must handle these; missing checks can cause “cannot read property of null” in UI.
- Safe modification: When adding new call sites, always handle null/empty returns. Consider shared guards or typed result objects for critical paths.

**Geolocation and location guards:**
- Files: `src/services/geolocation.js`, `src/hooks/useLocationGuard.js`, `src/hooks/useLocationVerification.js`
- Why fragile: Depends on browser APIs (Permissions API, navigator.geolocation); errors are caught and converted to messages. Location guard throws on failure; callers must be inside try/catch or error boundary.
- Safe modification: Preserve existing error handling and user-facing messages; when changing permission or timeout logic, test in browsers that deny or lack geolocation.

## Scaling Limits

**Supabase and Vercel:**
- Current capacity: Not specified in codebase; determined by Supabase plan and Vercel project.
- Limit: Realtime connections, DB connections, and serverless invocations are plan-dependent.
- Scaling path: Upgrade Supabase/Vercel plans; optimize realtime usage (e.g. subscribe only to visible branch/cabinet); add connection pooling or read replicas if needed.

## Dependencies at Risk

- No obviously deprecated or high-risk packages identified in `package.json`. Stack (React 19, Mantine 8, Supabase 2, Vite 7) is current. Monitor release notes and security advisories for `@supabase/supabase-js`, `dompurify`, and auth-related deps.

## Missing Critical Features

**Automated tests:**
- Problem: No test runner or test files (no `*.test.*` or `*.spec.*` found). Lint and build only.
- Blocks: Safe refactors, regression detection, and confident changes to auth, queue, and Supabase logic.
- Recommendation: Introduce a test framework (e.g. Vitest) and add unit tests for validation, maimai-calc, and key service functions; add integration tests for critical Supabase flows behind mocks or test project.

## Test Coverage Gaps

**Entire codebase:**
- What's not tested: All application logic, including validation (`src/utils/validation.js`), maimai score calc (`src/utils/maimai-calc.js`), Supabase service layer (`src/services/supabase.js`), hooks, and UI components.
- Files: All under `src/`
- Risk: Regressions and bugs only surface in production or manual QA.
- Priority: High for validation and auth/queue paths; medium for UI and geolocation.

---

*Concerns audit: 2025-02-23*
