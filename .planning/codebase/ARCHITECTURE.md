# Architecture

**Analysis Date:** 2026-03-19

## Pattern Overview

**Overall:** Vite + React single-page app (SPA) with client-side routing, Mantine UI, and Supabase as the primary backend (auth + Postgres + realtime). Deployed on Vercel with a small `api/` serverless layer for special cases.

**Key Characteristics:**
- **Feature-first UI organization**: end-user features live under `src/features/` and are composed by route-level pages in `src/pages/`.
- **Context-driven global state**: cross-cutting concerns (auth, branch selection, theme, song database, feature flags) are implemented as React context providers in `src/contexts/` and installed at the app root in `src/App.jsx`.
- **Thin “hook orchestration” layer**: page/feature containers call hooks in `src/hooks/` which coordinate validation, permissions, and service calls; domain services live under `src/services/`.

## Layers

**Application entry & composition:**
- Purpose: Bootstraps React, installs providers, sets up routes, and composes feature containers.
- Location: `src/main.jsx`, `src/App.jsx`
- Contains: React root render, provider stack, `react-router-dom` `Routes` + lazy-loaded pages.
- Depends on: Context providers (`src/contexts/*`), routing helpers (`src/components/routing/*`), pages and feature containers.
- Used by: Browser entrypoint (Vite `index.html` → `src/main.jsx`).

**Routing & pages (route-level screens):**
- Purpose: Route boundaries; each page composes one feature or screen.
- Location: `src/pages/*.jsx`, plus some route pages under `src/features/*/pages/` (e.g. `src/features/admin/pages/AuditLogsPage.jsx`)
- Contains: Minimal composition logic (e.g., `src/pages/SongsPage.jsx` renders the `SongDatabase` feature).
- Depends on: Feature components (`src/features/*`), contexts/hooks, shared layout components.
- Used by: Routes in `src/App.jsx`.

**Feature modules (domain UI):**
- Purpose: Encapsulated UI for major features (queue, profile, songs, playlists, admin, feed, discussion).
- Location: `src/features/`
- Contains: Feature components and feature-specific hooks/pages.
- Depends on: Shared components (`src/components/`), hooks (`src/hooks/`), services (`src/services/`), constants (`src/constants/`), contexts (`src/contexts/`).
- Used by: Pages (`src/pages/*`) and sometimes directly by `src/App.jsx` (e.g., `QueueManager` for the home route).

**Hooks (state + orchestration):**
- Purpose: Encapsulate state transitions, cross-module coordination, and side effects.
- Location: `src/hooks/`
- Contains: Data hooks (fetch/subscriptions), action hooks (mutations), guard hooks (location/permissions), utility hooks (visibility, drag-scroll).
- Depends on: Services (`src/services/*`), contexts (`src/contexts/*`), constants (`src/constants/*`).
- Used by: Feature components and pages.

**Context providers (global state & subscriptions):**
- Purpose: Shared state and app-wide side effects/subscriptions.
- Location: `src/contexts/`
- Key providers installed in `src/App.jsx`:
  - `src/contexts/ThemeContext.jsx`
  - `src/contexts/BranchContext.jsx`
  - `src/contexts/AuthContext.jsx`
  - `src/contexts/SongDatabaseContext.jsx`
  - `src/contexts/FeatureFlagContext.jsx`
- Depends on: Supabase facade (`src/services/supabase.js`) and specific services, browser storage, and some utilities.
- Used by: Hooks and components through corresponding `use*` hooks (e.g. `src/hooks/useAuth.js`, `src/hooks/useBranch.js`).

**Service layer (external I/O boundary):**
- Purpose: Centralize Supabase queries/mutations and other external integrations (geolocation).
- Location:
  - Supabase: `src/services/supabase/*.js` (domain modules), plus facade `src/services/supabase.js`
  - Geolocation: `src/services/geolocation.js`
  - Song data helpers: `src/services/songs.js`
- Pattern:
  - Prefer importing domain modules directly from `src/services/supabase/*` in new code; `src/services/supabase.js` re-exports exist for backward compatibility.
  - Supabase client initialization: `src/services/supabase/client.js`

