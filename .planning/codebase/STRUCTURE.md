# Codebase Structure

**Analysis Date:** 2026-03-19

## Directory Layout

```
[project-root]/
├── api/                       # Vercel serverless functions (Node runtime)
├── public/                    # Static assets copied as-is (e.g., icons, bookmarklet output)
├── scripts/                   # Node scripts used during build (e.g., bookmarklet build)
├── src/                       # React SPA source
│   ├── assets/                # Bundled assets used by UI
│   ├── components/            # Shared components (layout + reusable UI pieces)
│   ├── config/                # App theming and runtime config objects
│   ├── constants/             # Shared constants (tables, queues, storage keys, config)
│   ├── contexts/              # Global React context providers
│   ├── data/                  # Static data / UI copy blobs
│   ├── features/              # Feature modules (queue, profile, songs, admin, etc.)
│   ├── hooks/                 # Cross-feature and feature orchestration hooks
│   ├── pages/                 # Route-level pages used by React Router
│   ├── services/              # External I/O boundary (Supabase modules, geolocation, song helpers)
│   └── utils/                 # Pure helpers, validation, calculations
├── .husky/                    # Git hooks (pre-commit runs lint-staged)
├── .planning/                 # GSD planning artifacts (not runtime)
├── index.html                 # Vite HTML entry
├── vite.config.js             # Vite build config
├── vercel.json                # Vercel headers + rewrites
├── eslint.config.js           # ESLint flat config
└── package.json               # Scripts + dependency manifest
```

## Directory Purposes

**`api/`:**
- Purpose: Serverless HTTP endpoints (Vercel Functions) used for bots/meta and proxying.
- Contains: `api/profile-meta.js`, `api/proxy.js`
- Key files:
  - `api/profile-meta.js`: Generates OpenGraph HTML by querying Supabase with `process.env.*`
  - `api/proxy.js`: Fetch proxy with permissive CORS

**`scripts/`:**
- Purpose: Build-time tooling run with Node (prebuild steps).
- Key files:
  - `scripts/build-bookmarklet.js` (invoked by `npm run build:bookmarklet` in `package.json`)

**`src/`:**
- Purpose: All client application code for the SPA.
- Key files:
  - `src/main.jsx`: React root entry (mounts `App`)
  - `src/App.jsx`: Provider stack + router + global layout (navbar/footer)

**`src/components/`:**
- Purpose: Shared UI building blocks and global layout/routing helpers.
- Contains:
  - Layout: `src/components/layout/*` (e.g. `GlobalNavbar`, `Footer`, `BranchSelector`)
  - Routing: `src/components/routing/RoutingComponents.jsx`
  - Cross-feature UI: `src/components/profile/*`, `src/components/modals/*`, `src/components/maimai/*`

**`src/features/`:**
- Purpose: Feature-first organization for complex domains.
- Modules (examples):
  - `src/features/queue/`: Queue feature (container: `src/features/queue/components/QueueManager.jsx`)
  - `src/features/profile/`: Public profile feature and related hooks/components
  - `src/features/songs/`: Song database UI (e.g. `src/features/songs/components/SongDatabase.jsx`)
  - `src/features/admin/`: Admin panel tabs, audit logs, rule management
  - `src/features/playlists/`, `src/features/feed/`, `src/features/discussion/`

**`src/pages/`:**
- Purpose: Route-level screens (one component per route).
- Examples:
  - `src/pages/ViewPage.jsx`: read-only monitor UI
  - `src/pages/PublicProfilePage.jsx`: `/p/:slug` UI
  - `src/pages/SongsPage.jsx`: `/songs` (thin wrapper around songs feature)
  - `src/pages/AdminPage.jsx`: `/admin`

