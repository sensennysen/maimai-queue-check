# STRUCTURE.md — Directory Layout & Organization

## Top-Level

```
smf-queue-check/
├── .agent/               # GSD workflow definitions
│   └── workflows/        # *.md workflow files
├── .github/              # GitHub Actions CI
├── .husky/               # Git hook scripts (pre-commit lint)
├── .planning/            # Project planning docs (non-deployable)
│   ├── codebase/         # This document and its siblings
│   ├── phases/           # Phase-specific plans & summaries
│   ├── milestones/       # Milestone tracking
│   └── research/         # Research notes
├── .vscode/              # Editor settings
├── api/                  # Vercel serverless functions
├── dist/                 # Build output (gitignored)
├── docs/                 # Additional documentation
├── public/               # Static assets served as-is
├── src/                  # All application source code
├── supabase/             # Supabase local config / migrations
├── .env                  # Local env vars (gitignored)
├── eslint.config.js      # ESLint flat config
├── index.html            # HTML entry point
├── package.json
├── vite.config.js
└── vercel.json           # Vercel deployment config
```

## `src/` Layout

```
src/
├── App.css               # Global app styles (animations, layout)
├── App.jsx               # Root component: provider tree + routes
├── index.css             # Global CSS (design tokens, typography, utility classes)
├── main.jsx              # React DOM entry point
│
├── assets/               # Static assets imported by JS
│
├── components/           # Shared/reusable UI components
│   ├── BookmarkletInstructions.jsx
│   ├── LoginForm.jsx / LoginForm.css
│   ├── common/           # Generic primitives (buttons, cards, etc.)
│   ├── layout/           # App shell: Header, Footer, ThemeToggle, BranchSelector, NotificationCenter
│   ├── maimai/           # Maimai-specific display components
│   ├── modals/           # Modal dialogs (PreferencesModal, etc.) — 10 files
│   └── profile/          # Profile-specific components — 11 files
│
├── config/               # Static configuration
│   └── theme.js          # Mantine theme definitions + palette presets
│
├── constants/            # Application constants
│   ├── queue.js          # QUEUE_STATUS enum (waiting, playing, completed, cancelled)
│   └── (other)
│
├── contexts/             # React Contexts and Providers
│   ├── AuthContext.jsx         # Auth state + user roles + realtime
│   ├── AuthContextProvider.js  # Context def (avoids circular imports)
│   ├── BranchContext.jsx       # Selected arcade branch state
│   ├── FeatureFlagContext.jsx  # Feature flag state
│   ├── FeatureFlagContextDef.js
│   ├── SongDatabaseContext.jsx
│   ├── SongDatabaseContextDef.js
│   └── ThemeContext.jsx        # Dark/light + theme selection
│
├── data/                 # Static data files (song database JSON/JS)
│
├── features/             # Domain feature modules
│   ├── admin/            # Admin panel components (8 files)
│   ├── queue/            # Core queue management (12 files)
│   │   └── components/
│   │       └── QueueManager.jsx  # Top-level queue orchestrator
│   └── songs/            # Songs browser (6 files)
│
├── hooks/                # Custom React hooks
│   ├── useAuth.js                  # Consume AuthContext
│   ├── useBranch.js                # Consume BranchContext
│   ├── useCabinetManager.js        # Cabinet selection logic
│   ├── useFeatureFlags.js          # Consume FeatureFlagContext
│   ├── useLocationGuard.js         # Geofence gate hook
│   ├── useLocationVerification.js  # Geolocation logic
│   ├── useMallSchedule.js          # Mall hours fetching
│   ├── useMonitorData.js           # Monitor/display data
│   ├── useMouseDragScroll.js       # Drag-to-scroll UX
│   ├── usePageVisibility.js        # Page visibility API
│   ├── usePermissions.js           # Permission checks
│   ├── usePlayerSuggestions.js     # Player name autocomplete
│   ├── useQueueActions.js          # Queue mutation actions
│   ├── useQueueData.js             # Queue data + realtime
│   ├── useQueueManager.js          # Queue orchestration
│   ├── useSongDatabase.js          # Song DB queries/filtering
│   └── useSongDatabaseContext.js   # Consume SongDatabaseContext
│
├── pages/                # Route-level page components (lazy-loaded)
│   ├── AdminPage.jsx / AdminPage.css
│   ├── ContactPage.jsx
│   ├── ExportBest50Page.jsx
│   ├── PublicProfilePage.jsx
│   ├── SongsPage.jsx
│   └── ViewPage.jsx / ViewPage.css
│
├── services/             # Data access layer
│   ├── supabase.js       # Facade: re-exports all domain sub-modules
│   ├── geolocation.js    # Browser geolocation utilities
│   ├── songs.js          # Song data utilities
│   └── supabase/         # Domain-specific sub-modules
│       ├── client.js     # Supabase singleton client
│       ├── auth.js       # authService, rolesService, subscribeToUserRoleChanges
│       ├── queue.js      # queueService, subscribeToQueueChanges, subscribeToSessionChanges
│       ├── profile.js    # userService, favoritesService, playlistService, mostPlayedService
│       ├── admin.js      # branchService, scheduleService, adminService, requestService, rulesService
│       └── contact.js    # contactService, notificationService
│
├── types/                # Type definitions (1 file — likely JSDoc or custom type helpers)
│
└── utils/                # Pure utility functions
    ├── constants.js        # Shared constants
    ├── maimai-calc.js      # Maimai rating calculations
    └── validation.js       # Zod schemas + validateData helper
```

## Naming Conventions

| Pattern | Convention |
|---------|-----------|
| React components | PascalCase (`.jsx`) |
| Hooks | camelCase prefixed `use` (`.js`) |
| Services | camelCase object exports (`.js`) |
| Contexts | PascalCase for provider, camelCase def file |
| Constants | SCREAMING_SNAKE_CASE for values |
| CSS modules | Co-located with component (same name, `.css`) |
| Feature dirs | Lowercase domain name |

## Key Locations at a Glance

| What | Where |
|------|-------|
| Supabase client | `src/services/supabase/client.js` |
| Auth logic | `src/contexts/AuthContext.jsx` |
| Queue data hook | `src/hooks/useQueueData.js` |
| Main queue UI | `src/features/queue/components/QueueManager.jsx` |
| Route definitions | `src/App.jsx` (lines 124–133) |
| Zod schemas | `src/utils/validation.js` |
| Theme config | `src/config/theme.js` |
| Env validation | `src/services/supabase/client.js` (throws on missing vars) |
| Build config | `vite.config.js` |
