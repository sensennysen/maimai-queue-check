# Codebase Concerns

**Analysis Date:** 2026-03-19

## Tech Debt

**Queue state transitions are not truly atomic**
- Issue: `queueService.finishGame()` performs “end current + start next” as two independent `update()` calls while claiming “Atomically finishes”.
- Files: `src/services/supabase/queue.js`
- Impact: Under concurrent operators/clients or partial failures, the queue can end up with inconsistent `PLAYING/COMPLETED` state (including multiple `PLAYING` rows or no `PLAYING` row).
- Fix approach: Move the transition into a DB-side RPC/function (transactional) that enforces invariants and returns the authoritative result.

**Batch reorder uses N sequential round-trips**
- Issue: `queueService.updateOrderPositions()` loops through `updates` and performs one Supabase request per entry.
- Files: `src/services/supabase/queue.js`
- Impact: Drag-and-drop reorder latency and increased realtime churn during frequent operator actions.
- Fix approach: Implement a bulk update (RPC/function) so ordering updates occur in fewer requests.

**Client-side security hardening is uneven for storage uploads**
- Issue: Post/profile upload helpers accept files and derive extensions from `file.name` without helper-level MIME/type/size validation.
- Files: `src/services/supabase/posts.js`, `src/services/supabase/user.js`, `src/components/feed/FeedPostComposer.jsx`, `src/components/profile/ProfilePictureUploadModal.jsx`, `src/services/supabase/contact.js`, `src/utils/validation.js`
- Impact: Future callers or edge cases can bypass UI constraints; public storage can contain unexpected content.
- Fix approach: Validate/normalize file metadata inside the service layer and enforce storage bucket rules; consider `upsert: false` unless collisions are required.

## Known Bugs

**Realtime queue refresh can update state after selection changes**
- Symptoms: Transient queue UI flicker to the wrong branch/cabinet after rapid switching.
- Files: `src/hooks/useQueueData.js`, `src/hooks/useMonitorData.js`
- Trigger: Realtime events arrive while in-flight `getQueueEntries()` promises are still resolving.
- Safe modification: Add an “isActive/requestId” guard in the subscription effect to ignore late updates; consider using `AbortController` in `queueService.getQueueEntries()` and pass a signal through.
- Test coverage: Missing—add unit tests around subscription/update orchestration with simulated promise timing.

## Security Considerations

**`/api/proxy` enables SSRF and overbroad cross-origin reads**
- Risk: `api/proxy.js` accepts arbitrary `req.query.url`, performs server-side `fetch(url)`, and sets `Access-Control-Allow-Origin: *` with long caching.
- Files: `api/proxy.js`, `src/pages/ExportBest50Page.jsx`
- Current mitigation: Not detected (no URL scheme/host allowlist; no private IP blocking; no content-type constraints).
- Recommendations: Allowlist schemes/hosts; block private IP ranges; restrict CORS to same-origin; restrict response content-types to images only; add request timeouts + size limits; reduce caching or key caching by allowlisted origins.

**`/api/profile-meta` renders unescaped user-controlled HTML**
- Risk: `api/profile-meta.js` injects `profile.display_name` and a host-derived `baseUrl` directly into HTML attributes and an inline `<script>` without escaping/encoding.
- Files: `api/profile-meta.js`
- Current mitigation: User profile slug appears constrained by regex in `src/utils/validation.js`, but `display_name` is not HTML-escaped.
- Recommendations: Escape HTML attribute content, encode URLs, replace inline script redirect with safe DOM handling or JSON-stringified URL, and avoid using `req.headers.host` for canonical base URLs.

**Auth session and role caches expand XSS blast radius**
- Risk: Supabase auth persistence uses `window.localStorage`, and `AuthContext.jsx` caches role data in `localStorage`.
- Files: `src/services/supabase/client.js`, `src/contexts/AuthContext.jsx`
- Current mitigation: Supabase RLS is the final security boundary, but XSS still enables token/role theft client-side.
- Recommendations: Prefer cookie-based session persistence where possible; minimize role caching and ensure all HTML injection points are tightly sanitized.

**CSP currently permits `unsafe-inline` and `unsafe-eval`**
- Risk: `vercel.json` allows inline scripts and eval in `script-src`.
- Files: `vercel.json`
- Current mitigation: Basic security headers are present (e.g., `nosniff`, `DENY` framing).
- Recommendations: Remove `unsafe-eval` and reduce `unsafe-inline`; add tighter CSP for endpoints that require inline code (or remove inline code).

**Inline CSS injection patterns reinforce permissive CSP**
- Risk: Some components inject `<style>` via `dangerouslySetInnerHTML` (static strings), which keeps the project dependent on permissive CSP (`style-src 'unsafe-inline'`).
- Files: `src/features/songs/components/SongDatabase.jsx`, `src/features/songs/components/SongSelectionModal.jsx`
- Current mitigation: CSS injected is static (not user-provided), reducing direct XSS risk, but it increases the blast radius of any future injection bug.
- Recommendations: Move responsive CSS into a stylesheet/CSS module or Mantine styles so CSP can be tightened.

**Rich text injection surfaces rely on sanitizer configuration**
- Risk: Some surfaces use explicit allowlists for DOMPurify (e.g., `IntroductionCard`), while others use DOMPurify defaults (e.g., `QueueRulesModal`).
- Files: `src/components/profile/IntroductionCard.jsx`, `src/features/queue/components/QueueRulesModal.jsx`
- Current mitigation: DOMPurify is used before `dangerouslySetInnerHTML`.
- Recommendations: Standardize DOMPurify options (explicit allowlists + URI policy) across all rich-text rendering and add regression coverage for common XSS payloads.

