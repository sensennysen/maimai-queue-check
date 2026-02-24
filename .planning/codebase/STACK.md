# Technology Stack

**Analysis Date:** 2025-02-24

## Languages

**Primary:**
- JavaScript (ES modules) - Application and API code in `src/` and `api/`
- JSX - React components (`.jsx` in `src/`)

**Secondary:**
- Not applicable (no TypeScript; no other languages in app code)

## Runtime

**Environment:**
- Browser (client app)
- Node.js (Vercel serverless API in `api/`)

**Package Manager:**
- npm
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- React ^19.2.0 - UI
- Vite ^7.2.4 - Build and dev server
- React Router DOM ^7.13.0 - Routing
- Mantine ^8.3.15 - UI components, forms, notifications, rich text, dropzone, hooks

**Testing:**
- Not detected (no Jest, Vitest, or test runner in `package.json` or config)

**Build/Dev:**
- Vite ^7.2.4 - Bundler and dev server
- @vitejs/plugin-react ^5.1.1 - React fast refresh
- terser ^5.46.0 - Production minification
- vite-plugin-compression ^0.5.1 - gzip/brotli assets
- rollup-plugin-visualizer ^5.12.0 - Bundle analysis (`npm run build:analyze`)
- ESLint ^9.39.1 - Linting (`eslint.config.js`)
- Husky ^9.1.7, lint-staged ^16.2.7 - Pre-commit hooks

## Key Dependencies

**Critical:**
- @supabase/supabase-js ^2.90.1 - Backend, auth, storage, realtime; client in `src/services/supabase/client.js`
- react ^19.2.0 / react-dom ^19.2.0 - Core UI
- @mantine/core, @mantine/hooks, @mantine/form, @mantine/notifications, @mantine/dropzone, @mantine/tiptap - UI and forms
- react-router-dom ^7.13.0 - Routing
- zod ^4.3.6 - Schema validation (e.g. `src/utils/validation.js`)

**Infrastructure:**
- dotenv ^17.2.3 - Env loading (optional at build time)
- @vercel/analytics ^1.6.1 - Analytics (`src/App.jsx`)
- @vercel/speed-insights ^1.3.1 - Performance (`src/main.jsx`)

**Rich content & media:**
- @tiptap/react, @tiptap/starter-kit, @tiptap/extension-link, @mantine/tiptap - Rich text (e.g. queue rules)
- dompurify ^3.3.1 - Sanitization
- html-to-image ^1.11.13 - Export/screenshot
- react-easy-crop ^5.5.6 - Image cropping (profile)
- @tabler/icons-react ^3.36.1 - Icons

## Configuration

**Environment:**
- Vite env: `import.meta.env` in client; variables must be prefixed with `VITE_`
- Serverless API: `process.env` in `api/` (Vercel injects env)
- `.env` file present at project root (do not read or commit contents)
- Required for app: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SONG_JACKETS_URL`

**Build:**
- `vite.config.js` - Vite config, compression, analyze mode, Rollup output (assets/js, assets/images, etc.)
- `eslint.config.js` - ESLint flat config; browser globals for `src/`, Node globals for `api/`
- `vercel.json` - Headers (CSP, X-Frame-Options, etc.), rewrites (profile meta, SPA fallback), API routing

## Platform Requirements

**Development:**
- Node.js (version not pinned in repo; lockfile defines resolved versions)
- npm

**Production:**
- Vercel (implied by `api/`, `vercel.json`, Vercel Analytics/Speed Insights)
- Static assets + serverless functions under `api/`

---

*Stack analysis: 2025-02-24*
