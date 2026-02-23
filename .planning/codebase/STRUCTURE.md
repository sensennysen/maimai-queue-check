# Codebase Structure

**Analysis Date:** 2025-02-23

## Directory Layout

```
[project-root]/
├── .agent/                 # Agent/workflow config
├── .husky/                 # Git hooks (e.g. pre-commit)
├── .planning/              # Planning artifacts
│   └── codebase/           # Codebase analysis (ARCHITECTURE.md, STRUCTURE.md, etc.)
├── .vscode/                # Editor config
├── api/                    # Serverless API (Vercel)
│   └── profile-meta.js     # Profile OG/meta handler
├── dist/                   # Build output (generated)
├── docs/                   # Documentation
├── public/                 # Static assets (copied as-is)
│   └── bookmarklet.js
├── src/
│   ├── assets/             # Source assets (images, JSON, bookmarklet source)
│   ├── components/         # Shared UI components
│   │   ├── common/
│   │   ├── layout/         # BranchSelector, ThemeToggle, Footer, NotificationCenter
│   │   ├── maimai/         # ScoreCard, maimai-specific UI
│   │   ├── modals/         # Preferences, Schedule, BranchEdit, Changelog, etc.
│   │   └── profile/        # Profile sections, modals, cards
│   ├── config/             # Theme and maimai constants
│   ├── constants/          # Feature flags, queue status enums
│   ├── contexts/           # React context providers and defs
│   ├── data/               # Static data (changelog, subtitle messages)
│   ├── features/           # Feature modules (queue, admin, songs)
│   │   ├── admin/          # Admin UI and hooks
│   │   ├── queue/          # Queue UI and hooks
│   │   └── songs/          # Song database UI
│   ├── hooks/              # Shared hooks (auth, branch, queue, etc.)
│   ├── pages/              # Route-level page components
│   ├── services/           # Supabase, songs, geolocation
│   ├── types/              # JSDoc types (e.g. queue)
│   ├── utils/              # Validation, maimai-calc, constants
│   ├── App.jsx             # Root component, providers, routes
│   ├── App.css
│   ├── main.jsx            # React entry
│   └── index.css           # Global styles
├── supabase/               # Supabase project (e.g. migrations)
│   └── migrations/         # (empty in scan)
├── index.html              # HTML entry
├── package.json
└── vite.config.js          # Vite and build config
```

## Directory Purposes

