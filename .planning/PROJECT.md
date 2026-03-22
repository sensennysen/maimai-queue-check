# PROJECT.md — smf-queue-check

## Core Value

The single most important thing this project must do perfectly for its users:
**Maimai Queueing & Social Engagement** — Providing reliable arcade branch queue management and enabling social interaction among the maimai community.

---

## Current Milestone: v1.4 Codebase Hardening & Optimization

**Goal:** Address persistent security and performance considerations documented in CONCERNS.md, specifically targeting Supabase optimizations, rendering bottlenecks, and XSS hardening.

**Target features:**
- Cookie-based authentication persistence and strict role caching security
- Edge Function RLS enforcement and ownership boundaries
- Content Security Policy (CSP) hardening (prevent unsafe-eval/unsafe-inline)
- Efficient realtime queue refresh via targeted state deltas
- Concurrency limits and graceful degradation for Best 50 export image proxying
- Supabase JS dependency pinning and dedicated realtime smoke tests
- Shift toward bulk/RPC operations for high-scale queue data

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

### Active (v1.4)
- [ ] **AUTH-03**: Role management and session persistence securely migrate to HttpOnly cookies or sanitized contexts
- [ ] **SEC-06**: Strict CSP enforcement with restrictive script-src policies
- [ ] **SEC-07**: Edge Function boundary validation for score imports
- ✓ **PERF-03**: Realtime subscriptions constrained to discrete queue deltas
- [ ] **PERF-04**: Export rendering flow enforces proxy concurrency limits and graceful asset degradation
- ✓ **PERF-05**: Linear queue updates refactored to utilize batch-oriented RPC
- [ ] **TEST-02**: Formal smoke testing suite established for realtime behavior regressions

### Future / Next Steps
- [ ] **PERF-02**: Implement optimistic UI for `finishGame` transition (Ref: `.planning/todos/pending/2026-03-20-implement-optimistic-ui-for-finishgame-transition.md`)

### Out of Scope
- New product capabilities beyond the documented optimizations.
- Client-side visual design overhauls.

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
