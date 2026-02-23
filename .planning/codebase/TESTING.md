# Testing Patterns

**Analysis Date:** 2025-02-23

## Test Framework

**Runner:** Not detected. No Jest, Vitest, or other test runner is configured.

**Assertion library:** Not applicable.

**Run commands:** None. `package.json` has no `test` or `test:watch` scripts.

**Config:** No `jest.config.*`, `vitest.config.*`, or `setupTests.*` files present.

## Test File Organization

**Location:** Not applicable — no test files found.

**Naming:** Not applicable. When adding tests, common patterns would be `*.test.js` / `*.spec.js` or co-located `*.test.jsx` beside components.

**Structure:** No test directory layout exists (e.g. no `src/__tests__/`, no `*.test.js` next to source).

## Test Structure

**Suite organization:** N/A. When introducing tests, use a single runner (e.g. Vitest) and standard `describe` / `it` (or `test`) blocks.

**Patterns:** N/A. No existing setup/teardown or assertion patterns in the repo.

## Mocking

**Framework:** Not used. No test runner implies no mocking setup.

**What to mock when tests are added:**
- `src/services/supabase.js` and Supabase client (network and auth).
- `import.meta.env` (e.g. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in any module that reads env at load time.
- Browser APIs used in hooks (e.g. `localStorage`, `navigator.geolocation`) and in components (e.g. `window.confirm` in `QueueItem.jsx`).

**What NOT to mock:**
- Pure utils with no I/O (e.g. `src/utils/validation.js` schemas and `validateData`, `src/utils/maimai-calc.js` calculation helpers) — test with real inputs.

## Fixtures and Factories

**Test data:** None. No fixture files or factories in the repo.

**Recommendation:** When adding tests, add minimal fixtures (e.g. valid/invalid payloads for Zod schemas, mock queue entries) under `src/__tests__/fixtures/` or next to the test file, and reuse for validation and service-unit tests.

## Coverage

**Requirements:** None. No coverage script or threshold configuration.

**View coverage:** N/A. With Vitest, typical commands would be `npx vitest run --coverage` and configure in `vite.config.js` or `vitest.config.js`.

## Test Types

**Unit tests:** Not present. Good first targets when adding tests: `src/utils/validation.js` (`validateData`, schemas), `src/utils/maimai-calc.js` (rating/grade and score processing), and pure helpers in `src/config/maimai-constants.js`.

**Integration tests:** Not present. Services in `src/services/supabase.js` would require a test Supabase client or mocks.

**E2E tests:** Not used. No Playwright, Cypress, or similar.

## Recommended Setup (When Adding Tests)

- **Runner:** Vitest — aligns with Vite (`vite.config.js`), ESM, and `import.meta.env`. Add `vitest` as dev dependency and a `test` script (e.g. `vitest run`, `vitest` for watch).
- **Location:** Co-located `*.test.js` / `*.test.jsx` next to source, or a top-level `src/__tests__/` for shared fixtures and integration-style tests.
- **Mocking:** Use `vi.mock()` for `../services/supabase` and env; use `vi.stubEnv()` or a test env file for `import.meta.env` if needed.
- **Async:** Use `async`/`await` in tests; Vitest supports promises in `it()` and `beforeEach`/`afterEach`.

---

*Testing analysis: 2025-02-23*
