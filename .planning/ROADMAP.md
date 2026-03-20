# Milestone v1.4 Roadmap: Codebase Hardening & Optimization

## Phase 8: Core Security & Auth Hardening
**Goal:** Secure the session caching layer and score import boundary against XSS and unauthorized access.
**Requirements:** [AUTH-03], [SEC-07]
**Success Criteria:**
1. Authentication tokens and roles are cleared from local storage and exclusively maintained in memory or secure contexts.
2. The score import Edge Function explicitly rejects requests without valid RLS scoping on the `import_sessions` table.
3. User sessions maintain continuity without client-side cache resilience vulnerability.

## Phase 9: Client Strict CSP & Rendering Resilience
**Goal:** Prevent injection attack vectors while ensuring heavy canvas renders degrade gracefully without locking the browser.
**Requirements:** [SEC-06], [PERF-04]
**Success Criteria:**
1. Document headers and Vercel configuration enforce strict Content-Security-Policy disallowing `unsafe-eval` and reducing `unsafe-inline`.
2. The core application boots and operates normally with zero CSP violations in the browser console.
3. The Best 50 Image proxy task respects a strict concurrency pool limit with timeouts yielding graceful placeholders instead of blocking.

## Phase 10: High-Scale Queue Data Refactoring
**Goal:** Decouple realtime queue performance from total queue length to support scaling.
**Requirements:** [PERF-03], [PERF-05]
**Success Criteria:**
1. Client components monitor real-time subscriptions and update local state incrementally rather than executing full network `SELECT` re-fetches.
2. Queue reordering limits redundant network traffic by utilizing database RPC and batch transitions.
3. Traffic profiling confirms significantly mitigated payload volume during concurrent queue interactions.

## Phase 11: Realtime Smoke Validation
**Goal:** Formally ensure real-time behavior stability to anticipate library dependency upgrades.
**Requirements:** [TEST-02]
**Success Criteria:**
1. A new test configuration explicitly asserts subscription channels, connection lifecycles, and cache synchronization accuracy.
2. The test suite successfully guards against regression when iterating `supabase-js` versions.
