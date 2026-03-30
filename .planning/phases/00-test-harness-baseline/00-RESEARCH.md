# Phase 00: Test Harness (Baseline) - Research

**Researched:** 2026-03-19  
**Domain:** Vitest-based unit test harness for Vite+ESM repo; Node/Vercel-style API handler unit testing; deterministic service-level tests without live Supabase  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
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

### Deferred Ideas (OUT OF SCOPE)
- CI test runs (GitHub Actions) if it risks slowing iteration; can be added once `npm test` is stable locally.
- E2E tests (Playwright) until the highest-risk unit/integration surfaces are covered.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TEST-01 | Add a test runner configuration suitable for this repo (unit tests at minimum) and add high-priority regression tests for queue invariants + `/api/*` security behaviors (plus sanitizer configuration correctness) | This research specifies a Vitest 4.x + Vite 7-compatible setup for ESM, a concrete test file layout, and patterns to unit-test Vercel-style `api/` handlers and queue orchestration without live Supabase. It also identifies “wave 0” gaps needed to add a sanitizer regression test later (if not included in Phase 0 scope). |
</phase_requirements>

## Summary

This repo has **no test runner today** (no `test` scripts, no `*.test.*` files, no test config). It is already a modern **ESM** Vite project (`"type": "module"`, Vite `^7.2.4`), so the lowest-friction baseline is **Vitest** integrated with Vite’s module graph and aliases.

Phase 0’s test harness should target **deterministic, local-only unit tests** that cover the highest-risk surfaces called out in `.planning/codebase/CONCERNS.md`, without requiring live Supabase:
- `/api/proxy` can be tested by **mocking global `fetch`** and asserting status/headers/body behavior using a lightweight `req`/`res` mock.
- `/api/profile-meta` can be tested by **stubbing the Supabase client** (mock `createClient`) and asserting generated HTML contains **escaped/encoded outputs** for hostile `display_name` values.
- Queue invariants can be tested at the service/orchestration boundary by **mocking the `supabase` client module** used by `src/services/supabase/queue.js` and asserting call sequencing + invariants (e.g., “at most one PLAYING transition”) at the unit boundary feasible before the DB/RPC work lands.

**Primary recommendation:** Add Vitest 4.1 with a minimal `vitest.config.js`, scripts (`test`, `test:watch`, `coverage`), a tiny `test/utils/mockReqRes.js`, and 3–5 high-signal unit tests in `api/**/__tests__` and `src/**/__tests__`.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `vitest` | **4.1.0** (2026-03-12) | Unit test runner integrated with Vite | Best fit for Vite+ESM; supports Node env + jsdom/happy-dom environments; first-class mocking (`vi.*`) |
| `@vitest/coverage-v8` | **4.1.0** (2026-03-12) | Optional coverage collection via V8 | Fast, low-overhead coverage option; can be enabled via `vitest run --coverage` without gating Phase 0 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `jsdom` | 29.0.0 | DOM environment emulation | Only when adding React/UI-adjacent tests that require DOM APIs |
| `happy-dom` | 20.8.4 | Faster DOM-like environment | Optional alternative if jsdom performance becomes an issue; use only if a test suite benefits |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vitest | Jest | More config friction in Vite+ESM projects; less aligned with Vite module graph |
| Direct network mocking | MSW | Adds more moving parts; keep out until needed (locked strategy) |

**Installation:**

```bash
npm i -D vitest @vitest/coverage-v8
```

**Version verification (npm registry):**
- `vitest`: 4.1.0 (published 2026-03-12)
- `@vitest/coverage-v8`: 4.1.0 (published 2026-03-12)

## Architecture Patterns

### Recommended Project Structure (Phase 0)
Keep to the locked placement conventions and add only a small amount of shared test infra:

