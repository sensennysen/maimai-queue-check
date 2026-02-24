# Architecture

**Analysis Date:** 2026-02-24

## Pattern Overview

**Overall:** React SPA with feature-based modules, context-based state, and a service layer backed by Supabase.

**Key Characteristics:**
- Single-page app (Vite + React 19, React Router 7)
- Global state via React Context (theme, auth, branch, song database, feature flags)
- Domain services in `src/services` (Supabase client + domain modules)
- Feature folders for queue, admin, and songs with co-located components and hooks
- Shared UI in `src/components` (layout, modals, profile, maimai)
- Validation at service boundary via Zod in `src/utils/validation.js`

## Layers

**Entry / Shell:**
- Purpose: Bootstrap app, routing, and provider tree
- Location: `src/main.jsx`, `src/App.jsx`, `index.html`
- Contains: `createRoot`, `BrowserRouter`, provider nesting, `Routes`, lazy page imports
- Depends on: React, Mantine, contexts, hooks, feature components
- Used by: Browser loads `index.html` → `main.jsx` → `App.jsx`

**Contexts (global state):**
- Purpose: Auth, selected branch, theme, song database cache, feature flags
- Location: `src/contexts/`
- Contains: `ThemeContext.jsx`, `BranchContext.jsx`, `AuthContext.jsx` + `AuthContextProvider.js`, `SongDatabaseContext.jsx` + `SongDatabaseContextDef.js`, `FeatureFlagContext.jsx` + `FeatureFlagContextDef.js`
- Depends on: React, services (supabase, geolocation), config, constants
- Used by: `App.jsx` (providers), pages, feature components, hooks (`useAuth`, `useBranch`, `useTheme`, `useSongDatabaseContext`, `useFeatureFlags`)

**Pages (route-level UI):**
- Purpose: Top-level route components; compose layout and feature components
- Location: `src/pages/`
- Contains: `AdminPage.jsx`, `ViewPage.jsx`, `SongsPage.jsx`, `ContactPage.jsx`, `ExportBest50Page.jsx`, `PublicProfilePage.jsx`
- Depends on: Layout components, feature components, hooks, services
- Used by: React Router `Route` elements in `App.jsx`

**Features (domain UI + logic):**
- Purpose: Domain-specific UI and behavior (queue, admin, songs)
- Location: `src/features/queue/`, `src/features/admin/`, `src/features/songs/`
- Contains: `components/` (e.g. `QueueManager.jsx`, `QueueList.jsx`, `UserTable.jsx`, `SongList.jsx`), `hooks/` where present (e.g. admin)
- Depends on: Shared components, hooks in `src/hooks`, services
- Used by: `App.jsx` (queue as default), pages (admin, songs, profile)

**Hooks (shared behavior):**
- Purpose: Reusable state and side effects (queue data/actions, auth, branch, permissions, location, visibility)
- Location: `src/hooks/`
- Contains: `useQueueManager.js`, `useQueueData.js`, `useQueueActions.js`, `useLocationVerification.js`, `useCabinetManager.js`, `useAuth.js`, `useBranch.js`, `usePermissions.js`, `useSongDatabaseContext.js`, `useFeatureFlags.js`, `usePageVisibility.js`, `useMallSchedule.js`, etc.
- Depends on: Contexts, services
- Used by: Pages, feature components, layout components

**Services (data & side effects):**
- Purpose: Supabase access, geolocation, validation; single place for API and RLS
- Location: `src/services/`
- Contains: `supabase.js` (facade), `supabase/client.js`, `supabase/auth.js`, `supabase/profile.js`, `supabase/queue.js`, `supabase/admin.js`, `supabase/contact.js`, `geolocation.js`, `songs.js`
- Depends on: `@supabase/supabase-js`, `src/utils/validation.js`, env (`VITE_SUPABASE_*`)
- Used by: Contexts, hooks

**Shared UI & config:**
- Purpose: Layout, modals, profile/maimai components, theme and app constants
- Location: `src/components/` (common, layout, modals, profile, maimai), `src/config/`, `src/constants/`, `src/data/`
- Contains: `Footer.jsx`, `BranchSelector.jsx`, `ThemeToggle.jsx`, `NotificationCenter.jsx`, modals, profile sections, `ScoreCard`, config (theme, maimai-constants), constants (queue, featureFlags), static data (changelog, subtitleMessages)
- Depends on: Mantine, hooks, services where needed
- Used by: `App.jsx`, pages, features

## Data Flow

