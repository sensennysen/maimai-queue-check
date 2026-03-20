# PROJECT.md — smf-queue-check

## Core Value

The single most important thing this project must do perfectly for its users:
**Maimai Queueing & Social Engagement** — Providing reliable arcade branch queue management and enabling social interaction among the maimai community.

---

## Current Milestone: v1.3 — Operational Stability & Safe Hardening

**Goal:** Close remaining security and reliability gaps from `CONCERNS.md` with a "Safely Additive" approach that protects the active deployment.

**Target features:**
- App-level `ErrorBoundary` for graceful failure handling
- Adaptive polling (visibility-gated) to reduce background load
- Service-layer file upload hardening (MIME/size/extension)
- Additive, backwards-compatible Queue RPCs for atomicity (optional/gradual)
- Incremental CSP tightening (removing `unsafe-*` dependencies)

---

## Requirements

### Validated
- ✓ **CORE-01**: Real-time queue management for multiple arcade branches
- ✓ **AUTH-02**: Supabase-based authentication with OAuth support
- ✓ **GEO-03**: Nearest branch detection via geolocation
- ✓ **SOC-04**: Social feed with posts, comments, and voting
- ✓ **PLAYLIST-05**: User-curated and shared playlist management
- ✓ **SONG-06**: Song database search and discussion threads
- ✓ **IMPORT-07**: Bookmarklet-based maimai score import flow
- ✓ **ADMIN-08**: Branch administration and audit logging

  - ✓ **TEST-01**: Test framework configuration + critical regression tests for queue invariants and API endpoint hardening (Complete in v1.2)
- [x] **OBS-01**: Add an app-level error boundary and baseline error reporting hooks
- [x] **PERF-01**: Gate background polling (`MaimaiImportModal`, `useMallSchedule`) behind `usePageVisibility`
- [x] **SEC-04**: Add service-layer file upload validation (type/size/extension normalization)
- [x] **SEC-05**: Tighten CSP by refactoring components that depend on `unsafe-inline` styles
- [x] **QUEUE-01**: Add additive RPC for `finishGame` atomicity (deployable in parallel with old logic)

### Future / Next Steps
- [ ] **PERF-02**: Implement optimistic UI for `finishGame` transition (Ref: `.planning/todos/pending/2026-03-20-implement-optimistic-ui-for-finishgame-transition.md`)

### Out of Scope
- New product features unrelated to stability/security hardening
- Large UI redesign or re-architecture beyond the minimum needed to enforce invariants and safety

---

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Local-only Planning | User requested planning docs to be local-only and not committed to git. | `.planning/` added to gitignore. |
| Browser Geolocation | Critical for "perfect" queue experience; auto-selects nearest branch on load. | Implemented in `BranchContext`. |
| Supabase Realtime | Essential for live queue state across multiple clients. | Implemented via CDC subscriptions. |
| Backwards-compatible Hardening | Keep the old codebase operating while changes ship. | Prefer additive RPCs/guards, feature flags, and safe fallbacks until fully migrated. |

---
*Last updated: 2026-03-18 after initial project setup*
