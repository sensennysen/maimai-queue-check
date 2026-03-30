# Technology Stack

**Analysis Date:** 2026-03-19

## Languages

**Primary:**
- JavaScript (ESM + JSX) - `"type": "module"` in `package.json`, React UI in `src/main.jsx` / `src/App.jsx`

**Secondary:**
- JavaScript (Node.js runtime) - Vercel serverless functions in `api/profile-meta.js` and `api/proxy.js`, build script in `scripts/build-bookmarklet.js`

## Runtime

**Environment:**
- Browser (SPA; no SSR detected) - entry in `index.html` loads `src/main.jsx`
- Node.js (serverless + scripts) - `api/*.js`, `scripts/build-bookmarklet.js`

**Package Manager:**
- npm - `package-lock.json` present; scripts in `package.json`

## Frameworks

**Core:**
- Vite (`vite` `^7.2.4`) - build/dev server (`package.json`, `vite.config.js`)
- React (`react`, `react-dom` `^19.2.0`) - UI (`src/App.jsx`, `src/main.jsx`)
- Mantine (`@mantine/*` `^8.3.15`) - component system (imported broadly under `src/`)
- React Router (`react-router-dom` `^7.13.0`) - client routing (`src/App.jsx`)

**Testing:**
- Not detected (no `jest`/`vitest`/`playwright` configs or test scripts in `package.json`)

**Build/Dev:**
- ESLint (`eslint` `^9.39.1`) - linting via `npm run lint` / `lint:fix` (`eslint.config.js`, `package.json`)
- `@vitejs/plugin-react` (`^5.1.1`) - React transform/refresh (`vite.config.js`)
- `vite-plugin-compression` (`^0.5.1`) - gzip + brotli output (`vite.config.js`)
- `rollup-plugin-visualizer` (`^5.12.0`) - bundle visualization in analyze mode (`vite.config.js`, `package.json` script `build:analyze`)
- Terser (`terser` `^5.46.0`) - production minification (`vite.config.js`)

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` (`^2.90.1`) - backend client for auth/data/realtime (`src/services/supabase/client.js`)
- `@vercel/analytics` (`^1.6.1`) - client analytics (`src/App.jsx`)
- `@vercel/speed-insights` (`^1.3.1`) - web-vitals/perf reporting (`src/main.jsx`)

**Infrastructure:**
- `@hello-pangea/dnd` (`^18.0.1`) - drag/drop UX (used in UI under `src/`)
- `zod` (`^4.3.6`) - runtime validation (used in client logic under `src/`)
- `dompurify` (`^3.3.1`) - HTML sanitization (used under `src/`)
- `html-to-image` (`^1.11.13`) - DOM → PNG export (`src/pages/ExportBest50Page.jsx`)
- `react-easy-crop` (`^5.5.6`) - image cropping UX (used under `src/`)
- `dotenv` (`^17.2.3`) - local env loading for Node script (`scripts/build-bookmarklet.js`)

## Configuration

**Environment:**
- Client reads Vite env vars via `import.meta.env` (e.g. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in `src/services/supabase/client.js`; `VITE_SONG_JACKETS_URL` in `src/config/maimai-constants.js`)
- Serverless functions / Node scripts read env vars via `process.env` (e.g. `api/profile-meta.js`, `scripts/build-bookmarklet.js`)

**Build:**
- `vite.config.js` - build target `esnext`, terser settings, compression, output paths
- `eslint.config.js` - ESLint flat config with React/Refresh presets; Node globals enabled for `api/**/*.js` and `scripts/**/*.js`
- `vercel.json` - hosting rewrites + CSP/security headers

## Platform Requirements

**Development:**
- Node.js (needs native `fetch` for `api/proxy.js`; code assumes Node 18+ semantics) - `api/proxy.js`
- npm scripts:
  - `npm run dev` (Vite dev server) - `package.json`
  - `npm run build` (prebuild runs bookmarklet build) - `package.json`, `scripts/build-bookmarklet.js`
  - `npm run lint` - `eslint.config.js`

**Production:**
- Vercel deploy (SPA routing + serverless functions) - `vercel.json`, `api/*.js`

---

*Stack analysis: 2026-03-19*
