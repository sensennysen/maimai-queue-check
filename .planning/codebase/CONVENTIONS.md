# Conventions

**Last mapped:** 2026-02-24

## Code Style

- **Semicolons:** Required (`eslint.config.js`: `semi: ['error', 'always']`).
- **JS/JSX:** No TypeScript; JSDoc and `src/types/` used where shapes are documented.
- **Unused vars:** Error except names matching `^[A-Z_]` (constants).
- **Modules:** ESM only; default and named exports; no CommonJS.

## Naming

- **Components:** PascalCase (`QueueManager.jsx`, `BranchSelector.jsx`).
- **Hooks:** `use` prefix (`useQueueData.js`, `useAuth.js`).
- **Services:** camelCase exports (`authService`, `queueService`); file names match domain (`auth.js`, `queue.js`).
- **Contexts:** `*Context.jsx` or `*ContextProvider.js`; providers as `*Provider`.
- **Constants:** UPPER_SNAKE or `^[A-Z_]` where ignored by no-unused-vars.

## Validation

- **Zod:** Schemas in `src/utils/validation.js` (e.g. `userProfileSchema`, `queueEntrySchema`, `contactReportSchema`). File fields use `z.instanceof(File)` with `.refine()` for size/type; contact report uses optional file.
- **Usage:** `validateData(schema, data)` returns `{ success, data? }` or `{ success: false, error }`; callers throw or surface error to user.
- **API boundaries:** Validate before Supabase insert/update where applicable (e.g. contact submit, queue entries).

## Error Handling

- **Services:** Try/catch in async functions; log (`console.error`) and rethrow or return safe default (e.g. `getUserRoles` returns minimal permissions on error). No silent empty `.catch(() => {})` in critical paths; post-remediation async paths log at minimum.
- **UI:** Notifications (Mantine) for user-facing errors (e.g. "Roles could not be loaded"); error states in hooks/context for loading failures.
- **Auth/roles:** Timeout (e.g. 5s) for role fetch with fallback to safe defaults and non-blocking notification.

## ESLint

- **Config:** Flat config in `eslint.config.js`; react-hooks and react-refresh recommended.
- **Disables:** Intentional disables have short comments (e.g. ref identity, run-once effect). Examples: `react-refresh/only-export-components` for context files; `react-hooks/exhaustive-deps` or `react-hooks/immutability` where justified and documented.
- **Scope:** No global disable of exhaustive-deps; file/line only.

## React Patterns

- **Context:** Provider order: Theme → Branch → Auth → SongDatabase → FeatureFlag. Loading state owned by provider; consumers use hooks and handle loading/empty.
- **Lazy loading:** Heavy pages lazy-loaded (`lazy(() => import(...))`) with single `Suspense` and shared fallback (loader) in `App.jsx`.
- **Hooks:** Compose services and context; avoid raw Supabase in UI components.

## Security

- **User/DB HTML:** DOMPurify before any `dangerouslySetInnerHTML` for user or DB-sourced content.
- **Env:** Only `VITE_*` in client; no secrets; Supabase anon key only.
- **Storage:** Role cache in localStorage under `user_roles_${uid}`; cleared on logout.

## File / Upload

- **Validation:** Zod with `z.instanceof(File)` and refines for size and MIME; client-side only (server-side MIME not in app code; signed URLs mitigate risk).
- **Contact report:** Optional file; text and file validated separately in `contact.js`.
