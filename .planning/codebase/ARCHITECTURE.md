# Architecture

**Analysis Date:** 2025-02-23

## Pattern Overview

**Overall:** React SPA with context-based global state, feature-based UI modules, and a single Supabase backend. Lazy-loaded route-level pages and composed hooks for queue and location logic.

**Key Characteristics:**
- Single-page app: one HTML entry, React root, client-side routing (react-router-dom).
- Global state via React Context (theme, auth, branch, song database, feature flags); no Redux or external store.
- Feature folders under `src/features/` (queue, admin, songs) own components and feature-specific hooks; shared UI lives in `src/components/`.
- Backend is Supabase only: one client in `src/services/supabase.js` with multiple exported service objects and real-time subscriptions.
- Serverless API under `api/` (Vercel) used for profile meta/OG tags only.

## Layers

**Entry / Shell:**
- Purpose: Mount React, provide router and providers, define routes.
- Location: `index.html`, `src/main.jsx`, `src/App.jsx`
- Contains: HTML shell, createRoot, StrictMode, SpeedInsights; BrowserRouter, ThemeProvider, BranchProvider, AuthProvider, SongDatabaseProvider, FeatureFlagProvider; MantineProvider; Routes with lazy-loaded page components.
- Depends on: React, react-dom, react-router-dom, Mantine, contexts, hooks, config.
- Used by: All app code (top of tree).

**Pages:**
- Purpose: Route-level screens; compose features and layout.
- Location: `src/pages/`
- Contains: AdminPage, ViewPage, SongsPage, ContactPage, ExportBest50Page, PublicProfilePage; MainApp (queue check) is in App.jsx as default route.
- Depends on: features, components, hooks, services, contexts.
- Used by: React Router via `App.jsx` Routes.

**Features:**
- Purpose: Encapsulate domain areas (queue, admin, songs) with their components and hooks.
- Location: `src/features/queue/`, `src/features/admin/`, `src/features/songs/`
- Contains: Queue (QueueManager, QueueForm, QueueList, NowPlayingCard, PlayTimer, QueueItem, QueueRulesModal; hooks useQueueManager, useQueueData, useQueueActions, useLocationVerification, useCabinetManager). Admin (UserTable, UserManager, ReportsManager, QueueRuleManager, AccessRequests, BranchList, QueueRuleEditor; admin hooks). Songs (SongDatabase, SongList, SongCard, SongFilters, SongDetailModal, SongSelectionModal).
- Depends on: contexts, hooks (shared), services, config, components (shared).
- Used by: Pages and App.jsx (QueueManager in MainApp).

**Components (shared):**
- Purpose: Reusable UI and layout used across features and pages.
- Location: `src/components/` (layout, modals, profile, maimai, common), plus `LoginForm.jsx`, `BookmarkletInstructions.jsx`
- Contains: BranchSelector, ThemeToggle, Footer, NotificationCenter; modals (PreferencesModal, ScheduleEditor, BranchEditModal, etc.); profile (FavoriteSongsSection, PlaylistSection, MaimaiImportModal, etc.); maimai (ScoreCard).
- Depends on: hooks, services, config, contexts.
- Used by: App.jsx, pages, feature components.

**Contexts:**
- Purpose: Provide app-wide state and configuration (theme, auth, branch, song DB, feature flags).
- Location: `src/contexts/`
- Contains: ThemeContext, AuthContext (plus AuthContextProvider), BranchContext, SongDatabaseContext (plus SongDatabaseContextDef), FeatureFlagContext (plus FeatureFlagContextDef).
- Depends on: services (supabase), hooks (useBranch in AuthContext).
- Used by: App.jsx (providers), hooks (useAuth, useBranch, useTheme, useSongDatabaseContext, useFeatureFlags), and components/pages that consume that state.

