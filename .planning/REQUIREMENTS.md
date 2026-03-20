# Requirements: v1.4 Codebase Hardening & Optimization

## 1. Authentication & Security (AUTH / SEC)
- [ ] **AUTH-03**: Role management and session persistence securely migrate to HttpOnly cookies or sanitized contexts.
- [ ] **SEC-06**: Strict CSP enforcement with restrictive `script-src` policies, removing `unsafe-eval` and reducing `unsafe-inline`.
- [ ] **SEC-07**: Edge Function boundary validation for score imports, enforcing strict `import_sessions` RLS and ownership.

## 2. Performance & Scaling (PERF)
- [ ] **PERF-03**: Realtime subscriptions constrained to discrete queue deltas rather than full table refetches.
- [ ] **PERF-04**: Export rendering flow enforces proxy concurrency limits and graceful asset degradation to prevent client freezing.
- [ ] **PERF-05**: Linear queue updates refactored to utilize batch-oriented RPC for high-scale environments.

## 3. Testing & Stability (TEST)
- [ ] **TEST-02**: Formal smoke testing suite established for realtime behavior regressions and library dependency updates.

## Traceability

- **AUTH-03** ➔ Phase 8 (Core Security & Auth Hardening)
- **SEC-07**  ➔ Phase 8 (Core Security & Auth Hardening)
- **SEC-06**  ➔ Phase 9 (Client Strict CSP & Rendering Resilience)
- **PERF-04** ➔ Phase 9 (Client Strict CSP & Rendering Resilience)
- **PERF-03** ➔ Phase 10 (High-Scale Queue Data Refactoring)
- **PERF-05** ➔ Phase 10 (High-Scale Queue Data Refactoring)
- **TEST-02** ➔ Phase 11 (Realtime Smoke Validation)
