# External Integrations

**Analysis Date:** 2026-03-19

## APIs & External Services

**Supabase (Postgres + Auth + Realtime + Edge Functions):**
- Used for application data access (profiles, queue, etc.), realtime subscriptions, and auth session handling.
  - SDK/Client: `@supabase/supabase-js` 2.90.1 (`src/services/supabase/client.js`)
  - Auth: configured through `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `src/services/supabase/client.js`
- Edge Function integration (bookmarklet export flow):
  - Default function name: `receive-import`; override with `VITE_IMPORT_FUNCTION_NAME` (`scripts/build-bookmarklet.js`)
  - Build wiring: `scripts/build-bookmarklet.js` injects the Edge Function URL into `public/bookmarklet.js` (placeholder `__IMPORT_EDGE_FUNCTION_URL__`)
  - Import session lifecycle described in `src/services/README.md` and implemented in `src/services/supabase/import.js`

**Vercel (Hosting + Runtime Functions + Frontend Observability):**
- Hosting/runtime for the React app and serverless endpoints.
  - Serverless functions:
    - `api/profile-meta.js` (runtime: `nodejs`) - injects social meta tags by querying Supabase (`createClient` + `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`)
    - `api/proxy.js` - image/CORS proxy endpoint used during export (`/api/proxy?url=...`)
  - Frontend analytics/perf:
    - SDKs: `@vercel/analytics` (rendered as `<Analytics />` in `src/App.jsx`)
    - SDKs: `@vercel/speed-insights` (rendered as `<SpeedInsights />` in `src/main.jsx`)

**External Content/CDN:**
- Maimai jacket images base URL:
  - Env var: `VITE_SONG_JACKETS_URL`
  - Used by: `src/config/maimai-constants.js` (`BASE_JACKET_URL`) and `src/features/discussion/components/SongHeader.jsx` (image `src`)

**Google Fonts / Placeholder Images:**
- Google Fonts are loaded from `fonts.googleapis.com` / `fonts.gstatic.com` in `index.html`.
- Placeholder images are loaded from `https://placehold.co/...` via Mantine `fallbackSrc` values (various components).

## Data Storage

**Databases:**
- Supabase (Postgres):
  - Connection: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
  - Client: `src/services/supabase/client.js` (`createClient(...)`)
  - Realtime configuration includes a global throughput cap in `src/services/supabase/client.js` (`eventsPerSecond: APP_CONFIG.REALTIME_EVENTS_PER_SECOND`)

**File Storage:**
- Supabase Storage is used for user/media assets (client access via `@supabase/supabase-js` in `src/services/supabase/*`; base jacket images are served via `VITE_SONG_JACKETS_URL` in `src/config/maimai-constants.js`).

**Caching:**
- `api/proxy.js` sets `Cache-Control: public, max-age=86400` (24h) for proxied responses.

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (client-session persistence enabled):
  - Implementation: `createClient(..., { auth: { persistSession: true, storageKey: STORAGE_KEYS.AUTH, storage: window.localStorage } })` in `src/services/supabase/client.js`

## Monitoring & Observability

**Error Tracking:**
- Not detected.

**Logs:**
- Console logging in runtime code (e.g. export/proxy flows) and Vercel/serverless function console output in `api/*.js`.

## CI/CD & Deployment

**Hosting:**
- Vercel (see `vercel.json`)

**CI Pipeline:**
- Not detected (no CI config found via repo-level scan).

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL` - Supabase project URL used by:
  - `src/services/supabase/client.js` (client initialization)
  - `api/profile-meta.js` (server-side profile metadata lookup)
  - `scripts/build-bookmarklet.js` (Edge Function URL injection)
- `VITE_SUPABASE_ANON_KEY` - Supabase anon/public key used by:
  - `src/services/supabase/client.js`
  - `api/profile-meta.js`
- `VITE_SONG_JACKETS_URL` - base URL for song jacket images used by:
  - `src/config/maimai-constants.js`
  - `src/features/discussion/components/SongHeader.jsx`

**Optional env vars:**
- `VITE_IMPORT_FUNCTION_NAME` - Supabase Edge Function name for bookmarklet imports; defaults to `receive-import` in `scripts/build-bookmarklet.js`.

**Secrets location:**
- Not inspected. `.env` is referenced as a build-time input in `scripts/build-bookmarklet.js` via `dotenv.config({ path: join(root, '.env') })`.

## Webhooks & Callbacks

**Incoming:**
- Supabase Edge Function `receive-import`:
  - Called by `public/bookmarklet.js` (URL injected from `VITE_SUPABASE_URL` + `VITE_IMPORT_FUNCTION_NAME`)
- Vercel rewrite endpoints:
  - `/p/:slug` -> `/api/profile-meta?slug=:slug` (for social bots) via `vercel.json`
  - `/api/*` passthrough to `api/*` via `vercel.json`
- `/api/proxy?url=...`:
  - Called by `src/pages/ExportBest50Page.jsx` to localize/proxy remote images for `html-to-image`.

**Outgoing:**
- Supabase REST/realtime APIs via `src/services/supabase/*` modules and configured client in `src/services/supabase/client.js`.
- Image and HTML fetches:
  - Jacket images from `VITE_SONG_JACKETS_URL`
  - Bookmarklet-originated scraping calls to the external maimai site from `public/bookmarklet.js` (UI instructions in `src/components/BookmarkletInstructions.jsx`)

## Security-Adjacent Transport Notes

- CSP header allowlists in `vercel.json` include connect destinations for Supabase, Vercel Insights, and the app’s own `/api/proxy`.
- `api/proxy.js` sets permissive CORS headers (`Access-Control-Allow-Origin: *`) and caches results for 24 hours.

---

*Integration audit: 2026-03-19*