**Hooks:**
- Purpose: Reusable state and side-effect logic; compose for complex flows (e.g. queue).
- Location: `src/hooks/`
- Contains: useAuth, useBranch, useQueueManager, useQueueData, useQueueActions, useLocationVerification, useCabinetManager, useMonitorData, useMallSchedule, usePageVisibility, usePermissions, useSongDatabase, useSongDatabaseContext, useMouseDragScroll, useFeatureFlags, useLocationGuard, usePlayerSuggestions.
- Depends on: services, contexts, constants, types.
- Used by: Components, pages, and other hooks (e.g. useQueueManager uses useQueueData, useQueueActions, useLocationVerification, useCabinetManager).

**Services:**
- Purpose: Backend and external API access; single place for Supabase client and domain services.
- Location: `src/services/supabase.js`, `src/services/songs.js`, `src/services/geolocation.js`
- Contains: supabase client; authService, rolesService, userService, queueService, branchService, scheduleService, adminService, requestService, notificationService, contactService, rulesService, mostPlayedService, favoritesService, playlistService; subscribeToQueueChanges, subscribeToSessionChanges, subscribeToUserRoleChanges; songsService (getSongs, getSheets, getFullSongDatabase); geolocation helpers (requestUserLocation, getDistance, checkGeolocationPermission).
- Depends on: @supabase/supabase-js, `src/utils/validation.js` (Zod schemas).
- Used by: Contexts, hooks, and occasionally components directly.

**Config & constants:**
- Purpose: Theme, maimai game constants, feature flags, queue status enums.
- Location: `src/config/theme.js`, `src/config/maimai-constants.js`, `src/constants/featureFlags.js`, `src/constants/queue.js`, `src/data/changelog.js`, `src/data/subtitleMessages.js`
- Depends on: None (or env for BASE_JACKET_URL).
- Used by: App.jsx, components, features, utils.

**Utils & types:**
- Purpose: Validation (Zod), maimai calculations, shared helpers and JSDoc types.
- Location: `src/utils/validation.js`, `src/utils/maimai-calc.js`, `src/utils/constants.js`; `src/types/queue.js`
- Contains: userProfileSchema, queueEntrySchema, contactReportSchema, validateData; getGrade, calculateBest50, fetchSongConstants; QueueEntry/Branch/UserRoles/LocationState typedefs.
- Depends on: zod, config/maimai-constants, assets (otoge-db.json).
- Used by: services (supabase, validation before insert/update), components (maimai-calc).

## Data Flow

**App bootstrap:**
1. `index.html` loads; script type="module" points to `/src/main.jsx`.
2. `main.jsx` creates root, renders `<StrictMode><App /><SpeedInsights /></StrictMode>`.
3. `App.jsx` wraps tree in BrowserRouter → ThemeProvider → BranchProvider → AuthProvider → SongDatabaseProvider → FeatureFlagProvider → AppProviders (Mantine + Routes). BranchProvider loads branches and selected branch; AuthProvider subscribes to Supabase auth and loads user roles.
4. Route match renders a page (or MainApp for default). MainApp shows BranchSelector, ThemeToggle, LoginForm, QueueManager, Footer; QueueManager uses useQueueManager (data + actions + location + cabinet).

**Queue flow:**
1. User selects branch (BranchContext); QueueManager uses useBranch().selectedBranch.
2. useQueueManager composes useCabinetManager (cabinet selection), useQueueData (fetch + real-time subscription via queueService, subscribeToQueueChanges), useLocationVerification (consent + verify), useQueueActions (add/update/remove/move/clear/endGame/startNextGame).
3. useQueueData calls queueService.getQueueEntries(branchId, cabinet), subscribes to queue_entries changes, filters by branch and cabinet, refetches and setState on event.
4. Mutations go through useQueueActions → queueService (with location checks and Zod validation where used); UI updates via existing state or refetch/subscription.

**State management:**
- Global: React Context only (theme, auth, branch, song database, feature flags). No Redux/Zustand.
- Server state: Fetched in hooks and services; Supabase real-time used for queue, session, and user role changes.
- Local UI state: useState/useReducer in components and hooks.