**App load:**
1. `main.jsx` mounts `App` → `BrowserRouter` → `ThemeProvider` → `BranchProvider` → `AuthProvider` → `SongDatabaseProvider` → `FeatureFlagProvider` → `AppProviders` (Mantine + `Routes`).
2. `BranchProvider` loads branches via `branchService.getAllBranches()`, then selects branch from storage or default.
3. `AuthProvider` subscribes to Supabase auth state and loads roles via `rolesService.getUserRoles()` when user exists.
4. `SongDatabaseProvider` fetches songs only when `requestFetch()` is called (e.g. from Songs page or profile).
5. `FeatureFlagProvider` loads flags from `user_profiles` when user is present.

**Queue (default route):**
1. User sees `MainApp` → `QueueManager` (from `src/features/queue/components/QueueManager.jsx`).
2. `useQueueManager` composes `useCabinetManager`, `useQueueData`, `useLocationVerification`, `useQueueActions`.
3. `useQueueData` uses `queueService` and `subscribeToQueueChanges` for live list; `useQueueActions` performs add/update/remove/clear/end/start via services.
4. Location verification uses `geolocation.js` and `requestService` for access; consent and verification state live in `useLocationVerification`.

**Public profile (`/p/:slug`):**
1. `PublicProfilePage` reads `slug` from params, fetches profile/scores via `userService`, `mostPlayedService`, and song context.
2. Server-side metadata for sharing is served by `api/profile-meta.js` (Vercel serverless) using Supabase.

**State Management:**
- No global store library; React Context holds auth, branch, theme, song database, and feature flags.
- Feature state (e.g. queue list, selected cabinet) lives in hooks and component state.
- Supabase Realtime used for queue and session changes via `subscribeToQueueChanges` and `subscribeToSessionChanges` in `src/services/supabase/queue.js`.

## Key Abstractions

**Service objects:**
- Purpose: Named API surface per domain; validation and errors at boundary
- Examples: `src/services/supabase/auth.js` (`authService`, `rolesService`), `src/services/supabase/queue.js` (`queueService`), `src/services/supabase/profile.js` (`userService`, `favoritesService`, `playlistService`, `mostPlayedService`), `src/services/supabase/admin.js` (`branchService`, `scheduleService`, `adminService`, `requestService`, `rulesService`), `src/services/supabase/contact.js` (`contactService`, `notificationService`), `src/services/songs.js` (`songsService`), `src/services/geolocation.js` (standalone functions)
- Pattern: Export object with async methods; use shared `supabase` client from `src/services/supabase/client.js`; validate inputs with Zod via `validateData` in `src/utils/validation.js`

**Context + hook pairs:**
- Purpose: Provide global state and typed access
- Examples: `ThemeContext` + `useTheme`, `BranchContext` + `useBranch`, `AuthContext` + `useAuth`, `SongDatabaseContext` + `useSongDatabaseContext`, `FeatureFlagContext` + `useFeatureFlags`
- Pattern: Context defined in `*Context.jsx` or `*ContextDef.js`; provider in same or paired file; custom hook throws if used outside provider

**Composed feature hook:**
- Purpose: Single hook for a feature that coordinates data, actions, and side effects
- Example: `src/hooks/useQueueManager.js` composes `useCabinetManager`, `useQueueData`, `useLocationVerification`, `useQueueActions`
- Pattern: One public hook per feature area; internals stay in smaller hooks

## Entry Points

**Browser:**
- Location: `index.html` → script `src/main.jsx`
- Triggers: Page load
- Responsibilities: Mount React root, render `App` and Vercel SpeedInsights

**App:**
- Location: `src/App.jsx`
- Triggers: Rendered by `main.jsx`
- Responsibilities: Provider order, `Routes` (including lazy pages), `MainApp` for default route with header, branch selector, queue, footer; profile redirect from `/profile` to `/p/:slug`

**API (serverless):**
- Location: `api/profile-meta.js`
- Triggers: HTTP request (e.g. crawlers for `/p/:slug`)
- Responsibilities: Resolve profile by slug, return meta tags / OG payload for sharing

## Error Handling

**Strategy:** Throw from services with clear messages; catch in UI and show Mantine notifications or set local error state.

**Patterns:**
- Services: `throw new Error(...)` on validation failure (Zod) or business rule violation; callers catch and handle.
- Validation: `validateData(schema, data)` in `src/utils/validation.js` returns `{ success, data }` or throws; services call it before Supabase calls.
- UI: `notifications.show({ title, message, color })` for user-facing errors; `setError(...)` in context or component state where needed.
- Context guards: Hooks like `useAuth`, `useBranch` throw if used outside provider.

## Cross-Cutting Concerns

**Logging:** `console.error` / `console.warn` in catch blocks and critical paths; no structured logger.

**Validation:** Zod schemas in `src/utils/validation.js`; used by `profile.js`, `queue.js`, `contact.js` for request payloads and file uploads.

**Authentication:** Supabase Auth in `src/services/supabase/auth.js`; session in localStorage; `AuthProvider` syncs user and roles; RLS enforced by Supabase.

---

*Architecture analysis: 2026-02-24*