**`src/contexts/`:**
- Purpose: Global state, subscriptions, and app-wide policies.
- Key files:
  - `src/contexts/AuthContext.jsx`: Supabase session + roles cache + realtime role syncing
  - `src/contexts/BranchContext.jsx`: Branch list + selection + realtime branch updates + location-based nearest branch
  - `src/contexts/ThemeContext.jsx`: Theme palette selection + dark mode
  - `src/contexts/SongDatabaseContext.jsx`: Song map/cache used across profile + song features
  - `src/contexts/FeatureFlagContext.jsx`: Remote/local flags gate UI/behavior

**`src/hooks/`:**
- Purpose: Orchestration and reusable side effects.
- Key files (examples):
  - Queue composition: `src/hooks/useQueueManager.js`, `src/hooks/useQueueData.js`, `src/hooks/useQueueActions.js`
  - Location gating: `src/hooks/useLocationVerification.js`, `src/hooks/useLocationGuard.js`
  - Branch/auth accessors: `src/hooks/useBranch.js`, `src/hooks/useAuth.js`
  - View mode: `src/hooks/useMonitorData.js`
  - Mall hours: `src/hooks/useMallSchedule.js`

**`src/services/`:**
- Purpose: External I/O boundary and domain-specific data access.
- Key files:
  - Supabase facade: `src/services/supabase.js` (re-export aggregator)
  - Supabase modules: `src/services/supabase/*.js` (e.g. `src/services/supabase/queue.js`)
  - Supabase client: `src/services/supabase/client.js` (reads `import.meta.env.*`)
  - Geolocation: `src/services/geolocation.js`

**`src/utils/`:**
- Purpose: Pure helpers (validation, calculations, transforms).
- Key file: `src/utils/validation.js` (Zod schemas + `validateData` helper, used by services)

## Key File Locations

**Entry Points:**
- `index.html`: Vite HTML entry
- `src/main.jsx`: React mount entry
- `src/App.jsx`: App composition + router

**Configuration:**
- `vite.config.js`: Vite build outputs and compression settings
- `vercel.json`: CSP headers and rewrites (including bot rewrite for `/p/:slug`)
- `eslint.config.js`: Lint rules

**Core Logic:**
- Queue orchestration: `src/hooks/useQueueManager.js`
- Queue persistence/realtime: `src/services/supabase/queue.js`
- Auth + roles: `src/contexts/AuthContext.jsx`, `src/services/supabase/auth.js`, `src/services/supabase/user.js`
- Branch selection: `src/contexts/BranchContext.jsx`, `src/services/supabase/admin-branches.js` / branch service modules

**Testing:**
- Not present (no test runner or `*.test.*` patterns detected; see `.planning/codebase/TESTING.md`)

## Naming Conventions

**Files:**
- Feature components: `src/features/<feature>/components/*.jsx`
- Route pages: `src/pages/*Page.jsx`
- Hooks: `src/hooks/use*.js`
- Supabase domain services: `src/services/supabase/*.js`

**Directories:**
- Domain grouping: `src/features/<domain>/...`
- Cross-cutting shared components: `src/components/<area>/...`

## Where to Add New Code

**New end-user feature (UI + state):**
- Primary code: `src/features/<new-feature>/`
- Route wrapper: add a page in `src/pages/<NewFeature>Page.jsx` (or a feature page under `src/features/<new-feature>/pages/`) and register the route in `src/App.jsx`.
- Shared components used across features: `src/components/`
- Cross-feature hook: `src/hooks/`

**New Supabase-backed domain operation:**
- Prefer a new domain module or add to an existing one in `src/services/supabase/<domain>.js`.
- If multiple UI surfaces consume it, expose a hook in `src/hooks/` that calls the service and owns state/error conversion.

**New global state or policy:**
- Add a context provider under `src/contexts/` and install it in `src/App.jsx` in the provider stack.

**New serverless behavior (Vercel):**
- Add a function under `api/<name>.js` and update `vercel.json` rewrites/headers if needed.

## Special Directories

