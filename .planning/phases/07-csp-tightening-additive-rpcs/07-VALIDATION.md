---
phase: 7
slug: 07-csp-tightening-additive-rpcs
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-20
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.js |
| **Quick run command** | `npm test src/__tests__/queue-transitions.test.jsx` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick test or check console for errors
- **After every plan wave:** Run full suite
- **Before `/gsd-verify-work`:** Full suite must be green

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | SEC-05 | lint | `npm run lint` | ✅ | ✅ passed |
| 07-02-01 | 02 | 1 | QUEUE-01 | migration | `ls supabase/migrations/*_finish_game.sql` | ✅ | ✅ passed |
| 07-02-02 | 02 | 2 | QUEUE-01 | unit | `npm test src/__tests__/queue-transitions.test.jsx` | ✅ | ✅ passed |

---

## Wave 0 Requirements

- [x] `supabase/migrations/[timestamp]_finish_game.sql` — RPC definition
- [x] Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Media Query function | SEC-05 | Desktop/Mobile toggle | Resize browser window in dev mode to verify grid layout shifts correctly. |
| Console CSP check | SEC-05 | Browser environment | Open browser console, verify no 'inline-style' CSP violations occur on Song Database or Selection Modal. |

---

## Validation Audit 2026-03-20
| Metric | Count |
|--------|-------|
| Gaps found | 1 |
| Resolved | 1 |
| Escalated | 0 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** verified