## Key Abstractions

**Supabase services:**
- Purpose: Single client, many domain objects (auth, roles, user, queue, branch, schedule, admin, requests, notifications, contact, rules, mostPlayed, favorites, playlists); subscriptions as standalone functions.
- Examples: `src/services/supabase.js` (authService, queueService, branchService, subscribeToQueueChanges, etc.)
- Pattern: Object of async methods and/or functions that call supabase.from(...).select/insert/update/delete; validation via validateData(schema, payload) from `src/utils/validation.js` before writes where applicable.

**Context + provider pattern:**
- Purpose: Inject app-wide state and avoid prop drilling.
- Examples: `src/contexts/AuthContext.jsx` (AuthProvider, useAuth from AuthContextProvider), `src/contexts/BranchContext.jsx`, `src/contexts/ThemeContext.jsx`, `src/contexts/SongDatabaseContext.jsx`, `src/contexts/FeatureFlagContext.jsx`
- Pattern: createContext(null or default), Provider component that holds state and passes value, optional separate Def file for context creation (SongDatabaseContextDef, FeatureFlagContextDef).

**Composed hooks (queue):**
- Purpose: Split queue logic into data, actions, location, and cabinet; single facade hook for UI.
- Examples: `src/hooks/useQueueManager.js` composes useCabinetManager, useQueueData, useLocationVerification, useQueueActions.
- Pattern: useQueueManager returns one object merging state and handlers from sub-hooks; useQueueData owns queue/nowPlaying/loading/error and real-time subscription; useQueueActions owns mutations and calls queueService.

**Lazy routes:**
- Purpose: Code-split by page to reduce initial bundle.
- Examples: `src/App.jsx` — AdminPage, ExportBest50Page, ViewPage, SongsPage, ContactPage, PublicProfilePage via lazy(() => import('./pages/...')).
- Pattern: lazy + Suspense with shared Loader fallback; MainApp (queue) is not lazy.

## Entry Points

**Browser:**
- Location: `index.html` → `src/main.jsx`
- Triggers: User loads the app URL.
- Responsibilities: Mount React root, render App (router + providers + routes), include Vercel SpeedInsights.

**App root:**
- Location: `src/App.jsx`
- Triggers: Rendered by main.jsx.
- Responsibilities: Compose providers (theme, branch, auth, song DB, feature flags), Mantine theme from ThemeContext, define Routes and lazy pages, render MainApp for default route (queue check UI).

**Serverless API:**
- Location: `api/profile-meta.js`
- Triggers: Vercel serverless request (e.g. GET with slug query for profile meta/OG).
- Responsibilities: Fetch profile by slug from Supabase, return HTML with meta tags for social preview; no SPA bundle.

## Error Handling

**Strategy:** Local try/catch in async code; user feedback via Mantine notifications; no global React error boundary observed.

**Patterns:**
- Services: throw after Supabase error or validation failure; callers catch and set error state or show notification.
- Hooks: try/catch in load/subscribe/mutation logic; set error state (e.g. setError) or call notifications.show({ color: 'red', title: '...', message: err.message }).
- Contexts: AuthContext and BranchContext set fallback state (e.g. default roles, first branch) on timeout or error; cache roles in localStorage where used.

## Cross-Cutting Concerns

**Logging:** console.error in services and hooks on failure; production build drops console (vite.config.js terserOptions).

**Validation:** Zod schemas in `src/utils/validation.js` (userProfileSchema, queueEntrySchema, contactReportSchema); validateData used in `src/services/supabase.js` before selected inserts/updates.

**Authentication:** Supabase Auth (OAuth); AuthProvider in `src/contexts/AuthContext.jsx` subscribes to onAuthStateChange, fetches roles via rolesService.getUserRoles; useAuth exposes user, userRoles, loading, signIn, signOut, refreshUserRoles.

---

*Architecture analysis: 2025-02-23*
