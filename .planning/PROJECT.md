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
- ✓ **OBS-01**: App-level Error Boundary — v1.3
- ✓ **PERF-01**: Visibility-gated polling — v1.3
- ✓ **SEC-04**: Service-layer upload validation — v1.3
- ✓ **SEC-05**: CSP tightening (CSS Modules) — v1.3
- ✓ **QUEUE-01**: Atomic finishGame RPC — v1.3

### Future / Next Steps
- [ ] **PERF-02**: Implement optimistic UI for `finishGame` transition (Ref: `.planning/todos/pending/2026-03-20-implement-optimistic-ui-for-finishgame-transition.md`)

### Out of Scope
- New product features unrelated to stability/security hardening
- Large UI redesign or re-architecture beyond the minimum needed to enforce invariants and safety

---

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Local-only Planning | User requested planning docs to be local-only and not committed to git. | ✓ Good |
| Browser Geolocation | Critical for "perfect" queue experience; auto-selects nearest branch on load. | ✓ Good |
| Supabase Realtime | Essential for live queue state across multiple clients. | ✓ Good |
| Backwards-compatible Hardening | Keep the old codebase operating while changes ship. | ✓ Good |
| Atomic Queue RPCs | Prevent race conditions and inconsistent 'playing' states. | ✓ Good (v1.3) |
| Optimistic Reordering | Restore fast UI feel while maintaining transactional safety. | ✓ Good (v1.3) |

---
*Last updated: 2026-03-20 after v1.3 milestone completion*
