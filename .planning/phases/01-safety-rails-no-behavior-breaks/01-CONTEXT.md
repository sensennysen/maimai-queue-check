# Phase 1: Safety Rails (No Behavior Breaks) - Context

**Gathered:** 2026-03-19  
**Status:** Ready for planning  
**Source:** `.planning/REQUIREMENTS.md` + `.planning/ROADMAP.md` + `.planning/codebase/CONCERNS.md`

<domain>
## Phase Boundary

This phase adds **safety rails** that reduce the highest-risk correctness and security failures **without breaking existing behavior**:

- **QUEUE-03**: Prevent stale realtime-triggered fetches from overwriting newer branch/cabinet selection state.
- **SEC-01**: Harden `/api/proxy` to reduce SSRF/resource-exhaustion risk while keeping the export flow working.
- **SEC-02**: Ensure `/api/profile-meta` output is safe against HTML/script injection and resilient to host-header poisoning.

**In scope (Phase 1):**
- Add request scoping and/or cancellation so late `getQueueEntries()` results are ignored for stale branch/cabinet contexts.
- Tighten `/api/proxy` input validation and network safety:
  - scheme restrictions (http/https only)
  - SSRF protections (already partially implemented; extend as needed)
  - timeouts + response size limits
  - content-type restrictions appropriate for the export image-localizer use case
  - CORS tightening (prefer same-origin or explicit allowlist)
- Ensure `/api/profile-meta` properly escapes/encodes all user-controlled values and avoids unsafe inline injection patterns.
- Add/extend regression tests that pin these behaviors.

**Out of scope (Phase 1):**
- Server-side transactional queue migrations (`QUEUE-01`, `QUEUE-02`) — Phase 2.
- Global sanitizer standardization (`SEC-03`) — Phase 3.
- Broad CSP changes (`SEC-05`) — Phase 4.
</domain>

<constraints>
## Constraints / Guardrails

- **No behavior breaks:** Keep existing UX flows working (especially export image localization and profile link previews).
- **Fail closed on security rules:** When in doubt, block unsafe proxy targets and return clear 4xx errors.
- **Deterministic tests:** Unit tests must not require a live Supabase instance or external network access.
- **Windows friendly:** Commands should run in PowerShell and local developer workflows.
</constraints>

<canonical_refs>
## Canonical References (downstream agents MUST read)

### Requirements / concerns
- `.planning/REQUIREMENTS.md` — Phase 1 owns `QUEUE-03`, `SEC-01`, `SEC-02`
- `.planning/ROADMAP.md` — phase goal and sequencing
- `.planning/codebase/CONCERNS.md` — detailed failure modes and recommended fixes

### Current implementations
- `src/hooks/useQueueData.js` — currently refetches on realtime events without stale-guard
- `src/hooks/useMonitorData.js` — branch-wide refetch on realtime events
- `src/services/supabase/queue.js` — `getQueueEntries()` boundary
- `api/proxy.js` — proxy endpoint (already has baseline SSRF blocks, but broad CORS + no size/timeouts)
- `src/pages/ExportBest50Page.jsx` — proxy consumer (image localizer)
- `api/profile-meta.js` — HTML generation for profile previews
- `api/__tests__/proxy.test.js` and `api/__tests__/profile-meta.test.js` — regression tests
</canonical_refs>

<notes>
## Notes

- `/api/proxy` is used to turn remote images into `data:` URLs for export; it should remain **image-oriented** and conservative.
- `useQueueData` and `useMonitorData` both refetch on realtime events today; the stale-guard should be implemented in a way that is **low-risk** and does not require deep refactors.
</notes>

---

*Phase: 01-safety-rails-no-behavior-breaks*  
*Context gathered: 2026-03-19*