## Data Flow

**Primary flow: Queue (home route)**

1. Route `/` renders `MainApp` → `QueueManager` (in `src/App.jsx`).
2. `QueueManager` reads global state (branch, auth/roles, permissions) via hooks:
   - Branch: `src/hooks/useBranch.js` (backed by `src/contexts/BranchContext.jsx`)
   - Auth: `src/hooks/useAuth.js` (backed by `src/contexts/AuthContext.jsx`)
   - Permissions: `src/hooks/usePermissions.js`
3. `QueueManager` delegates queue logic to `src/hooks/useQueueManager.js`, which composes:
   - Data/subscriptions: `src/hooks/useQueueData.js` → `queueService.getQueueEntries` + `subscribeToQueueChanges` from `src/services/supabase/queue.js`
   - Mutations: `src/hooks/useQueueActions.js` → `queueService.*` mutations in `src/services/supabase/queue.js`
   - Location gating/consent: `src/hooks/useLocationVerification.js` + `src/hooks/useLocationGuard.js` (uses `src/services/geolocation.js`)
   - Cabinet selection: `src/hooks/useCabinetManager.js` (drives cabinet filtering in `useQueueData`)
4. Service boundary:
   - All queue persistence and realtime events come from `src/services/supabase/queue.js` via the `supabase` client in `src/services/supabase/client.js`.
5. UI updates:
   - Hook state is rendered by `src/features/queue/components/*` (e.g. `QueueList`, `QueueItem`, `NowPlayingCard`).

**Primary flow: Public “View Mode” monitor**

1. Route `/view` loads `src/pages/ViewPage.jsx`.
2. `ViewPage` reads monitor data via `src/hooks/useMonitorData.js` (groups queue entries per cabinet) and uses shared UI components from queue feature (`QueueItem`, `NowPlayingCard`).
3. Branch and schedule context:
   - Branch info via `src/hooks/useBranch.js`
   - Operating hours via `src/hooks/useMallSchedule.js`

**Primary flow: Auth + Roles**

1. Root provider `AuthProvider` in `src/contexts/AuthContext.jsx` installs auth state.
2. Supabase auth events come from `authService.onAuthStateChange` (re-exported via `src/services/supabase.js`, implemented under `src/services/supabase/auth.js`).
3. Role resolution is branch-aware (uses `selectedBranch?.id`) and is fetched via `rolesService.getUserRoles(...)`.
4. Roles are cached in `localStorage` and kept fresh via realtime subscriptions to:
   - `TABLES.USER_ROLES`
   - `TABLES.USER_PROFILES`
   (configured in `src/contexts/AuthContext.jsx`).

**State Management:**
- Global cross-cutting state is in contexts (`src/contexts/*`) and is consumed via hooks (`src/hooks/useAuth.js`, `src/hooks/useBranch.js`, etc.).
- Feature state is primarily hook-local (e.g. queue state in `src/hooks/useQueueData.js`).
- Persistence/caching uses browser `localStorage` (e.g. `src/contexts/BranchContext.jsx` saves selected branch; `src/contexts/AuthContext.jsx` caches user roles).

## Key Abstractions

**Supabase service modules (`*Service` objects):**
- Purpose: Define domain operations (queries/mutations/subscriptions) against Supabase.
- Examples:
  - Queue: `src/services/supabase/queue.js` (`queueService`, `subscribeToQueueChanges`)
  - Auth client: `src/services/supabase/client.js` (`supabase`)
  - Facade: `src/services/supabase.js` (re-exports for backward compatibility)
- Pattern: Services throw on errors; callers (hooks/components) catch and convert to UI state/notifications.

**“Composed” feature hooks:**
- Purpose: Present a stable, UI-friendly API by composing smaller hooks.
- Example: `src/hooks/useQueueManager.js` wraps data, actions, location, and cabinet logic to provide one feature API.

## Entry Points

**SPA entry:**
- Location: `src/main.jsx`
- Triggers: Browser loads `index.html` (Vite) → mounts React root
- Responsibilities: Render `<App />` and install Vercel Speed Insights.

