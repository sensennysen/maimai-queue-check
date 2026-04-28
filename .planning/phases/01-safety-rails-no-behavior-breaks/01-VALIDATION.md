---
phase: 1
slug: safety-rails-no-behavior-breaks
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm run lint && npm test && npm run build` |
| **Estimated runtime** | ~30–180 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm run lint && npm test && npm run build`
- **Max feedback latency:** 3 minutes

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 01-01 | 00 | 1 | QUEUE-03 | unit | `npm test` | ⬜ pending |
| 01-02 | 00 | 1 | SEC-01 | unit | `npm test` | ⬜ pending |
| 01-03 | 00 | 1 | SEC-02 | unit | `npm test` | ⬜ pending |
| 01-04 | 00 | 1 | (all) | build/lint | `npm run lint && npm test && npm run build` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useQueueData.js` has a stale-response guard (requestId and/or cancellation)
- [ ] `src/hooks/useMonitorData.js` has a stale-response guard (requestId and/or cancellation)
- [ ] `api/proxy.js` enforces SSRF + timeout + size/content-type limits
- [ ] `api/profile-meta.js` escapes/encodes user-controlled values and uses a trusted base URL
- [ ] Unit tests exist and are enforced for each of the above

---

## Manual-Only Verifications

- [ ] Export flow still works:
  - Visit `ExportBest50Page` and confirm it can localize images through `/api/proxy` and complete an export.
- [ ] Profile share preview still works:
  - Load a `/p/<slug>` page via a link preview tool and confirm metadata renders (no console errors).

---

## Validation Sign-Off

- [ ] All tasks have `<verify>` commands or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] No watch-mode flags
- [ ] Feedback latency < 3 minutes
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