```
api/
  proxy.js
  profile-meta.js
  __tests__/
    proxy.test.js
    profile-meta.test.js

src/
  services/
    supabase/
      queue.js
  __tests__/
    queue-invariants.test.js

test/
  setup.js
  utils/
    mockReqRes.js
```

### Pattern 1: Vitest config integrated with Vite (ESM)
**What:** Use `vitest/config`’s `defineConfig` in an ESM `vitest.config.js`, and set sane defaults: Node environment, `globals: true`, `setupFiles`.
**When to use:** Always (baseline); add per-file environment control comments only when a test needs jsdom/happy-dom.
**Example (official pattern):**

```js
// Source: Vitest coverage guide (shows `defineConfig` + `test.coverage`) https://main.vitest.dev/guide/coverage
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.js'],
    // Optional in Phase 0; keep non-gating:
    coverage: { provider: 'v8' },
  },
});
```

### Pattern 2: Per-file environment control comment for jsdom
**What:** Opt-in jsdom for specific test files via control comments.
**When to use:** Only for UI-adjacent tests that require `window`/DOM APIs.
**Example (official):**

```js
// Source: Vitest environment guide https://v4.vitest.dev/guide/environment
// @vitest-environment jsdom
import { expect, test } from 'vitest';

test('dom exists', () => {
  expect(typeof window).not.toBe('undefined');
});
```

### Pattern 3: Unit-testing Vercel-style `api/` handlers by mocking `req`/`res`
**What:** Handlers in this repo use Express-like `req.query` + chained `res.status(...).json(...)` and `res.setHeader(...)`. Build a tiny reusable `createMockRes()` helper that records headers/status/body, and a `createMockReq()` with just the properties used by the handler.
**When to use:** For `api/*.js` endpoints, to avoid starting a server.
**Example (repo-specific shape):**

```js
// Source: repo handler patterns in api/proxy.js + api/profile-meta.js
export function createMockReq({ method = 'GET', query = {}, headers = {}, body } = {}) {
  return { method, query, headers, body };
}

export function createMockRes() {
  const state = { status: 200, headers: {}, body: undefined };
  return {
    setHeader(key, value) { state.headers[String(key).toLowerCase()] = value; },
    status(code) { state.status = code; return this; },
    json(obj) { state.body = obj; return this; },
    send(body) { state.body = body; return this; },
    _state: state,
  };
}
```

### Anti-Patterns to Avoid
- **Mocking everything through deep import hacks:** Prefer mocking the smallest boundary (`globalThis.fetch`, `@supabase/supabase-js`’s `createClient`, or the local `supabase` module import in `queue.js`).
- **Tests that require a live Supabase instance:** Phase 0 must be local-only and deterministic.
- **Asserting on full HTML snapshots with volatile values:** Assert on targeted escaping/encoding outcomes and required meta tags instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Coverage | Custom coverage runner | `@vitest/coverage-v8` | Standardized reporting + optional enablement (`--coverage`) |
| Fake DOM | Custom DOM stubs | `jsdom` (only where needed) | Correctness + ecosystem expectations |
| Network mocking framework | A bespoke fetch interception layer | `vi.stubGlobal('fetch', ...)` first | Minimal moving parts; MSW only if tests prove insufficient |

**Key insight:** Phase 0’s value is **repeatable regression protection** with minimal friction; hand-rolled infrastructure tends to become the thing you debug instead of the app.

## Common Pitfalls

### Pitfall 1: ESM mocking surprises (module hoisting / import order)
**What goes wrong:** `vi.mock()` doesn’t affect already-imported modules; tests become order-dependent.
**Why it happens:** ESM imports are evaluated before runtime code unless you structure mocks carefully.
**How to avoid:** Use `vi.mock()` at top-level; for per-test variations, use `vi.resetModules()` + dynamic `await import(...)`, or mock the narrowest boundary (e.g., `globalThis.fetch`).
**Warning signs:** Tests pass alone but fail in full suite; failures disappear when reordering imports.