**src/components/**
- Purpose: Reusable components used across pages and features.
- Contains: Layout (BranchSelector, ThemeToggle, Footer, NotificationCenter), modals (PreferencesModal, ScheduleEditor, BranchEditModal, ChangelogModal, LocationPermissionModal, etc.), profile (FavoriteSongsSection, PlaylistSection, MaimaiImportModal, ProfileSettingsModal, etc.), maimai (ScoreCard), common; plus top-level LoginForm.jsx, BookmarkletInstructions.jsx.
- Key files: `src/components/layout/BranchSelector.jsx`, `src/components/LoginForm.jsx`, `src/components/maimai/ScoreCard.jsx`, `src/components/modals/PreferencesModal.jsx`.

**src/features/**
- Purpose: Domain features with their own components and optional hooks.
- Contains: queue (QueueManager, QueueForm, QueueList, NowPlayingCard, PlayTimer, QueueItem, QueueRulesModal; hooks under features/queue/hooks). admin (UserTable, UserManager, ReportsManager, QueueRuleManager, AccessRequests, BranchList, QueueRuleEditor; hooks under features/admin/hooks). songs (SongDatabase, SongList, SongCard, SongFilters, SongDetailModal, SongSelectionModal).
- Key files: `src/features/queue/components/QueueManager.jsx`, `src/features/admin/components/UserTable.jsx`, `src/features/songs/components/SongDatabase.jsx`, `src/hooks/useQueueManager.js` (shared hook used by queue feature).

**src/contexts/**
- Purpose: React Context definitions and providers for app-wide state.
- Contains: ThemeContext, AuthContext + AuthContextProvider, BranchContext, SongDatabaseContext + SongDatabaseContextDef, FeatureFlagContext + FeatureFlagContextDef.
- Key files: `src/contexts/AuthContext.jsx`, `src/contexts/BranchContext.jsx`, `src/contexts/ThemeContext.jsx`, `src/contexts/SongDatabaseContext.jsx`, `src/contexts/FeatureFlagContext.jsx`.

**src/hooks/**
- Purpose: Shared hooks for auth, branch, queue (composed), location, permissions, song database, etc.
- Contains: useAuth, useBranch, useQueueManager, useQueueData, useQueueActions, useLocationVerification, useCabinetManager, useMonitorData, useMallSchedule, usePageVisibility, usePermissions, useSongDatabase, useSongDatabaseContext, useMouseDragScroll, useFeatureFlags, useLocationGuard, usePlayerSuggestions.
- Key files: `src/hooks/useQueueManager.js`, `src/hooks/useQueueData.js`, `src/hooks/useAuth.js`, `src/hooks/useBranch.js`.

**src/services/**
- Purpose: Backend and external APIs (Supabase client and domain services, songs API, geolocation).
- Contains: supabase.js (client + authService, rolesService, userService, queueService, branchService, etc.; subscriptions), songs.js (songsService), geolocation.js.
- Key files: `src/services/supabase.js`, `src/services/songs.js`, `src/services/geolocation.js`.

**src/pages/**
- Purpose: One component per main route; loaded lazily except MainApp in App.jsx.
- Contains: AdminPage, ViewPage, SongsPage, ContactPage, ExportBest50Page, PublicProfilePage.
- Key files: `src/pages/AdminPage.jsx`, `src/pages/ViewPage.jsx`, `src/pages/PublicProfilePage.jsx`, `src/pages/SongsPage.jsx`.

**src/config/**
- Purpose: Theme and maimai game configuration.
- Contains: theme.js (Mantine theme, palettes), maimai-constants.js (difficulty colors, grades, jacket URL, etc.).
- Key files: `src/config/theme.js`, `src/config/maimai-constants.js`.

**src/utils/**
- Purpose: Validation (Zod), maimai calculations, shared constants.
- Contains: validation.js (schemas + validateData), maimai-calc.js (getGrade, calculateBest50, fetchSongConstants), constants.js.
- Key files: `src/utils/validation.js`, `src/utils/maimai-calc.js`.

**src/types/**
- Purpose: JSDoc type definitions for queue and related models.
- Contains: queue.js (QueueEntry, Branch, UserRoles, LocationState).
- Key files: `src/types/queue.js`.

**src/constants/** and **src/data/**
- Purpose: Feature flags, queue status constants; static copy (changelog, subtitle messages).
- Key files: `src/constants/featureFlags.js`, `src/constants/queue.js`, `src/data/changelog.js`, `src/data/subtitleMessages.js`.

**api/**
- Purpose: Vercel serverless functions.
- Contains: profile-meta.js (profile meta/OG by slug).
- Key files: `api/profile-meta.js`.

## Key File Locations

**Entry points:**
- `index.html`: HTML shell; script src `/src/main.jsx`.
- `src/main.jsx`: React createRoot, App, SpeedInsights.
- `src/App.jsx`: Providers, Routes, lazy pages, MainApp (default route).

**Configuration:**
- `vite.config.js`: Vite, React plugin, compression, optional visualizer.
- `src/config/theme.js`, `src/config/maimai-constants.js`: App and game config.
- Environment: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (and optional VITE_SONG_JACKETS_URL); `.env` present (existence only).

**Core logic:**
- Queue: `src/features/queue/components/QueueManager.jsx`, `src/hooks/useQueueManager.js`, `src/hooks/useQueueData.js`, `src/hooks/useQueueActions.js`, `src/services/supabase.js` (queueService, subscribeToQueueChanges).
- Auth/roles: `src/contexts/AuthContext.jsx`, `src/services/supabase.js` (authService, rolesService).
- Branch: `src/contexts/BranchContext.jsx`, `src/services/supabase.js` (branchService).
- Song database: `src/contexts/SongDatabaseContext.jsx`, `src/services/songs.js`, `src/hooks/useSongDatabase.js`, `src/hooks/useSongDatabaseContext.js`.

**Testing:**
- Not detected (no test runner config or test file pattern found in exploration).

## Naming Conventions

**Files:**
- Components: PascalCase (e.g. QueueManager.jsx, BranchSelector.jsx, LoginForm.jsx).
- Hooks: camelCase with "use" prefix (e.g. useQueueManager.js, useAuth.js).
- Services/utils/config: camelCase or kebab (e.g. supabase.js, maimai-constants.js, validation.js).
- Contexts: PascalCase (e.g. AuthContext.jsx, ThemeContext.jsx); Def files: *ContextDef.js.

**Directories:**
- Lowercase: components, contexts, hooks, services, pages, utils, config, constants, data, types, assets, api.
- features subdirs: queue, admin, songs; components subdirs: layout, modals, profile, maimai, common.

**Exports:**
- Components: default export for page/feature components; named exports for context providers and hooks.
- Services: named exports (supabase, authService, queueService, etc.).
- Config/constants: named exports (themes, DIFFICULTY_COLORS, QUEUE_STATUS, etc.).

## Where to Add New Code

**New page/route:**
- Add component under `src/pages/` (e.g. NewPage.jsx).
- In `src/App.jsx`: add lazy import and a `<Route path="..." element={<NewPage />} />`.

**New feature module:**
- Add directory under `src/features/<feature-name>/` with `components/` and optionally `hooks/`.
- Put feature-specific hooks under `src/features/<feature-name>/hooks/` or shared hooks in `src/hooks/`.
- Use existing contexts and services; add new service methods in `src/services/supabase.js` or a new service file if not Supabase.

**New shared component:**
- Layout/chrome: `src/components/layout/`.
- Modal: `src/components/modals/`.
- Domain-specific (e.g. maimai): `src/components/maimai/` or new subdir under `src/components/`.
- Generic: `src/components/common/`.

**New hook:**
- Shared across features: `src/hooks/` with camelCase use*.js.
- Feature-specific: `src/features/<name>/hooks/`.

**New API/backend call:**
- Supabase: add methods to appropriate object in `src/services/supabase.js` or add new exported service object; use `src/utils/validation.js` for Zod where needed.
- Non-Supabase: new file under `src/services/` (e.g. externalApi.js) or add serverless function under `api/`.

**Utilities and types:**
- Validation schemas and validateData: `src/utils/validation.js`.
- Pure helpers/calculations: `src/utils/` (e.g. maimai-calc.js or new file).
- JSDoc types: `src/types/` (e.g. queue.js or new file).

## Special Directories

**dist/**
- Purpose: Vite build output (JS, CSS, assets).
- Generated: Yes.
- Committed: Typically no (gitignored).

**public/**
- Purpose: Static files served at root (e.g. bookmarklet.js).
- Generated: No.
- Committed: Yes.

**supabase/migrations/**
- Purpose: Supabase SQL migrations.
- Generated: No (or by Supabase CLI).
- Committed: Yes if used.

**.planning/codebase/**
- Purpose: GSD codebase analysis (ARCHITECTURE.md, STRUCTURE.md, etc.).
- Generated: By map-codebase / codebase mapper.
- Committed: Per project practice.

---

*Structure analysis: 2025-02-23*
