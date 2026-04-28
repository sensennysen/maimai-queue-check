# Coding Conventions

**Analysis Date:** 2026-03-19

## Naming Patterns
**Files:**
- React components: PascalCase in `.jsx` (e.g., `src/features/queue/components/QueueManager.jsx`, `src/pages/FeedPage.jsx`)
- Custom hooks: `use` + PascalCase in `.js` (e.g., `src/hooks/useAuth.js`, `src/hooks/useQueueActions.js`)
- Context definitions (shared context value shape): `*ContextDef.js` in `src/contexts/` (e.g., `src/contexts/FeatureFlagContextDef.js`, `src/contexts/SongDatabaseContextDef.js`)
- Auth context definition: `AuthContextProvider.js` (e.g., `src/contexts/AuthContextProvider.js`)
- Context providers + logic: `*.jsx` when they implement effects/subscriptions (e.g., `src/contexts/AuthContext.jsx`, `src/contexts/BranchContext.jsx`, `src/contexts/ThemeContext.jsx`)
- Services: domain modules under `src/services/` and `src/services/supabase/` (e.g., `src/services/geolocation.js`, `src/services/supabase/queue.js`)
- Constants: `src/constants/*.js` (e.g., `src/constants/database.js`, `src/constants/storage.js`, `src/constants/queue.js`)

**Functions:**
- Use `async` + `try/catch/finally` when managing UI loading state (e.g., `src/contexts/BranchContext.jsx` `loadBranches`, `src/contexts/AuthContext.jsx` role refresh and sign-in/out flows).
- Extract compute/transform helpers into small functions with JSDoc (e.g., `src/utils/maimai-calc.js` `calculateSongRating`, `getGrade`).

**Variables:**
- Hooks expose UI-state as `loading`/`error` booleans and strings (e.g., `src/hooks/useQueueManager.js`).

**Types:**
- No TypeScript types detected; use JSDoc for documentation and Zod for runtime validation (e.g., `src/utils/validation.js`).

## Code Style
**Formatting:**
- Formatting is handled via ESLint auto-fix (`npm run lint:fix` / `eslint --fix`) rather than a dedicated formatter (no Prettier/Biome config detected in repo).
- Codebase is ESM (`package.json` `"type": "module"`), so `import`/`export` is used throughout.

**Linting:**
- Tool: ESLint 9 flat config in `eslint.config.js`.
- Key enforced rules in `eslint.config.js`:
  - `no-unused-vars: error` (enforced globally for `**/*.{js,jsx}`)
  - `semi: ['error', 'always']`
  - React JSX linting (e.g., hooks, React refresh rules) configured via `eslint-plugin-react*` in `eslint.config.js`.
- Scope:
  - Primary linting applies to `**/*.{js,jsx}` via `eslint.config.js`.
  - Node globals are enabled for `api/**/*.js` and `scripts/**/*.js` in `eslint.config.js`.
- Repo ignores:
  - ESLint ignores `dist`, `.opencode/**`, `.gemini/**`, `.claude/**` via `globalIgnores(...)` in `eslint.config.js`.

## Import Organization
**Order:**
1. Third-party imports first (e.g., `react`, `@mantine/*`)
2. Local relative imports (`./` and `../`)
(Observed in `src/App.jsx` and `src/features/queue/components/QueueManager.jsx`.)

**Path Aliases:**
- No alias configuration detected in `vite.config.js`; imports use relative paths (e.g., `./contexts/ThemeContext` in `src/App.jsx`).

## Error Handling
**Patterns:**
- Service layer validates inputs and throws on errors:
  - `src/services/supabase/queue.js` throws when `validateData(...)` fails and also throws on Supabase `error`.
- Hooks catch errors, surface them to UI state, and often rethrow:
  - `src/hooks/useQueueActions.js` does `setError(err.message)` in `catch` and rethrows.
- UI components present errors to users:
  - `src/features/queue/components/QueueManager.jsx` uses Mantine `notifications.show(...)` and reads hook `error` state to render Mantine `Alert`.

**Async state management:**
- Prefer `try/catch/finally` around mutations and fetches so `loading`/`isMutating` always resets:
  - `src/contexts/BranchContext.jsx` and `src/hooks/useQueueActions.js`.

**Non-critical diagnostics:**
- Use `console.warn` for recoverable conditions and `console.error` for unexpected failures (e.g., `src/utils/maimai-calc.js`, `src/contexts/FeatureFlagContext.jsx`).

## Logging
**Framework:** `console` + user-facing Mantine notifications (`@mantine/notifications`).

**Patterns:**
- For user-impacting errors, prefer `notifications.show(...)` (e.g., `src/contexts/AuthContext.jsx`, `src/features/playlists/hooks/useSharedPlaylists.js`).
- Use `console.*` for diagnostics that do not need a UI alert (e.g., network retries, fallback paths).

## Comments
**When to Comment:**
- Use JSDoc (`/** ... */`) with `@param` / `@returns` for non-trivial modules and public exports (e.g., `src/utils/maimai-calc.js`, `src/services/geolocation.js`, `src/hooks/useQueueActions.js`).
- `eslint-disable` directives include justification comments where needed (e.g., `src/contexts/BranchContext.jsx`).
- Prefer narrow suppressions (`// eslint-disable-next-line ...`) over file-wide disables where possible (e.g., `src/components/layout/BranchSelector.jsx`).

## Function Design
**Size:**
- Prefer decomposition into helper functions inside the same module for compute-heavy logic (e.g., `src/utils/maimai-calc.js` `processScore`, `buildSongMap`).

**Parameters:**
- Pass dependencies explicitly into hooks via an options object when it improves callsite clarity (e.g., `src/hooks/useQueueActions.js` `options` argument).

**Return Values:**
- Use structured objects for domain checks:
  - `src/services/geolocation.js` returns `{ allowed, reason, location, proximity, error? }`.
- Use Zod validation helpers that return `{ success, data?, error? }` without throwing:
  - `src/utils/validation.js` `validateData`.

## Module Design
**Exports:**
- Services/utilities: named exports (e.g., `queueService` in `src/services/supabase/queue.js`).
- React components: default exports for main component exports (e.g., `export default QueueManager` in `src/features/queue/components/QueueManager.jsx`).

**Barrel Files:**
- `src/services/supabase.js` is a facade/backwards-compat re-export for submodules:
  - `src/services/supabase/queue.js`, `src/services/supabase/auth.js`, `src/services/supabase/client.js` (import directly in new code when possible).

## Local Quality Gates

**Pre-commit:**
- Husky runs `npx lint-staged` on commit via `.husky/pre-commit`.
- `lint-staged` configuration lives in `package.json`:
  - For `*.{js,jsx}` it runs `eslint --fix` then `eslint`.

---

*Convention analysis: 2026-03-19*
