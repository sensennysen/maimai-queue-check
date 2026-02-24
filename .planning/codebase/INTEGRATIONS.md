# External Integrations

**Analysis Date:** 2025-02-24

## APIs & External Services

**Backend-as-a-Service:**
- Supabase - Data, auth, storage, realtime
  - SDK/Client: `@supabase/supabase-js`; client created in `src/services/supabase/client.js`
  - Auth: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (anon key used in client and in `api/profile-meta.js`)

**CDN / Static assets:**
- Song jacket images - Base URL from `VITE_SONG_JACKETS_URL` (referenced in `src/config/maimai-constants.js`; comment indicates CloudFront)

**Fonts:**
- Google Fonts - Outfit, Space Grotesk; loaded in `index.html` and `api/profile-meta.js`

## Data Storage

**Databases:**
- Supabase (PostgreSQL)
  - Connection: same project as client; URL and anon key via env
  - Client: `@supabase/supabase-js` (no ORM)
  - Tables/views used in code: `user_profiles`, `user_roles`, `queue_entries`, `maimai_songs`, `maimai_intl_sheets`, `allowed_places`, `mall_schedule`, `contact_reports`, `contact_uploads`, `notifications`, `user_notification_reads`, `access_requests`, `queue_rules`, `user_favorite_songs`, `user_playlists`, `playlist_songs`, `user_most_played_songs`, `user_all_scores`. See `src/services/supabase/` (auth.js, profile.js, queue.js, admin.js, contact.js), `src/services/songs.js`, `src/services/geolocation.js`, `src/contexts/FeatureFlagContext.jsx`.

**File Storage:**
- Supabase Storage
  - Buckets: `profile-pictures` (e.g. `src/services/supabase/profile.js`), `contact_uploads` (e.g. `src/services/supabase/contact.js`)

**Caching:**
- None (no Redis or dedicated cache; Supabase and browser handle their own caching)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth with OAuth
  - Implementation: `authService.signInWithProvider(provider)` in `src/services/supabase/auth.js`; UI uses Google in `src/components/LoginForm.jsx` (e.g. `handleSocialLogin('google')`). Privacy modal in `src/components/modals/PrivacyModal.jsx` mentions Google, Discord as login providers.
  - Session: persisted in `localStorage` under key `auth`; config in `src/services/supabase/client.js` (persistSession, storageKey, autoRefreshToken, detectSessionInUrl)

## Monitoring & Observability

**Analytics:**
- Vercel Analytics - `@vercel/analytics/react` used in `src/App.jsx`

**Performance:**
- Vercel Speed Insights - `@vercel/speed-insights/react` in `src/main.jsx`

**Error Tracking:**
- None (no Sentry or similar)

**Logs:**
- Console (e.g. `api/profile-meta.js`, auth/role fetch error handling in `src/services/supabase/auth.js`)

## CI/CD & Deployment

**Hosting:**
- Vercel (config in `vercel.json`; rewrites for `/p/:slug` to `/api/profile-meta`, SPA fallback; security headers)

**CI Pipeline:**
- Not detected in repo (likely configured in Vercel project)

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon/public key
- `VITE_SONG_JACKETS_URL` - Base URL for maimai song jacket images

**Secrets location:**
- Vercel project environment (for production); local `.env` for development (file present; do not read or commit)

## Webhooks & Callbacks

**Incoming:**
- `/api/profile-meta?slug=:slug` - Vercel serverless handler in `api/profile-meta.js`; invoked via rewrite for `/p/:slug` when User-Agent matches crawlers (facebookexternalhit, twitterbot, discordbot, whatsapp, telegrambot, slackbot, linkedinbot) to serve profile meta for sharing. Not a generic webhook.

**Outgoing:**
- None (no outbound webhook or callback URLs configured in code)

## Realtime

**Supabase Realtime:**
- Used for live updates: queue entries (`src/services/supabase/queue.js`), user roles and profiles (`src/services/supabase/auth.js`, `src/contexts/AuthContext.jsx`), allowed places (`src/contexts/BranchContext.jsx`), admin and general notifications (`src/components/layout/NotificationCenter.jsx`). Client config in `src/services/supabase/client.js` sets `realtime.params.eventsPerSecond: 10`.

---

*Integration audit: 2025-02-24*
