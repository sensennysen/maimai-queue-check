# STACK.md — Technology Stack

## Runtime & Language

| Item | Version | Notes |
|------|---------|-------|
| Language | JavaScript (ESM) | No TypeScript; `"type": "module"` in package.json |
| React | ^19.2.0 | Concurrent mode, lazy/Suspense used for pages |
| Node (dev only) | Any LTS | Only needed for build/lint tooling |

## Build Tooling

| Tool | Version | Config |
|------|---------|--------|
| Vite | ^7.2.4 | `vite.config.js` — target `esnext`, minify via Terser |
| @vitejs/plugin-react | ^5.1.1 | Babel-based JSX transform |
| vite-plugin-compression | ^0.5.1 | Dual gzip + brotli output, threshold 1 KB |
| rollup-plugin-visualizer | ^5.12.0 | `build:analyze` mode only, outputs `dist/stats.html` |
| terser | ^5.46.0 | `drop_console` in production, `drop_debugger` always |

**Key Vite settings:**
- `chunkSizeWarningLimit: 800` KB
- Hashed asset filenames under `assets/js/`, `assets/css/`, `assets/images/`, `assets/fonts/`
- Manual chunk splitting **commented out** (PERF-01 investigation artifact) — single bundle currently

## UI Framework

| Package | Version | Notes |
|---------|---------|-------|
| @mantine/core | ^8.3.15 | Primary component library (Container, Paper, Stack, Group, Title, Button, etc.) |
| @mantine/hooks | ^8.3.15 | `useClickOutside`, `useDisclosure`, etc. |
| @mantine/notifications | ^8.3.15 | Toast notifications, positioned `top-right` |
| @mantine/form | ^8.3.15 | Form state management |
| @mantine/dropzone | ^8.3.15 | File upload zones |
| @mantine/tiptap | ^8.3.15 | Rich-text editor integration |
| @tabler/icons-react | ^3.36.1 | SVG icon set |

**Theme:** Multi-theme system in `src/config/theme.js`. `createTheme()` merges `primary`, `secondary`, `accent` color arrays (10-shade format). Themes: `circle` (default), others. Selected theme stored in `ThemeContext`.

## Backend / Database

| Package | Version | Notes |
|---------|---------|-------|
| @supabase/supabase-js | ^2.90.1 | Client-side Supabase SDK |
| Supabase Realtime | (bundled) | Postgres CDC via WebSocket channels |
| Supabase Storage | (bundled) | `profile-pictures` and `contact_uploads` buckets |

## Rich Text / Content

| Package | Version |
|---------|---------|
| @tiptap/react | ^3.20.0 |
| @tiptap/starter-kit | ^3.20.0 |
| @tiptap/extension-link | ^3.20.0 |

## Validation

| Package | Version | Notes |
|---------|---------|-------|
| zod | ^4.3.6 | Runtime schema validation for queue entries, user profiles, contact reports |
| dompurify | ^3.3.1 | HTML sanitisation (used in rich-text contexts) |

## Routing

| Package | Version | Notes |
|---------|---------|-------|
| react-router-dom | ^7.13.0 | `BrowserRouter`, `Routes`, `Route`, `Navigate`, `useParams` |

## Image Processing

| Package | Version |
|---------|---------|
| react-easy-crop | ^5.5.6 |
| html-to-image | ^1.11.13 |

## Analytics & Monitoring

| Package | Version | Notes |
|---------|---------|-------|
| @vercel/analytics | ^1.6.1 | Page view tracking via `<Analytics />` in `App.jsx` |
| @vercel/speed-insights | ^1.3.1 | Core Web Vitals reporting |

## Code Quality

| Tool | Version | Config |
|------|---------|--------|
| eslint | ^9.39.1 | `eslint.config.js` (flat config) |
| eslint-plugin-react-hooks | ^7.0.1 | Rules of hooks enforcement |
| eslint-plugin-react-refresh | ^0.4.24 | HMR safety |
| globals | ^16.5.0 | Browser globals preset |
| husky | ^9.1.7 | Git hooks (.husky/) |
| lint-staged | ^16.2.7 | Run `eslint --fix` + `eslint` on staged `*.{js,jsx}` |

## Environment Variables

| Key | Purpose |
|-----|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| Any others | Defined in `.env` (710 bytes), not committed |

## Deployment

- **Host:** Vercel (`vercel.json` present)
- **SPR:** All routes fallback to `index.html` (SPA routing)
- **Build output:** `dist/` directory
