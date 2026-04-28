---
phase: 0
slug: test-harness-baseline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 0 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm run lint && npm test && npm run build` |
| **Estimated runtime** | ~30–120 seconds (after first run; depends on install + build) |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm run lint && npm test && npm run build`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 2 minutes

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 00-01 | 00 | 1 | TEST-01 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 00-02 | 00 | 1 | TEST-01 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 00-03 | 00 | 1 | TEST-01 | unit | `npm run lint && npm test && npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.js` — test config created
- [ ] `test/utils/mockReqRes.js` — request/response test helper created
- [ ] `api/__tests__/proxy.test.js` — proxy regression tests created
- [ ] `api/__tests__/profile-meta.test.js` — profile-meta escaping regression tests created
- [ ] `src/__tests__/queue-invariants.test.js` — queue invariant test created
- [ ] `src/utils/sanitizeHtml.js` — centralized sanitizer boundary created
- [ ] `src/__tests__/sanitizeHtml.test.js` — sanitizer regression test created

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<verify>` commands or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2 minutes
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

