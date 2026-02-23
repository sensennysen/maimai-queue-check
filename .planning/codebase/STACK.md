# Technology Stack

**Analysis Date:** 2025-02-23

## Languages

**Primary:**
- JavaScript (ES modules) - Application code in `src/`, `api/`
- JSX - React components throughout `src/`

**Secondary:**
- Not detected (no TypeScript, no separate backend language)

## Runtime

**Environment:**
- Node.js - Used for Vite dev server, build, and Vercel serverless API (`api/profile-meta.js`)

**Package Manager:**
- npm (implied by `package-lock.json`)
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- React 19.2.0 - UI framework; entry in `src/main.jsx`, app shell in `src/App.jsx`
- Vite 7.2.4 - Build tool and dev server; config in `vite.config.js`
- React Router DOM 7.13.0 - Client-side routing

**UI / Components:**
- Mantine 8.3.x - Component library (`@mantine/core`, `@mantine/dropzone`, `@mantine/form`, `@mantine/hooks`, `@mantine/notifications`, `@mantine/tiptap`)
- Tabler Icons React 3.36.1 - Icons (`@tabler/icons-react`)
- TipTap 3.20.x - Rich text (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`)

**Testing:**
- Not detected (no Jest, Vitest, or test runner in `package.json`)

**Build/Dev:**
- Vite 7.2.4 - Bundler, HMR, dev server
- ESLint 9.39.x - Linting; flat config in `eslint.config.js`
- Husky 9.1.7, lint-staged 16.2.7 - Pre-commit hooks
- rollup-plugin-visualizer 5.12.0 - Bundle analysis (`npm run build:analyze`)
- vite-plugin-compression 0.5.1 - Gzip/Brotli for build output
- terser 5.46.0 - Minification (production build)

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.90.1 - Backend: auth, database, storage, realtime; client in `src/services/supabase.js`, serverless in `api/profile-meta.js`
- `react` 19.2.0, `react-dom` 19.2.0 - Core UI
- `react-router-dom` 7.13.0 - Routing
- `zod` 4.3.6 - Schema validation; used in `src/utils/validation.js` and `src/services/supabase.js`

**Infrastructure:**
- `@vercel/analytics` 1.6.1 - Analytics; used in `src/App.jsx`
- `@vercel/speed-insights` 1.3.1 - Speed insights; used in `src/main.jsx`
- `dotenv` 17.2.3 - Environment loading (dev; Vite uses `import.meta.env` in app code)

**Utilities:**
- `dompurify` 3.3.1 - HTML sanitization; used in `src/features/queue/components/QueueRulesModal.jsx`, `QueueForm.jsx`
- `html-to-image` 1.11.13 - Screenshot/export
- `react-easy-crop` 5.5.6 - Image cropping (e.g. profile pictures)

## Configuration

**Environment:**
- Vite exposes env via `import.meta.env`; client expects `VITE_*` variables.
- API/serverless uses `process.env` (same names); see INTEGRATIONS.md for required vars.
- `.env` file present in project root (do not read contents; used for local dev).

**Build:**
- `vite.config.js` - Plugins (React, compression, optional visualizer), build target `esnext`, terser minification, rollup output paths (`assets/js`, `assets/images`, `assets/css`, `assets/fonts`), `chunkSizeWarningLimit: 800`, sourcemaps (hidden in production).

## Platform Requirements

**Development:**
- Node.js (version not pinned; no `.nvmrc` or `.node-version` in repo)
- Modern browser for `src/` (ES modules, React 19)

**Production:**
- Deployment target: Vercel (implied by `vercel.json`, `@vercel/*` packages, and `api/` serverless).
- Static assets served from Vite build output; API routes under `/api/` (e.g. `/api/profile-meta`).

---

*Stack analysis: 2025-02-23*
