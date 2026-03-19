# REQUIREMENTS.md — v1.2 Queue Integrity & Security Hardening

This milestone hardens correctness and security of the existing app while preserving current functionality. Changes should be backwards-compatible by default (additive APIs, guarded rollouts, safe fallbacks) and validated by targeted regression tests.

---

## v1.2 Milestone Requirements

### [QUEUE] Correctness & Concurrency Safety
- [ ] **QUEUE-01**: **Transactional finish/start**
  - Replace client-orchestrated “end current + start next” with a transactional server-side operation (Supabase RPC / SQL function).
  - Must enforce invariants:
    - At most one `PLAYING` entry per branch/cabinet scope.
    - No gaps or invalid transitions on partial failure.
  - Must return the authoritative updated state so clients can refresh deterministically.
  - Must be deployable without breaking existing clients (keep old path until migration completes).

- [ ] **QUEUE-02**: **Bulk reorder**
  - Replace N sequential update calls during reorder with a bulk update (RPC preferred).
  - Should reduce network round-trips and realtime churn during drag-and-drop reorder.
  - Must preserve current ordering semantics and permissions.

- [ ] **QUEUE-03**: **Realtime stale-update guard**
  - Prevent in-flight `getQueueEntries()` responses (triggered by realtime) from overwriting state after the user changes selection (branch/cabinet).
  - Implement request scoping (requestId/isActive guard) and/or cancellation (AbortController) end-to-end.
  - Add regression coverage for “selection changes during fetch” timing.

### [SEC] Server/API Hardening
- [ ] **SEC-01**: **Harden `/api/proxy`**
  - Enforce scheme + host allowlist and block SSRF vectors (private IPs, loopback, link-local, metadata IPs).
  - Add request timeouts and response size limits; restrict allowed content-types (images only if that’s the intent).
  - Tighten CORS from `*` to approved origins (or same-origin) and reduce caching risk.
  - Add tests covering allowlist/denylist behavior and headers.

- [ ] **SEC-02**: **Fix `/api/profile-meta` HTML injection**
  - Escape HTML attribute content and encode URLs.
  - Avoid inline-script injection patterns; ensure any dynamic values are safely encoded (e.g., JSON-stringified) if needed.
  - Add tests for common XSS payloads against the rendered output.

- [ ] **SEC-03**: **Standardize DOMPurify configuration**
  - Centralize sanitizer options (explicit allowlists + URI policy) and apply consistently across all rich-text renderers.
  - Add regression coverage for representative payloads and allowed formatting.

- [ ] **SEC-04**: **Service-layer upload validation**
  - Validate file size/type at the service layer (not only UI): MIME/type allowlist, extension normalization, and safe naming.
  - Prefer collision-safe upload behavior (`upsert: false` unless explicitly needed) and avoid deriving trust from `file.name`.

- [ ] **SEC-05**: **Incremental CSP tightening**
  - Reduce/remove `unsafe-eval` and minimize `unsafe-inline` dependencies over time.
  - Move static injected styles out of `dangerouslySetInnerHTML` where practical so CSP can be tightened.
  - Changes must not break production behavior; roll out in stages with verification.

### [OBS] Operational Resilience
- [ ] **OBS-01**: **Error boundaries + baseline reporting**
  - Add an app-level `ErrorBoundary` so UI failures degrade gracefully instead of blanking.
  - Add a minimal reporting hook (console plus pluggable reporting) to capture runtime errors.

### [TEST] Baseline Regression Coverage
- [x] **TEST-01**: **Test framework + critical tests**
  - Add a test runner configuration suitable for this repo (unit tests at minimum).
  - Add high-priority tests:
    - Queue invariants for finish/start and reorder behavior.
    - `/api/proxy` allowlisting/SSRF protections and header constraints.
    - `/api/profile-meta` escaping/encoding behavior.
    - Rich-text sanitizer configuration correctness.

---

## Technical Standards
- **Backwards compatibility first**: prefer additive changes, preserve old behavior behind a flag or dual-path until migration completes.
- **Authoritative server state**: critical invariants should be enforced server-side (DB/RPC) rather than by client sequencing.
- **Safety by default**: validate inputs at boundaries (API handlers, service layer), and fail closed on security rules.
- **Tests for invariants**: add regression tests for the exact failure modes described in `CONCERNS.md`.

---

## Out of Scope
- New user-facing features unrelated to integrity/security hardening.
- Large refactors that don’t directly improve invariants, safety, or testability.

---

## Traceability

| Req ID | Phase | Status |
|--------|-------|--------|
| QUEUE-01 | Phase 2 | Pending |
| QUEUE-02 | Phase 2 | Pending |
| QUEUE-03 | Phase 1 | Pending |
| SEC-01 | Phase 1 | Pending |
| SEC-02 | Phase 1 | Pending |
| SEC-03 | Phase 3 | Pending |
| SEC-04 | Phase 3 | Pending |
| SEC-05 | Phase 4 | Pending |
| OBS-01 | Phase 4 | Pending |
| TEST-01 | Phase 0–4 | Complete |
