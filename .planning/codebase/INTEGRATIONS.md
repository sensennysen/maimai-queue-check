# External Integrations

**Analysis Date:** 2025-02-23

## APIs & External Services

**Backend-as-a-Service:**
- Supabase - Database, auth, storage, realtime
  - SDK/Client: `@supabase/supabase-js`
  - Auth: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (client and serverless API both use these env vars)

**Analytics & Observability:**
- Vercel Analytics - Usage analytics; component in `src/App.jsx`
- Vercel Speed Insights - Performance; component in `src/main.jsx`

**Assets:**
- Song jacket images - Base URL from `VITE_SONG_JACKETS_URL`; used in `src/config/maimai-constants.js` (e.g. CloudFront or CDN).
- Google Fonts - Outfit, Space Grotesk; loaded in `index.html` and `api/profile-meta.js` template.

## Data Storage

**Databases:**
- Supabase (PostgreSQL)
  - Connection: configured via `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
  - Client: `@supabase/supabase-js`; single client in `src/services/supabase.js`, ad-hoc client in `api/profile-meta.js`
  - Tables referenced in code: `user_roles`, `user_profiles`, `user_all_scores`, `user_most_played_songs`, `user_favorite_songs`, `user_playlists`, `playlist_songs`, `queue_entries`, `allowed_places`, `mall_schedule`, `access_requests`, `notifications`, `user_notification_reads`, `contact_reports`, `queue_rules`, `game_sessions`, `user_attributions`

**File Storage:**
- Supabase Storage
  - Bucket `profile-pictures`: user profile photos; upload/delete in `src/services/supabase.js` (`userService`)
  - Bucket `contact_uploads`: contact form attachments; upload/signed URL/delete in `contactService` in `src/services/supabase.js`

**Caching:**
- None (no Redis or dedicated cache layer; session in `localStorage` via Supabase auth)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (OAuth + session)
  - Implementation: `authService` in `src/services/supabase.js`; `signInWithOAuth`, `signOut`, `getUser`, `onAuthStateChange`
  - Session: persisted in `localStorage` under key `smf-queue-auth`; `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`
  - UI: `src/contexts/AuthContext.jsx`, `src/hooks/useAuth.js`, `src/components/LoginForm.jsx`; Google OAuth button calls `signInWithProvider('google')`. Other providers (e.g. Discord) are supported by Supabase but only Google is wired in the LoginForm UI.
  - Privacy copy in `src/components/modals/PrivacyModal.jsx` references "Google, Discord, etc." as login providers.

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry or similar)

**Logs:**
- `console.error` / `console.warn` in app and API (e.g. `src/services/supabase.js`, `api/profile-meta.js`)

## CI/CD & Deployment

**Hosting:**
- Vercel - Static + serverless; `vercel.json` defines headers (CSP, X-Frame-Options, etc.), rewrites for SPA and `/p/:slug` → `/api/profile-meta`, and API routing.

**CI Pipeline:**
- Not detected in repo (no GitHub Actions or other CI config in explored paths).

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL` - Supabase project URL (client and API)
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key (client and API)
- `VITE_SONG_JACKETS_URL` - Base URL for maimai song jacket images (optional for runtime if guarded; used in `src/config/maimai-constants.js`)

**Secrets location:**
- Vercel: project env vars for production/preview. Local: `.env` in project root (existence only; never read or committed).

## Webhooks & Callbacks

**Incoming:**
- None (no webhook endpoints defined in app or `vercel.json`)

**Outgoing:**
- OAuth redirect: Supabase Auth redirects to `window.location.origin` after sign-in (see `src/services/supabase.js` auth options).

## Realtime

- Supabase Realtime used for:
  - `queue_entries` - `subscribeToQueueChanges` in `src/services/supabase.js`; consumed by queue UI hooks (e.g. `src/hooks/useQueueData.js`, `src/hooks/useMonitorData.js`)
  - `game_sessions` - `subscribeToSessionChanges`
  - `user_roles` - `subscribeToUserRoleChanges` (e.g. `src/features/admin/components/UserTable.jsx`)
- Realtime config: `eventsPerSecond: 10` in client options in `src/services/supabase.js`.

---

*Integration audit: 2025-02-23*
