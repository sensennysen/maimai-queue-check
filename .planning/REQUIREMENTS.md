# REQUIREMENTS.md — v1.3 Operational Stability & Safe Hardening

This milestone focuses on closing the remaining gaps from `CONCERNS.md` using a "Safety-First" approach. All changes to the database or critical paths must be additive and backwards-compatible to prevent any interruption to the active deployment.

---

## v1.3 Milestone Requirements

### [OBS] Operational Resilience
- [x] **OBS-01**: **App-level Error Boundary**
  - Wrap the main application routes in a React `ErrorBoundary`.
  - Provide a user-friendly fallback UI (e.g., "Something went wrong" with a refresh button) instead of a white screen.
  - Implement a basic hook to log these errors to the console (and potentially a future reporting service).

### [PERF] Visibility-Gated Polling
- [x] **PERF-01**: **Gate background polling**
  - Use the existing `usePageVisibility` hook in `MaimaiImportModal` to pause the 2.5s polling loop when the tab is hidden.
  - Apply similar visibility gating to `useMallSchedule` (60s interval).
  - Goal: Reduce unnecessary server load and client CPU usage for background tabs.

### [SEC] Security & Upload Hardening
- [x] **SEC-04**: **Service-layer upload validation**
  - Add server-side (service-layer) checks for file uploads:
    - MIME type allowlist (e.g., `image/jpeg`, `image/png`).
    - File size limits (enforced before sending to Supabase).
    - Extension normalization to prevent bypasses.
  - Update `posts.js` and `user.js` service helpers.

- [x] **SEC-05**: **Incremental CSP Tightening**
  - Refactor components that inject `<style>` via `dangerouslySetInnerHTML` (e.g., `SongDatabase.jsx`).
  - Move these styles to static CSS files or CSS modules.
  - Goal: Enable the removal of `'unsafe-inline'` from the CSP `style-src`.

### [QUEUE] Additive Data Integrity (Low Priority / Gradual)
- [x] **QUEUE-01**: **Additive RPC for finishGame**
  - Deploy a Postgres RPC handle for the "finish + start" transition.
  - **Constraints**: 
    - Must be strictly additive (does not modify existing table structures).
    - Client use is optional; old clients still use sequential `update()` calls.
    - New clients switch to RPC only after verification.

---

## Traceability

| Req ID  | Phase   | Status  |
|---------|---------|---------|
| OBS-01  | Phase 5 | Done    |
| PERF-01 | Phase 5 | Done    |
| SEC-04  | Phase 6 | Done    |
| SEC-05  | Phase 7 | Done    |
| QUEUE-01| Phase 7 | Done    |
