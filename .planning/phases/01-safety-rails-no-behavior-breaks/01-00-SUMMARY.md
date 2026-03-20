---
phase: 01-safety-rails-no-behavior-breaks
plan: 00
type: summary
created: 2026-03-19
---

# Phase 1 Plan 00 — Summary

## What this phase delivers
- **QUEUE-03** stale-response guard for realtime-triggered queue refreshes (no UI flicker to wrong branch/cabinet).
- **SEC-01** safer `/api/proxy` (SSRF controls + timeout + size/content-type limits) without breaking export image localization.
- **SEC-02** safer `/api/profile-meta` (escape/encode + trusted base URL).

## Key files
- `src/hooks/useQueueData.js`
- `src/hooks/useMonitorData.js`
- `api/proxy.js`
- `api/profile-meta.js`
- `api/__tests__/proxy.test.js`
- `api/__tests__/profile-meta.test.js`

## How to verify
- `npm test`
- `npm run lint && npm test && npm run build`