**`dist/`:**
- Purpose: Build output from Vite.
- Generated: Yes
- Committed: Present in repo (directory exists); treat as generated artifacts.

**`node_modules/`:**
- Purpose: Installed dependencies.
- Generated: Yes
- Committed: Present locally; not a source directory.

**`.env`:**
- Purpose: Environment configuration for Vite/Node.
- Generated: No
- Committed: Present in repo root; contains environment configuration (do not read/quote contents).

---

*Structure analysis: 2026-03-19*

# STRUCTURE.md — Directory Layout & Organization

## Root Layout

```
smf-queue-check/
├── .agent/               # GSD planning & skills (AI-assistance tooling)
├── .env                  # Environment variables (prod active, dev commented)
├── .gitignore
├── .github/              # GitHub Actions / config
├── .gsd/                 # GSD state
├── .husky/               # Git hooks (pre-commit linting)
├── .planning/            # GSD planning documents
│   └── codebase/         # ← codebase map (this folder)
├── .vscode/              # Editor settings
├── api/                  # Vercel serverless functions
│   ├── profile-meta.js   # OG meta for social crawlers on /p/:slug
│   └── proxy.js          # CORS proxy endpoint
├── dist/                 # Build output (gitignored)
├── index.html            # SPA entry HTML
├── package.json
├── public/               # Static assets served as-is
│   └── bookmarklet.js    # Generated bookmarklet (via npm run build:bookmarklet)
├── scripts/              # Build helper scripts
│   └── build-bookmarklet.js
├── src/                  # Application source
├── vercel.json           # Vercel routing & security headers
└── vite.config.js        # Vite configuration
```

## Source Directory (`src/`)

