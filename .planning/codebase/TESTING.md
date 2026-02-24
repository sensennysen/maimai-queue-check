# Testing

**Last mapped:** 2026-02-24

## Current State

- **No test framework** in the project. `package.json` has no Jest, Vitest, React Testing Library, or similar.
- **No test scripts** (e.g. `test`, `test:watch`, `coverage`).
- **No dedicated test directory** (e.g. `__tests__/`, `src/**/*.test.js`, `e2e/`).
- **No CI test step** implied by repo (only lint-staged and ESLint in scripts).

## What Exists

- **Lint:** `npm run lint` / `lint:fix` run ESLint on `*.{js,jsx}`; pre-commit runs fix + lint via lint-staged. Catches many syntax and React-hooks issues; not a substitute for unit/integration tests.
- **Manual/QA:** Features are validated manually; no automated E2E or component tests in repo.
- **Validation logic:** `src/utils/validation.js` and `src/utils/maimai-calc.js` are good candidates for future unit tests (pure schemas and calculations).

## Gaps

- No unit tests for services, hooks, or utils.
- No component tests for UI behavior.
- No E2E tests for critical flows (queue, admin, profile).
- No coverage reporting or thresholds.
- Remediation (see `.planning/PROJECT.md` and STATE.md) explicitly left tests out of scope; a separate initiative is expected for adding a test harness (e.g. Vitest + React Testing Library) and core tests.

## Recommendations (Future)

- Add Vitest (or Jest) + React Testing Library when introducing tests; align with Vite (Vitest fits well).
- Prioritize: validation schemas, maimai-calc, then critical service functions and hooks.
- E2E: consider Playwright or Cypress in a later phase if needed.
- Keep tests out of the main bundle; run in CI via `npm run test` when added.
