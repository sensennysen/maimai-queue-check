# ROADMAP.md — v1.2 Queue Integrity & Security Hardening

This roadmap prioritizes changes that keep the existing app stable while introducing stronger invariants and safer boundaries. The sequencing is intentionally “guardrails first, migrations second” so old behavior continues to operate throughout the milestone.

---

## Phase 0: Test Harness (Baseline)
**Goal:** Add a minimal automated test capability so the rest of the milestone can ship with regression protection.

- [ ] **Add test runner + scripts** (`TEST-01`)
- [ ] **Add first critical tests** (queue invariants + API security)

---

## Phase 1: Safety Rails (No Behavior Breaks)
**Goal:** Fix the most likely regressions and security gaps with minimal surface-area change.

- [ ] **Realtime stale-update guard** (`QUEUE-03`)
  - Implement request scoping/cancellation so late fetches don’t overwrite newer selection state.
- [ ] **Harden `/api/proxy`** (`SEC-01`)
  - Allowlist schemes/hosts, SSRF protections, limits, and CORS tightening.
- [ ] **Escape/encode `/api/profile-meta`** (`SEC-02`)
  - Remove/avoid inline injection patterns and add XSS regression tests.

---

## Phase 2: Queue Integrity Migrations (Dual-Path Rollout)
**Goal:** Move fragile queue operations to server-side transactional guarantees while keeping the old code path operational during rollout.

- [ ] **Transactional finish/start** (`QUEUE-01`)
  - Add DB/RPC function enforcing invariants; keep client path as fallback until proven.
- [ ] **Bulk reorder** (`QUEUE-02`)
  - Add DB/RPC bulk update; migrate UI reorder to use it; keep fallback path temporarily.
- [ ] **Expand queue invariant tests**
  - Focus on “at most one PLAYING” and correct ordering after reorders.

---

## Phase 3: Client-Side Hardening Consistency
**Goal:** Reduce XSS blast radius and standardize sanitizer and upload safety.

- [ ] **Standardize DOMPurify configuration** (`SEC-03`)
- [ ] **Service-layer upload validation** (`SEC-04`)

---

## Phase 4: Operational Resilience + CSP Tightening
**Goal:** Improve runtime survivability and incrementally tighten CSP without breaking production.

- [ ] **ErrorBoundary + minimal reporting hook** (`OBS-01`)
- [ ] **Incremental CSP tightening** (`SEC-05`)
  - Remove `unsafe-eval` first where possible; reduce inline style/script dependencies over time.
- [ ] **Final regression sweep + manual UAT**
  - Queue operations, export flow, profile meta previews, proxy image export.

---

## Summary
- **Total Phases:** 5 (0–4)
- **Total Requirements:** 10 (QUEUE/SEC/OBS/TEST)
- **Compatibility Stance:** Backwards-compatible, dual-path migrations where needed
- **Status:** Planned
