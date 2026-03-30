# Codebase Concerns

**Analysis Date:** 2026-03-19

## Tech Debt

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


