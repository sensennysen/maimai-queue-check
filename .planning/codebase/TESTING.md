# TESTING.md — Test Structure & Practices

## Current State

> [!IMPORTANT]
> **This project has no automated test suite.** There are no test files, no testing framework configured, and no test scripts in `package.json`.

## What Exists Instead

### ESLint (Static Analysis)
- `eslint` v9 with flat config (`eslint.config.js`)
- `eslint-plugin-react-hooks` — catches hook rule violations at lint time
- `eslint-plugin-react-refresh` — flags HMR-unsafe patterns
- Run via: `npm run lint` or `npm run lint:fix`
- Pre-commit hook enforces lint via `husky` + `lint-staged`

### Manual Verification
All features are validated manually via the running dev server (`npm run dev`). The project has relied on:
- Live browser testing with `vite` HMR
- Supabase dashboard inspection for DB changes
- `npm run build:analyze` (rollup-plugin-visualizer) for bundle size inspection

### Type Safety
- No TypeScript
- Zod schemas in `src/utils/validation.js` provide runtime input validation on user-submitted data (queue entries, profiles, contact reports)
- No compile-time type checking

## Verification Methods Used in Planning Docs

The `.planning/` directory documents "verification plans" for each phase using these methods:

| Method | Tooling |
|--------|---------|
| Dev server smoke test | `npm run dev` → manual browser check |
| Build check | `npm run build` → no errors |
| Lint check | `npm run lint` → zero errors |
| Supabase query verification | Manual Supabase dashboard or MCP `execute_sql` |

## Recommendations (Not Yet Implemented)

If a test suite is added in the future, the following would be good starting points:

| Area | Suggested Tool |
|------|---------------|
| Unit tests (utils, services) | Vitest (co-located with Vite) |
| Component tests | @testing-library/react |
| Zod schema tests | Vitest + raw schema calls |
| E2E | Playwright |

The service layer (`src/services/supabase/*.js`) is well-isolated and would be easy to test with mocked Supabase clients.

## Build Validation

```bash
npm run build        # Full production build (catches import errors, missing modules)
npm run build:analyze  # Bundle size analysis (opens stats.html)
npm run lint         # ESLint (zero-error requirement)
```

The CI/CD pipeline (`.github/` workflows) runs on push — check `.github/` for exact steps.