### Pitfall 2: Node vs browser environment mismatch
**What goes wrong:** Tests implicitly rely on DOM globals (or Vite “sandbox” behaviors) and fail in real Node.
**Why it happens:** Using jsdom globally when not needed, or accidentally relying on browser-only APIs.
**How to avoid:** Default environment `node`; opt-in jsdom per file using `// @vitest-environment jsdom`.
**Warning signs:** `window is not defined` or `document is not defined` errors; excessive jsdom usage.

### Pitfall 3: API handler tests that don’t match the handler’s real res behavior
**What goes wrong:** `res` mocks miss method chaining (`res.status(...).json(...)`) or header casing, causing false positives.
**Why it happens:** Handler implementations differ slightly across files.
**How to avoid:** Centralize the `mockReqRes` helper and keep it compatible with the actual patterns used in `api/proxy.js` and `api/profile-meta.js`.
**Warning signs:** Tests that “pass” but don’t actually read/assert captured state.

## Code Examples (repo-targeted)

### Mock `fetch` to test `/api/proxy`

```js
// Source: Vitest mocking primitives are standard; handler shape from api/proxy.js
import { describe, expect, it, vi } from 'vitest';
import handler from '../proxy.js';
import { createMockReq, createMockRes } from '../../test/utils/mockReqRes.js';

it('returns 400 on missing url', async () => {
  const req = createMockReq({ query: {} });
  const res = createMockRes();
  await handler(req, res);
  expect(res._state.status).toBe(400);
});

it('proxies buffer and sets headers', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    headers: new Map([['content-type', 'image/png']]),
    arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
  })));

  const req = createMockReq({ query: { url: 'https://example.com/a.png' } });
  const res = createMockRes();
  await handler(req, res);

  expect(res._state.headers['access-control-allow-origin']).toBe('*'); // Phase 1+ will tighten
  expect(res._state.headers['content-type']).toBe('image/png');
  expect(res._state.body).toBeInstanceOf(Buffer);
});
```

### Mock `@supabase/supabase-js` to test `/api/profile-meta` without live Supabase

```js
// Source: handler shape from api/profile-meta.js (uses createClient().from(...).select(...).eq(...).maybeSingle())
import { describe, expect, it, vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                display_name: '"><img src=x onerror=alert(1)>',
                display_photo_url: null,
                dx_display_photo_url: null,
                is_public: true,
              },
              error: null,
            }),
          }),
        }),
      }),
    }),
  };
});

import handler from '../profile-meta.js';
import { createMockReq, createMockRes } from '../../test/utils/mockReqRes.js';

it('escapes/encodes user-controlled values in HTML output', async () => {
  const req = createMockReq({ query: { slug: 'test' }, headers: { host: 'example.com' } });
  const res = createMockRes();
  await handler(req, res);

  expect(res._state.status).toBe(200);
  expect(res._state.headers['content-type']).toBe('text/html');
  const html = String(res._state.body);
  // Phase 1 will implement escaping; Phase 0 test should assert the desired behavior (will fail until fixed).
  expect(html).not.toContain('onerror=');
  expect(html).not.toContain('<img');
});
```

## State of the Art (relevant to Phase 0)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Ad-hoc manual testing only | Unit test harness + targeted regression tests | Phase 0 (this milestone) | Enables safe staged hardening of queue + API endpoints |

**Notable recent Vitest evolution:** Vitest 4.1 (2026-03-12) emphasizes closer-to-production Node behavior via the (optional) ability to disable Vite’s module runner (`experimental.viteModuleRunner: false`). This can be useful later for server-only tests, but is not required for Phase 0. Source: `https://vitest.dev/blog/vitest-4-1.html`.

## Open Questions

1. **Do we want a separate `vitest.config.js`, or embed `test:` config inside `vite.config.js`?**
   - What we know: Both are workable; repo already has `vite.config.js` and is ESM.
   - What's unclear: Team preference for keeping build vs test config separated.
   - Recommendation: Use `vitest.config.js` for clarity and minimal impact on build config.

