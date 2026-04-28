# Phase 11: Realtime Smoke Validation - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Establishing a formal smoke testing suite for realtime behavior regressions and library dependency updates.

</domain>

<decisions>
## Implementation Decisions

### Target Environment
- Use the local Supabase instance (normally used for dev / `npx supabase start`).

### Test Execution Frequency
- Test should be integrated to run on every commit.

### Data Isolation
- Use generic test channels to avoid polluting real dev data or side effects.

### Claude's Discretion
- The exact structure of the test event payloads
- Teardown process to ensure tests don't hang Vitest
- Filename of the new test suite (e.g. `src/__tests__/realtime-smoke.test.js`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Realtime Testing Approach
- `.planning/phases/11-realtime-smoke-validation/11-RESEARCH.md` — Realtime integration testing approach and patterns for Vitest.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `package.json` — existing setup for `vitest`

### Established Patterns
- Existing Unit tests in `src/__tests__/` 
- Local Supabase instance managed via Supabase CLI

### Integration Points
- Git hooks or `package.json` test scripts (to run on every commit)
- `vitest.config.js` or testing setup files for environment variables

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-realtime-smoke-validation*
*Context gathered: 2026-03-22*
