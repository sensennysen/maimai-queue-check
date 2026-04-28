# Testing Patterns

**Analysis Date:** 2026-03-19

## Test Framework
**Runner:**
- Not detected in this repo.
  - `package.json` has no `test`/`coverage` scripts and no test runner dependencies (e.g., no `vitest`, `jest`, `playwright`, or `cypress`).
  - No automated test files (no `*.test.*` / `*.spec.*`) detected across `src/`.

**Assertion Library:**
- Not applicable (no test runner present).

**Run Commands:**
```bash
npm run lint        # ESLint gate (also enforced pre-commit via Husky + lint-staged)
npm run lint:fix   # ESLint auto-fix
npm run build       # Vite build sanity check
```

## Test File Organization
- Not applicable (no automated test suite yet).

## Test Structure
- Not applicable (no test runner present).

## Mocking
- Not applicable (no test runner present).

## Fixtures and Factories
- Not applicable (no test runner present).

## Coverage
**Requirements:** None enforced.

**View Coverage:**
- N/A (no coverage tooling configured).

## Test Types
**Unit Tests:**
- Not currently configured.

**Integration Tests:**
- Not currently configured.

**E2E Tests:**
- Not currently configured.

## Existing Quality Gates (Current State)
- Linting: `.husky/pre-commit` runs `npx lint-staged`, which applies `eslint --fix` then `eslint` using the `lint-staged` config in `package.json`.
- Build: `npm run build` runs `vite build`.
- Manual QA: validation relies on human/UAT verification rather than automated test runs.

## CI/CD
- No GitHub Actions workflow files detected under `.github/workflows/` for running tests.
- No repo CI test job is configured; quality gating is local via pre-commit lint + build commands.

---

*Testing analysis: 2026-03-19*