**App routing + providers:**
- Location: `src/App.jsx`
- Triggers: Mounted by `src/main.jsx`
- Responsibilities: Install providers, Mantine theme, notifications, navbar/footer, and define client routes.

**Vercel serverless functions:**
- Location: `api/proxy.js`, `api/profile-meta.js`
- Triggers: Requests to `/api/*`, and bot rewrites for `/p/:slug` per `vercel.json`
- Responsibilities:
  - `api/proxy.js`: simple fetch proxy to return remote content with permissive CORS.
  - `api/profile-meta.js`: dynamic OpenGraph HTML for social crawlers (fetches profile row from Supabase using env vars).

## Error Handling

**Strategy:** “Throw in services, surface in hooks/UI.”

**Patterns:**
- Services throw Supabase `error` objects or `Error` instances (e.g. `src/services/supabase/queue.js`).
- Hooks catch and store `error` strings in state (e.g. `src/hooks/useQueueData.js`, `src/hooks/useQueueActions.js`).
- UI surfaces errors via Mantine `Alert` and `@mantine/notifications` (e.g. `src/features/queue/components/QueueManager.jsx`).

## Cross-Cutting Concerns

**Logging:** Mostly `console.*` for diagnostics; user-facing errors use Mantine notifications (`@mantine/notifications`) in UI and contexts.

**Validation:** Zod-based schemas and `validateData` helpers in `src/utils/validation.js` are used before writes (e.g. queue entry validation in `src/services/supabase/queue.js`).

**Authentication:** Supabase Auth session is persisted in local storage with a custom storage key (`src/services/supabase/client.js`) and consumed via `AuthProvider` (`src/contexts/AuthContext.jsx`).

---

*Architecture analysis: 2026-03-19*

# ARCHITECTURE.md — System Architecture

## Pattern

**React SPA with a service-layer pattern** backed entirely by Supabase (PostgreSQL + Realtime + Auth + Storage).

```
Browser SPA (React 19)
  ↓ (Supabase JS client)
Supabase Cloud
  ├── PostgreSQL (RLS enforced)
  ├── Realtime CDC (websockets)
  ├── Auth (OAuth)
  └── Storage (S3-compatible)
```

Vercel hosts the SPA and provides two serverless Edge functions (`/api/profile-meta`, `/api/proxy`). There is no custom backend server — all data access is client → Supabase.

---

## Application Layers

### 1. Entry Point
- `index.html` → `src/main.jsx` (mounts `<App />`)
- `src/App.jsx` — React Router + context provider stack + lazy page loading

### 2. Provider Stack (App.jsx)
Providers wrap the entire app in this order (outermost → innermost):

```
BrowserRouter
  ThemeProvider         (dark/light mode, theme selection)
    BranchProvider      (arcade branch selection + realtime updates)
      AuthProvider      (Supabase auth, user roles, role realtime)
        SongDatabaseProvider  (song data, offline-capable)
          FeatureFlagProvider  (per-user experimental flags)
            AppProviders (MantineProvider + route tree)
```

### 3. Routing
All routes defined in `src/App.jsx` using React Router v7:

| Route | Page | Auth Required |
|-------|------|---------------|
| `/` | `QueueManager` (inline `MainApp`) | No |
| `/view` | `ViewPage` | No |
| `/songs` | `SongsPage` | No |
| `/songs/:id` | `SongDiscussionPage` | No |
| `/profile/export` | `ExportBest50Page` | No |
| `/profile` | `ProfileRedirect` | No (redirects) |
| `/p/:slug` | `PublicProfilePage` | No |
| `/contact` | `ContactPage` | No |
| `/admin` | `AdminPage` | No (admin check inside) |
| `/audit-logs` | `AuditLogsPage` | No (admin check inside) |
| `/search` | `SearchPage` | Yes (`ProtectedRoute`) |
| `/shared-playlists` | `SharedPlaylistsPage` | Yes (`ProtectedRoute`) |
| `/feed` | `FeedPage` | Yes (`ProtectedRoute`) |

All pages are **lazy-loaded** with `React.lazy()` + `<Suspense>`.

