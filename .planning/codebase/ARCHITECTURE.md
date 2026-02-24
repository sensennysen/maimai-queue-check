# ARCHITECTURE.md — System Design & Patterns

## Application Type

Single-Page Application (SPA) built with React 19 + Vite. Deployed on Vercel. Backend is entirely Supabase (PostgreSQL + Auth + Realtime + Storage). No custom server-side logic except a minimal `api/` directory with Vercel serverless functions.

## High-Level Architecture

```
Browser
  └── React SPA (src/)
        ├── Context Providers (Auth, Branch, Theme, SongDatabase, FeatureFlags)
        ├── React Router (BrowserRouter)
        │     ├── / (MainApp — QueueManager)
        │     ├── /p/:slug (PublicProfilePage)
        │     ├── /view (ViewPage)
        │     ├── /admin (AdminPage)
        │     ├── /contact (ContactPage)
        │     ├── /songs (SongsPage)
        │     └── /profile/export (ExportBest50Page)
        ├── Service Layer (src/services/)
        │     ├── supabase.js (facade — re-exports all sub-modules)
        │     └── supabase/
        │           ├── client.js     (singleton Supabase client)
        │           ├── auth.js       (authService, rolesService, subscribeToUserRoleChanges)
        │           ├── queue.js      (queueService, subscribeToQueueChanges, subscribeToSessionChanges)
        │           ├── profile.js    (userService, favoritesService, playlistService, mostPlayedService)
        │           ├── admin.js      (branchService, scheduleService, adminService, requestService, rulesService)
        │           └── contact.js   (contactService, notificationService)
        └── Supabase (external)
              ├── PostgreSQL DB (tables)
              ├── Auth (OAuth providers)
              ├── Realtime (WebSocket CDC)
              └── Storage (profile-pictures, contact_uploads)
```

## Provider / Context Layer

Contexts are nested in `App.jsx` in this order (outermost first):

```
BrowserRouter
  ThemeProvider        → theme selection (persisted to localStorage)
    BranchProvider     → selected arcade branch (persisted to sessionStorage or localStorage)
      AuthProvider     → Supabase auth session + user roles + realtime subscriptions
        SongDatabaseProvider  → static maimai song database
          FeatureFlagProvider → dynamic feature flags (from Supabase or local)
            AppProviders      → MantineProvider + Routes
```

Each context exports a `use<Name>` hook (e.g., `useAuth`, `useBranch`, `useTheme`, `useSongDatabaseContext`).

## Service Layer Pattern

All Supabase calls are encapsulated in service objects **never called directly from components**. Services are plain JS objects with async methods:

```js
// Usage pattern in hooks/components
import { queueService } from '../services/supabase';
const data = await queueService.getQueueEntries(branchId, cabinetNum);
```

The facade file `src/services/supabase.js` re-exports everything for backward compatibility. **New code should import directly from sub-modules** (e.g., `src/services/supabase/queue.js`).

## Data Flow: Queue (Core Feature)

```
selectedBranch (BranchContext)
  → useQueueData hook
      ├── Initial fetch: queueService.getQueueEntries(branchId, cabinetNum)
      └── Realtime: subscribeToQueueChanges(handleQueueChange, branchId)
            └── On change: re-fetch via queueService.getQueueEntries()
                  → setQueue(data) → re-render QueueManager
```

## Auth & Permissions Flow

```
Supabase Auth (OAuth) → onAuthStateChange callback
  → setUser(currentUser)
  → Load cached roles from localStorage (`user_roles_<uid>`)
  → setLoading(false) immediately (non-blocking)
  → Effect: refreshUserRoles()
       → rolesService.getUserRoles(uid, branchId)
           → Promise.all([user_roles query, user_profiles query])
           → Merge into unified role object
           → cacheRoles(uid, roles)
  → Realtime: supabase channel `user-roles-<uid>` + `user-profiles-<uid>`
       → On change: refreshUserRoles()
```

**Role cache key:** `user_roles_<uid>` (renamed from `smf_user_roles_<uid>` — SEC-04). Cleared on sign-out (SEC-01).

## Feature Modules (`src/features/`)

Features are organized by domain and contain their own components:

| Feature | Directory |
|---------|-----------|
| Queue management | `src/features/queue/` (12 files) |
| Admin panel | `src/features/admin/` (8 files) |
| Songs browser | `src/features/songs/` (6 files) |

## Lazy Loading (Code Splitting)

Pages are lazy-loaded for faster initial paint:

```js
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ExportBest50Page = lazy(() => import('./pages/ExportBest50Page'));
const ViewPage = lazy(() => import('./pages/ViewPage'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
```

Fallback: full-page `Loader` (Mantine bars type).

## Validation Layer

Zod schemas in `src/utils/validation.js` are called inside service methods before DB writes:

```
Component calls service method
  → service calls validateData(schema, data)
      → if invalid: throws Error(message)
      → if valid: proceeds with Supabase query
```

Schemas: `userProfileSchema`, `queueEntrySchema`, `contactReportSchema`.

## Profile Routing

`/profile` → `ProfileRedirect` component:
- If logged in + has slug → `/p/<slug>`
- If logged in + no slug → `/`
- If not logged in → `/`

Public profiles accessible at `/p/:slug` without login.

## Entry Points

| File | Role |
|------|------|
| `index.html` | HTML shell, mounts `<div id="root">` |
| `src/main.jsx` | `ReactDOM.createRoot().render(<App />)` |
| `src/App.jsx` | Provider tree + Router + page routes |