**Bookmarklet import security depends on an external Edge Function**
- Risk: The `receive-import` Edge Function uses service role privileges; a validation/CORS/session bug can be exploited.
- Files: `src/services/README.md` (flow description)
- Current mitigation: App creates `import_sessions` and relies on table RLS semantics, but Edge Function code is external to this repo.
- Recommendations: Audit the Edge Function code, enforce strict `import_sessions` RLS, and add end-to-end checks for token expiry and ownership.

## Performance Bottlenecks

**Realtime queue refresh can be chatty**
- Problem: `useQueueData` refreshes the full queue via `queueService.getQueueEntries()` on relevant realtime payloads instead of applying deltas.
- Files: `src/hooks/useQueueData.js`, `src/services/supabase/queue.js`
- Cause: `subscribeToQueueChanges` listens broadly (`event: '*'`) and the client re-fetches on any matching row change.
- Improvement path: Narrow realtime event subscriptions and update local state from payloads where feasible.

**Best 50 export proxies images concurrently and forces high-res rendering**
- Problem: `ExportBest50Page` proxies every qualifying `img` using `Promise.all` and then renders via `toPng` at high resolution.
- Files: `src/pages/ExportBest50Page.jsx`
- Cause: No concurrency limit for proxy fetches; large canvas/render cost (`pixelRatio: 2`, `width: 2560`).
- Improvement path: Add concurrency limits, per-request timeouts, and degrade gracefully when some images fail to localize.

**Continuous polling/timers add steady background load**
- Problem: Import polling (2.5s) and UI timers (1s/60s) keep working even when the tab is backgrounded.
- Files: `src/components/profile/MaimaiImportModal.jsx`, `src/features/queue/components/PlayTimer.jsx`, `src/hooks/useMallSchedule.js`, `src/hooks/usePageVisibility.js`
- Cause: Timers are not tied to document visibility.
- Improvement path: Pause intervals when `usePageVisibility` reports hidden; add backoff for import polling.

## Fragile Areas

**Queue ordering and status consistency under concurrency**
- Files: `src/services/supabase/queue.js`, `src/hooks/useQueueData.js`
- Why fragile: ordering/status transitions are client-orchestrated with sequential updates and follow-up refetches.
- Safe modification: move critical transitions (finish/start, reorder) into server/RPC operations that return the authoritative state.
- Test coverage: Gaps—add deterministic tests for concurrent operator flows and ordering invariants.

## Scaling Limits

**Queue operations scale linearly with queue size**
- Current capacity: Not detected
- Limit: reorder updates and refresh calls can multiply network traffic as queue length and update frequency increase.
- Scaling path: bulk/RPC updates and payload-based state updates to reduce round-trips.

## Dependencies at Risk

**`@supabase/supabase-js` realtime behavior and client caching assumptions**
- Risk: Realtime payload shape, unsubscribe semantics, and client caching can change across library updates.
- Files: `src/services/supabase/client.js`, `src/services/README.md`, `src/hooks/useNotifications.js`
- Impact: subtle realtime regressions (stale state, leaks, unexpected refetch storms).
- Migration plan: Pin versions, add smoke tests for subscription/unsubscription, and validate RLS assumptions after dependency upgrades.

**DOM sanitization consistency**
- Risk: inconsistent DOMPurify configuration across rich-text surfaces.
- Files: `src/components/profile/IntroductionCard.jsx`, `src/features/queue/components/QueueRulesModal.jsx`
- Impact: XSS vulnerabilities if sanitization constraints drift.
- Migration plan: standardize sanitizer options + add regression coverage.

## Missing Critical Features

**Error boundaries and operational observability**
- Problem: No `ErrorBoundary` detected in `src/App.jsx`; failures can blank the UI and errors are mostly console-only.
- Blocks: difficult to diagnose production incidents and increases downtime.
- Files: `src/App.jsx`

**Server-side hardening and rate limiting for critical endpoints**
- Problem: `/api/proxy` and `/api/profile-meta` lack visible allowlists/limits/rate limiting.
- Blocks: SSRF/XSS exploitation and potential resource exhaustion.
- Files: `api/proxy.js`, `api/profile-meta.js`

## Test Coverage Gaps

**Queue/business logic invariants (ordering, finishGame, logs)**
- What's not tested: ordering transitions under concurrent updates; invariant correctness after reorder and finish.
- Files: `src/services/supabase/queue.js`, `src/hooks/useQueueData.js`
- Risk: regressions can silently corrupt queue state.
- Priority: High

**Proxy and metadata endpoints security**
- What's not tested: URL allowlisting for `/api/proxy`, escaping/encoding behavior for `/api/profile-meta`, and response header correctness.
- Files: `api/proxy.js`, `api/profile-meta.js`
- Risk: SSRF/XSS vulnerabilities could ship undetected.
- Priority: High

**Rich-text sanitization correctness**
- What's not tested: DOMPurify configuration equivalence across rich-text surfaces.
- Files: `src/components/profile/IntroductionCard.jsx`, `src/features/queue/components/QueueRulesModal.jsx`
- Risk: XSS regressions.
- Priority: Medium

**No test framework configuration detected**
- What's not tested: whole-app integration flows (realtime, import polling, export snapshot generation).
- Files: `package.json`
- Risk: failures only show up via manual testing.
- Priority: High
