# Coding Conventions

**Analysis Date:** 2025-02-23

## Naming Patterns

**Files:**
- Components and pages: PascalCase with `.jsx` (e.g. `QueueManager.jsx`, `PublicProfilePage.jsx`).
- Hooks: `use` prefix with PascalCase, `.js` (e.g. `useAuth.js`, `useQueueManager.js`).
- Services, utils, config, contexts: camelCase or descriptive name, `.js` (e.g. `supabase.js`, `validation.js`, `maimai-constants.js`).
- Context definitions: suffix `Def` or `Provider` where applicable (e.g. `AuthContextProvider.js`, `SongDatabaseContextDef.js`).

**Functions:**
- camelCase for functions and methods (e.g. `getUserRoles`, `refreshUserRoles`, `validateData`).
- Handler props: `on` + PascalCase or `handle` + PascalCase (e.g. `onEdit`, `onRemove`, `handleConsentAccepted`).

**Variables:**
- camelCase for variables and state (e.g. `userRoles`, `selectedBranch`, `isMutating`).
- Constants: UPPER_SNAKE_CASE (e.g. `MAX_FILE_SIZE`, `ALLOWED_IMAGE_TYPES`, `DIFFICULTY_COLORS`). ESLint ignores unused vars matching `^[A-Z_]`.

**Types:**
- No TypeScript; JSDoc used sparingly for complex parameters and return shapes (see `src/utils/validation.js`, `src/config/maimai-constants.js`).

**Components:**
- PascalCase. Default export for UI components (e.g. `export default App`, `export default QueueItem`).
- Feature components live under `src/features/<feature>/components/`.

## Code Style

**Formatting:**
- No Prettier or Biome detected. Formatting is enforced only via ESLint.
- Semicolons: required (`semi: ['error', 'always']` in `eslint.config.js`).

**Linting:**
- ESLint 9 flat config in `eslint.config.js`.
- Extends: `@eslint/js` recommended, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` (Vite).
- Files: `**/*.{js,jsx}`; `dist` ignored.
- Key rules: `no-unused-vars` with `varsIgnorePattern: '^[A-Z_]'`, `semi: ['error', 'always']`.
- Run: `npm run lint`, `npm run lint:fix`. Pre-commit runs lint-staged; lint-staged only targets `*.{js,jsx}`.

## Import Organization

**Order:**
1. React (e.g. `import { useState, useEffect } from 'react'`).
2. External libraries (Mantine, react-router-dom, @tabler/icons-react, etc.).
3. Internal modules: contexts, hooks, services, utils, config, components — relative paths.
4. CSS/asset imports last (e.g. `import './QueueItem.css'`).

**Path style:**
- Relative paths only; no path aliases in config (e.g. `'../contexts/AuthContext'`, `'../../hooks/useBranch'`).
- Tabler icons sometimes use explicit `.mjs` paths (e.g. `@tabler/icons-react/dist/esm/icons/IconEdit.mjs`).

**Examples from codebase:**
- `src/features/queue/components/QueueItem.jsx`: React, then Tabler, then Mantine, then local CSS.
- `src/App.jsx`: React, Mantine, Vercel, router, then contexts/hooks/components.

## Error Handling

**Patterns:**
- **Services (`src/services/supabase.js`)**: Supabase `{ data, error }` — on `error` use `throw error` for caller to handle. Optional try/catch for non-critical paths (e.g. legacy `user_roles` sync) with `console.warn` and continue.
- **Validation**: Use `validateData(schema, data)` from `src/utils/validation.js`; returns `{ success, data?, error? }`. Callers check `if (!validation.success) throw new Error(validation.error)` before proceeding.
- **Hooks that require context**: Throw if used outside provider (e.g. `useAuth` in `src/hooks/useAuth.js`: `if (!context) throw new Error('useAuth must be used within an AuthProvider')`).
- **Async in UI**: try/catch with `console.error` and user-facing feedback via `notifications.show({ title, message, color: 'red' })` (from `@mantine/notifications`).

**User-facing errors:**
- Use `notifications.show({ title, message, color })` for success/error/info (e.g. `src/components/profile/FavoriteSongsSection.jsx`, `src/features/admin/components/UserTable.jsx`).

## Logging

**Framework:** `console` only (no dedicated logger).

**Patterns:**
- `console.error` for failures that should be visible in dev (e.g. role fetch, playlist delete, upload errors). See `src/services/supabase.js`, `src/pages/PublicProfilePage.jsx`, `src/contexts/SongDatabaseContext.jsx`.
- `console.warn` for non-fatal issues (e.g. cache write failure, legacy sync failure, missing song/sheet in `src/utils/maimai-calc.js`).
- Avoid logging sensitive data; log messages are short and contextual.

## Comments

**When to comment:**
- Non-obvious business rules (e.g. 60-day slug update, legacy user_roles sync).
- Section headers for large files (e.g. "Authentication service functions", "Queue service functions" in `supabase.js`).

**JSDoc:**
- Used for public helpers and schemas: `src/utils/validation.js` (schemas and `validateData`), `src/config/maimai-constants.js` (`normalizeDifficulty`), `src/hooks/useQueueManager.js`, `src/hooks/useMouseDragScroll.js`, `src/hooks/useLocationVerification.js`.
- Complex component props documented with `@param` (e.g. `src/features/queue/components/NowPlayingCard.jsx`).
- No project-wide JSDoc requirement; use for exported utilities and non-obvious contracts.

## Function Design

**Size:** No strict limit; services contain many methods in a single file (e.g. `supabase.js`). Prefer smaller hooks composed in larger ones (e.g. `useQueueManager` composes `useQueueData`, `useQueueActions`, `useCabinetManager`).

**Parameters:** Object args for many options (e.g. `getAllUsersForAdmin({ page, pageSize, searchQuery, sortField, sortDirection, adminBranch })`). Positional for simple, fixed arity (e.g. `addQueueEntry(player1, player2, orderPosition, userId, branchId, cabinetNum)`).

**Return values:** Async functions return data or throw; some return safe defaults on error (e.g. `rolesService.getUserRoles` returns a minimal roles object on catch).

## Module Design

**Exports:**
- **Components/pages:** Default export (single component per file).
- **Hooks:** Named export (e.g. `export const useAuth = () => ...`).
- **Contexts:** Named export for provider and context (e.g. `AuthContext`, `AuthProvider` from `AuthContext.jsx`; context value type from `AuthContextProvider.js`).
- **Services:** Named object exports (e.g. `authService`, `userService`, `queueService`, `branchService` from `src/services/supabase.js`).
- **Utils/config:** Named exports for constants and functions (e.g. `validateData`, `userProfileSchema`, `queueEntrySchema` from `src/utils/validation.js`; `DIFFICULTY_COLORS`, `normalizeDifficulty` from `src/config/maimai-constants.js`).

**Barrel files:** Not used; import from concrete paths (e.g. `from '../services/supabase'`, `from '../hooks/useAuth'`).

---

*Convention analysis: 2025-02-23*