2. **Should Phase 0 include the “rich-text sanitizer configuration correctness” test from `TEST-01`?**
   - What we know: `REQUIREMENTS.md` lists it; `Phase 0 CONTEXT.md` scope focuses on `/api/proxy`, `/api/profile-meta`, and queue invariants first.
   - What's unclear: Whether sanitizer standardization will land in Phase 0/1 or later (Phase 3 in roadmap).
   - Recommendation: Phase 0 harness should make adding that test trivial (no blockers). If there is an existing shared sanitizer module, add 1 small regression test now; otherwise defer the test to the sanitizer-standardization phase while keeping TEST-01 partially satisfied in Phase 0 and fully satisfied by Phase 3.

## Validation Architecture

Phase 0 is successful when the following **artifacts exist** and the following **commands are green locally** (no Supabase required):

### Required artifacts
- `vitest.config.js` (or a `test:` block inside `vite.config.js`) configuring:
  - Node environment by default
  - Optional coverage provider `v8` (non-gating)
  - `setupFiles` (even if minimal) to centralize any global stubs
- `test/utils/mockReqRes.js` (or equivalent) with `createMockReq` + `createMockRes` used by `api/**/__tests__/*`
- Test files at locked locations:
  - `api/**/__tests__/proxy.test.js`
  - `api/**/__tests__/profile-meta.test.js`
  - `src/**/__tests__/queue-invariants.test.js` (or smaller focused tests)
- `package.json` scripts:
  - `"test": "vitest"`
  - `"test:watch": "vitest --watch"`
  - `"coverage": "vitest run --coverage"`

### Green commands (proof)
- **Quick run:** `npm test` (should complete quickly, deterministic)
- **Watch run:** `npm run test:watch`
- **Optional coverage:** `npm run coverage` (generates `coverage/` directory; not a gate)
- **Non-regression gates that must still pass:** `npm run lint` and `npm run build`

### Phase 0 test expectations (behaviors)
- **`/api/proxy` tests:** prove current behavior and pin desired security expectations (even if failing until Phase 1 hardening lands), including:
  - missing `url` → 400
  - `fetch` failure → propagates status/500 handling
  - sets expected headers (CORS/cache/content-type) for now (Phase 1 will change CORS rules; tests should be updated then)
- **`/api/profile-meta` tests:** assert HTML output does not contain obvious injection vectors from hostile `display_name` and that URLs are encoded (Phase 1 will implement the escaping/encoding; tests should drive the fix)
- **Queue invariant tests:** at the most feasible unit boundary, verify:
  - `finishGame` makes exactly the expected updates in the expected order for provided IDs
  - reorder helper calls the expected update operations (Phase 2 will replace with RPC/bulk update; tests should be refactored with the implementation)

## Sources

### Primary (HIGH confidence)
- Vitest 4.1 release announcement (date + ecosystem direction): `https://vitest.dev/blog/vitest-4-1.html`
- Vitest Coverage guide (`@vitest/coverage-v8`, `--coverage`, config): `https://main.vitest.dev/guide/coverage`
- Vitest environment guide (jsdom control comments, environments list): `https://v4.vitest.dev/guide/environment`

### Secondary (MEDIUM confidence)
- npm registry metadata used to verify versions/publish dates:
  - `npm view vitest version` → 4.1.0
  - `npm view @vitest/coverage-v8 version` → 4.1.0

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — verified via npm registry + official Vitest docs
- Architecture patterns: **MEDIUM** — official Vitest patterns + repo-specific handler shapes
- Pitfalls: **MEDIUM** — common ESM/Vitest gotchas; should be validated once first tests are added

**Research date:** 2026-03-19  
**Valid until:** 2026-04-18 (30 days; Vitest/Vite move quickly)