### 4. Service Layer
Located at `src/services/`. Two sub-layers:

**Facade:** `src/services/supabase.js` — thin re-export for backward compatibility

**Domain modules:** `src/services/supabase/`

| Module | Key Exports |
|--------|-------------|
| `client.js` | `supabase` (singleton client) |
| `auth.js` | `authService`, `rolesService`, `subscribeToUserRoleChanges` |
| `queue.js` | `queueService`, `subscribeToQueueChanges`, `subscribeToSessionChanges` |
| `admin.js` | `adminService`, `requestService`, `notificationService` |
| `profile.js` | `userService`, `favoritesService`, `playlistService` |
| `contact.js` | `contactService` |
| `import.js` | `createImportSession`, `getImportSession`, `deleteImportSession` |
| `activity.js` | Activity/notification actions |
| `posts.js` | Feed post CRUD |
| `discussion.js` | Song discussion/comments |
| `audit.js` | Audit log queries |
| `user.js` | Full user profile operations |
| ...+others | (25 modules total) |

**Other services:**
- `src/services/geolocation.js` — Browser Geolocation API wrapper + Haversine distance
- `src/services/songs.js` — Song database loading/parsing

### 5. Context / State Management
React Context is the primary state container (no Redux/Zustand):

| Context | State Managed |
|---------|--------------|
| `ThemeContext` | Dark mode, active theme name, Mantine color palette |
| `BranchContext` | Arcade branches list, selected branch, geolocation, realtime |
| `AuthContext` | Current user, roles, sign-in/out, realtime role sync |
| `SongDatabaseContext` | Full song DB (loaded from external JSON), loading state |
| `FeatureFlagContext` | Per-user experimental flag toggles |

### 6. Custom Hooks
`src/hooks/` contains 19 hooks encapsulating business logic:

Key hooks:
- `useQueueActions.js` — queue join/leave/manage operations
- `useQueueData.js` — queue list state + realtime
- `useQueueManager.js` — orchestrates queue UI state
- `useLocationVerification.js` — geofence enforcement for queue access
- `useLocationGuard.js` — wrapper guard component logic
- `useSongDatabase.js` — song loading, search, filtering
- `useNotifications.js` — notification fetching + realtime
- `useSearch.js` — cross-entity search
- `usePermissions.js` — role-based permission checks

### 7. Features (Domain Modules)
`src/features/` contains co-located feature modules for complex domains:

| Feature | Contents |
|---------|---------|
| `queue/` | `QueueManager` (main component), queue hooks |
| `feed/` | Feed post listing, commenting, voting |
| `playlists/` | Shared playlist pages + drag-and-drop |
| `profile/` | Profile settings, Best50, MostPlayed sections |
| `discussion/` | Song discussion threads |
| `songs/` | Songs listing and search |
| `admin/` | Admin panel, access request management, audit logs |

### 8. Data Flow (Queue Check, primary feature)

```
User opens app
  → BranchProvider loads arcade branches from Supabase
  → QueueManager mounts, reads selectedBranch from BranchContext
  → useQueueData subscribes to queue_entries realtime channel
  → Queue state rendered via QueueManager components
  → User joins queue → useQueueActions.joinQueue() → supabase.from('queue_entries').insert()
  → Realtime event received → queue list updated for all clients
```

### 9. Vercel Serverless (API Routes)

| File | Trigger | Purpose |
|------|---------|---------|
| `api/profile-meta.js` | `/p/:slug` + social bot UA | Server-side OG meta generation |
| `api/proxy.js` | `/api/proxy` | CORS proxy for external requests |

---

## Key Abstractions

- **`ProtectedRoute`** (`src/components/routing/RoutingComponents.jsx`) — redirects unauthenticated users
- **`ProfileRedirect`** — redirects `/profile` to the current user's public profile slug
- **`APP_CONFIG`** (`src/constants/config.js`) — global app constants (rate limits, post length, etc.)
- **`TABLES` / `BUCKETS`** (`src/constants/database.js`) — centralized DB/storage table name constants (prevents magic strings)
