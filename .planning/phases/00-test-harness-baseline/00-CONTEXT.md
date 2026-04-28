# Phase 0: Test Harness (Baseline) - Context

**Gathered:** 2026-03-19  
**Status:** Ready for planning  
**Source:** Milestone v1.2 planning reset (derived from `REQUIREMENTS.md` + `ROADMAP.md`)

<domain>
## Phase Boundary

This phase establishes a minimal automated test harness for the repo so subsequent hardening changes can ship with regression protection.

**In scope for Phase 0:**
- Add a JavaScript test runner and `npm` scripts for `test` and `test:watch` (and `coverage` if practical).
- Add a small set of high-signal tests covering the highest-risk items from `CONCERNS.md`:
  - Security unit tests for `/api/proxy` (allowlist/denylist behavior, CORS/headers, size/timeouts scaffolding).
  - Security unit tests for `/api/profile-meta` (escaping/encoding behavior for user-controlled values).
  - Initial queue invariant tests at the unit boundary that is most feasible without a live DB (start with deterministic helpers / service orchestration).

**Out of scope for Phase 0:**
- Implementing the actual hardening fixes (those begin Phase 1+).
- Full E2E tests, CI, or large refactors.
</domain>

<decisions>
## Implementation Decisions

### Test runner choice (locked)
- Use **Vitest** (best fit for Vite+ESM) as the primary unit test runner.
- Use **jsdom** for React/UI-adjacent tests when needed.

### Test placement (locked)
- Prefer `src/**/__tests__/*` for client/service tests.
- Prefer `api/**/__tests__/*` for serverless handler tests.
- Prefer `*.test.js` / `*.test.jsx` naming.

### Mocking strategy (locked)
- Prefer dependency injection or thin wrappers for hard-to-mock modules.
- For fetch/network: use Vitest mocks/spies; add MSW only if needed after first tests prove insufficient.

### Coverage stance (locked)
- Coverage enforcement is **not** a gate in Phase 0; focus on a few meaningful tests that catch regressions.

### Claude's Discretion
- Exact package set (e.g., `@testing-library/*`, `@vitest/coverage-*`) based on what the first tests need.
- Whether to add a GitHub Actions workflow now or leave as a follow-on phase task.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements / concerns
- `.planning/REQUIREMENTS.md` — v1.2 requirements (Phase 0 supports `TEST-01`)
- `.planning/ROADMAP.md` — phase sequencing and goals
- `.planning/codebase/CONCERNS.md` — exact risks to target in first tests
- `.planning/codebase/TESTING.md` — confirms no runner currently configured

### Repo configuration
- `package.json` — current scripts and devDependencies
- `vite.config.js` — Vite+ESM baseline
- `eslint.config.js` — lint rules that tests must satisfy

### Target surfaces for initial tests
- `api/proxy.js` — proxy endpoint behavior/security
- `api/profile-meta.js` — HTML generation/escaping behavior
- `src/services/supabase/queue.js` — queue invariants/orchestration unit boundary
</canonical_refs>

<specifics>
## Specific Ideas

- Start with tests that do not require a running Supabase instance:
  - Unit-test pure helper functions (if any exist) and orchestration logic with mocked Supabase client.
  - Unit-test API handlers by constructing `req`/`res` objects and asserting status, headers, and body content.

</specifics>

<deferred>
## Deferred Ideas

- CI test runs (GitHub Actions) if it risks slowing iteration; can be added once `npm test` is stable locally.
- E2E tests (Playwright) until the highest-risk unit/integration surfaces are covered.
</deferred>

---

*Phase: 00-test-harness-baseline*  
*Context gathered: 2026-03-19*