```
src/
├── App.jsx               # Root component: provider stack + routing
├── App.css               # App-level styles
├── main.jsx              # Entry point (ReactDOM.createRoot)
├── index.css             # Global CSS (14KB — primary design system)
│
├── assets/               # Static images/fonts imported via JS
│
├── components/           # Reusable UI components (not feature-specific)
│   ├── BookmarkletInstructions.jsx
│   ├── LoginForm.jsx / LoginForm.css
│   ├── common/           # Generic shared UI (buttons, cards, etc.)
│   ├── feed/             # Feed-related shared components
│   ├── layout/           # App shell: GlobalNavbar, Footer, BranchSelector
│   ├── maimai/           # Maimai-specific display components
│   ├── modals/           # Modal dialogs (profile settings, etc.)
│   ├── profile/          # Profile display components
│   ├── routing/          # ProtectedRoute, ProfileRedirect
│   └── search/           # Search UI components
│
├── config/               # App configuration objects
│   └── theme.js          # Mantine theme config + named color palettes
│
├── constants/            # App-wide constants (no logic)
│   ├── config.js         # APP_CONFIG (rate limits, post length)
│   ├── database.js       # TABLES and BUCKETS enum objects
│   ├── featureFlags.js   # Default feature flag definitions
│   ├── limits.js         # Size/count limits
│   ├── placeholders.js   # Placeholder text constants
│   ├── queue.js          # Queue-related constants
│   └── storage.js        # localStorage key names
│
├── contexts/             # React Context providers
│   ├── AuthContext.jsx           # Auth + user roles
│   ├── AuthContextProvider.js    # Context object definition (split for HMR)
│   ├── BranchContext.jsx         # Arcade branch selection
│   ├── FeatureFlagContext.jsx    # Experimental feature toggles
│   ├── FeatureFlagContextDef.js  # Context definition
│   ├── SongDatabaseContext.jsx   # Song data provider
│   ├── SongDatabaseContextDef.js # Context definition
│   └── ThemeContext.jsx          # Theme / dark mode
│
├── data/                 # Static data files (song database JSON, etc.)
│
├── features/             # Feature-based modules (co-located pages + components + logic)
│   ├── admin/            # Admin panel + audit logs
│   ├── discussion/       # Song discussion feature
│   ├── feed/             # Social feed feature
│   ├── playlists/        # Shared playlists feature
│   ├── profile/          # Profile management feature
│   ├── queue/            # Queue check (core feature) — components + hooks
│   └── songs/            # Songs listing feature
│
├── hooks/                # Custom React hooks (19 hooks)
│   ├── useAuth.js
│   ├── useBranch.js
│   ├── useCabinetManager.js
│   ├── useFeatureFlags.js
│   ├── useLocationGuard.js
│   ├── useLocationVerification.js
│   ├── useMallSchedule.js
│   ├── useMonitorData.js
│   ├── useMouseDragScroll.js
│   ├── useNotifications.js
│   ├── usePageVisibility.js
│   ├── usePermissions.js
│   ├── usePlayerSuggestions.js
│   ├── useQueueActions.js
│   ├── useQueueData.js
│   ├── useQueueManager.js
│   ├── useSearch.js
│   ├── useSongDatabase.js
│   └── useSongDatabaseContext.js
│
├── pages/                # Route-level page components (12 pages)
│   ├── AdminPage.jsx / .css
│   ├── ContactPage.jsx
│   ├── ExportBest50Page.jsx    # Best 50 export as image
│   ├── FeedPage.jsx / .css
│   ├── PublicProfilePage.jsx
│   ├── SearchPage.jsx
│   ├── SongDiscussionPage.jsx
│   ├── SongsPage.jsx
│   └── ViewPage.jsx / .css
│
├── services/             # External service integrations
│   ├── README.md         # Architecture notes (PERF-01, PERF-02, service split)
│   ├── geolocation.js    # Browser Geolocation API wrapper
│   ├── songs.js          # Song database loader
│   ├── supabase.js       # Facade re-export (backward compat)
│   └── supabase/         # Domain service modules (25 files)
│       ├── client.js
│       ├── auth.js         activity.js  admin.js  admin-branches.js
│       ├── admin-requests.js  admin-rules.js  admin-users.js
│       ├── audit.js  contact.js  discussion.js
│       ├── favorites.js  feed.js  follow.js
│       ├── import.js  most-played.js  notifications.js
│       ├── playlist-comments.js  playlist-core.js  playlist-feed.js
│       ├── playlist.js  posts.js  profile.js
│       ├── queue.js  user.js
│       └── (25 modules total)
│
└── utils/                # Pure utility functions (no side effects)
    ├── constants.js      # Misc utility constants
    ├── formatters.js     # Display formatting (dates, numbers)
    ├── maimai-calc.js    # Maimai rating calculations
    ├── song-helpers.js   # Song data helpers
    └── validation.js     # Zod schemas + validation helpers
```

## Key File Locations

| What | Where |
|------|-------|
| App entry | `src/main.jsx` |
| Route definitions | `src/App.jsx` |
| Supabase client singleton | `src/services/supabase/client.js` |
| DB table name constants | `src/constants/database.js` |
| Global app config | `src/constants/config.js` |
| Routing guards | `src/components/routing/RoutingComponents.jsx` |
| Theme config | `src/config/theme.js` |
| Service architecture docs | `src/services/README.md` |
| Vercel edge functions | `api/profile-meta.js`, `api/proxy.js` |

## Naming Conventions

- **Components:** PascalCase (`QueueManager.jsx`, `LoginForm.jsx`)
- **Hooks:** camelCase with `use` prefix (`useQueueData.js`)
- **Services:** kebab-case (`admin-branches.js`, `playlist-core.js`)
- **Constants files:** camelCase (`database.js`, `featureFlags.js`)
- **Contexts split pattern:** `FooContext.jsx` (provider) + `FooContextDef.js` (context object) — separates the heavy provider from the lightweight context definition to avoid HMR issues
- **Barrel exports:** `src/services/supabase.js` acts as barrel for the supabase domain modules
