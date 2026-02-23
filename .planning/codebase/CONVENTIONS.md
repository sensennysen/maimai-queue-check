# CONVENTIONS.md — Code Style & Patterns

## Language & Module System

- **JavaScript only** — no TypeScript (JSDoc comments used sparingly)
- **ES Modules** (`import`/`export`), `"type": "module"` in package.json
- **No default parameter objects** — services use named parameters or destructuring

## File Organization

| File type | Extension | Location |
|-----------|-----------|----------|
| React components | `.jsx` | `src/components/`, `src/features/`, `src/pages/` |
| Hooks | `.js` | `src/hooks/` |
| Services | `.js` | `src/services/` |
| Utilities | `.js` | `src/utils/` |
| Context defs (to avoid circular imports) | `.js` | `src/contexts/*Def.js` pair pattern |

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| React components | PascalCase | `QueueManager`, `BranchSelector` |
| Custom hooks | `use` prefix, camelCase | `useQueueData`, `useAuth` |
| Service objects | camelCase + `Service` suffix | `queueService`, `authService` |
| Context objects | PascalCase + `Context` | `AuthContext`, `BranchContext` |
| Constants (enum values) | SCREAMING_SNAKE_CASE | `QUEUE_STATUS.PLAYING` |
| Zod schemas | camelCase + `Schema` | `queueEntrySchema`, `userProfileSchema` |
| Database fields | snake_case (Postgres naming) | `branch_id`, `created_at` |

## Service Pattern

Services are plain JS objects with async methods — no classes, no singletons beyond the Supabase client.

```js
// ✅ Correct service pattern
export const queueService = {
  async getQueueEntries(branchId, cabinetNum = null) {
    const { data, error } = await supabase.from('queue_entries')...;
    if (error) throw error;
    return data || [];
  }
};

// ✅ Correct subscription pattern
export const subscribeToQueueChanges = (callback, branchId) => {
  const channel = supabase.channel(uniqueId)
    .on('postgres_changes', config, callback)
    .subscribe();
  return channel;
};
```

## Error Handling

- Services: `if (error) throw error;` — let callers handle
- Some services return safe defaults on partial failures (e.g., `auth.js` `getUserRoles` returns `{ can_edit: false, is_admin: false }` on any error)
- Hooks use `setError(err.message)` + surface to UI
- `AuthContext` uses `notifications.show(...)` (Mantine) to surface role-fetch failures to user (FRAG-03 fix)
- `console.error` used for non-critical partial failures (e.g., clearing most-played songs during data wipe)

> [!WARNING]
> **DEBT-04:** `useQueueData` does not set error state when real-time queue refresh fails — errors are only logged via `console.error`, not surfaced to the user.

## Validation Pattern

All user-submitted data is validated via Zod before reaching the database:

```js
// Inside service method:
const validation = validateData(queueEntrySchema, { player1, player2, ... });
if (!validation.success) throw new Error(validation.error);
// proceed with DB call...
```

`validateData` returns `{ success, data?, error? }` and only surfaces the first error. Schemas live in `src/utils/validation.js`.

> [!WARNING]
> **DEBT-03:** `contactReportSchema` uses `z.instanceof(File)` for file validation, which doesn't work in server-side/SSR/test environments. The allowed MIME types (`image/*` only) are not exhaustive for general file attachments.

## React Patterns

### Context / Hooks
- Context split: one Provider file + one thin context def file (e.g., `AuthContext.jsx` + `AuthContextProvider.js`) to prevent circular imports
- Each context has a corresponding `use<Name>` hook for consumption

### Component Structure
```jsx
// Functional components only — no class components
export default function ComponentName({ prop1, prop2 }) {
  // hooks first
  // derived state
  // handlers
  // return JSX
}
```

### Lazy Loading
Pages are lazy-loaded with `React.lazy()` + `<Suspense>`. Fallback: full-page Mantine `<Loader>`.

### Performance
- `useCallback` used for stable handlers (e.g., `refreshUserRoles`, `loadInitialData`)
- `useMemo` used for expensive derived values (e.g., dynamic Mantine theme in `AppProviders`)

## CSS Conventions

- **Vanilla CSS** — no Tailwind, no CSS Modules
- Global CSS tokens in `src/index.css`, component-level overrides in co-located `.css` files
- Animation classes: `animate-fade-in`, `delay-100`, `delay-200`, `delay-300` (utility classes in `index.css`)
- Mantine's `theme.colors` extended with `primary`, `secondary`, `accent` (10-shade arrays)

> [!NOTE]
> `background-attachment: fixed` and `backdrop-filter` were removed from global CSS (Phase 02 PERF work) due to GPU layer promotion causing scroll jank on mobile.

## Comments & Documentation

- JSDoc used on some hooks and utilities
- Inline comments used for non-obvious logic, security decisions (tagged `SEC-XX`), and performance decisions (tagged `PERF-XX`)
- `TODO` / `FIXME` comments exist in some files but are not tracked systematically

## Import Order (Informal)

1. React core imports
2. Third-party packages (Mantine, Supabase, etc.)
3. Internal services
4. Internal contexts / hooks
5. Local components
6. CSS imports

## ESLint Rules (Enforced)

| Rule | Setting |
|------|---------|
| `no-unused-vars` | error; ignores `^[A-Z_]` pattern (capitalized constants) |
| `semi` | error; always required |
| react-hooks rules | recommended (exhaustive-deps) |
| react-refresh rules | vite preset |

**Pre-commit:** `lint-staged` runs `eslint --fix` then `eslint` on staged `*.{js,jsx}` via Husky.

> [!WARNING]
> **DEBT-02:** Several files contain `// eslint-disable` comments to suppress specific rules rather than fixing the underlying issue. These should be resolved as part of the tech debt phase.
