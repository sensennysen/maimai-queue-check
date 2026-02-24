# INTEGRATIONS.md — External Services & APIs

## Supabase

**Client init:** `src/services/supabase/client.js`

```js
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    storageKey: 'auth',          // renamed from 'smf-queue-auth' (migration in client.js)
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: { eventsPerSecond: 10 }  // PERF-01 tuned constraint
  }
});
```

### Auth (OAuth only)

| Provider | Uses |
|----------|------|
| Google (via Supabase Auth) | `authService.signInWithProvider('google')` |
| Discord (likely configured) | `authService.signInWithProvider('discord')` |

OAuth redirect: `window.location.origin`

**Session cache:** Role data cached in `localStorage` under `user_roles_<uid>` (SEC-04 rename from `smf_user_roles_<uid>`). Cache cleared on sign-out (SEC-01).

### Database Tables

| Table | Service Module | Key Operations |
|-------|---------------|----------------|
| `queue_entries` | `src/services/supabase/queue.js` | CRUD for queue; filtered by `branch_id`, `cabinet_num`, `status`, `created_at >= today` |
| `game_sessions` | `src/services/supabase/queue.js` | Realtime-only subscription (`subscribeToSessionChanges`) |
| `user_roles` | `src/services/supabase/auth.js`, `admin.js` | Permissions: `can_edit`, `can_edit_on[]`, `is_admin`, `is_super_admin`, `admin_branch`. `preferred_branches` column **deprecated** (set to NULL via migration) |
| `user_profiles` | `src/services/supabase/auth.js`, `profile.js` | Primary user data: `display_name`, `preferred_branches` (authoritative), `slug`, `maimai_dx_name`, `maimai_best_scores`, `privacy_settings`, `is_public` |
| `user_all_scores` | `src/services/supabase/profile.js` | Raw maimai score import, keyed by `user_id` |
| `user_most_played_songs` | `src/services/supabase/profile.js` | Aggregated most-played data, keyed by `user_id` |
| `user_favorite_songs` | `src/services/supabase/profile.js` | PK is `(user_id, song_id)` composite; unique constraint handles dedup |
| `user_playlists` | `src/services/supabase/profile.js` | User-created playlists; child table `playlist_songs` with `(playlist_id, song_id, level, order_index)` |
| `user_attributions` | `src/services/supabase/auth.js` | Joined into profile selects; stores attribution metadata |
| `user_notification_reads` | `src/services/supabase/contact.js` | PK `(user_id, notification_id)`, upsert with `ignoreDuplicates: true` |
| `notifications` | `src/services/supabase/contact.js` | Global notifications, fetched for past 7 days |
| `allowed_places` | `src/services/supabase/admin.js` | Arcade branches: `arcade_name`, `short_name`, `acronym`, `longitude`, `latitude`, `cab_count`, `enabled` |
| `mall_schedule` | `src/services/supabase/admin.js` | Per-branch mall hours: `day`, `time_open`, `time_close` |
| `access_requests` | `src/services/supabase/admin.js` | Edit-access request workflow: `status` enum (`pending`, `approved`, `rejected`) |
| `contact_reports` | `src/services/supabase/contact.js` | Bug/feature/security reports: `attachment_path`, `attachment_name`, `status` enum (`open`) |
| `queue_rules` | `src/services/supabase/admin.js` | Per-branch queue rules blob, upserted on `branch_id` |

### Realtime Channels

| Channel ID Pattern | Table | Trigger |
|-------------------|-------|---------|
| `queue_realtime:<branchId>:<ts>:<rand>` | `queue_entries` | Branch-filtered CDC; hook `useQueueData` re-fetches on change |
| `session_realtime` | `game_sessions` | Global; static channel name |
| `user_roles_realtime` | `user_roles` | Global; exported `subscribeToUserRoleChanges` |
| `user-roles-<uid>` | `user_roles` | Per-user, row-filtered; in `AuthContext` |
| `user-profiles-<uid>` | `user_profiles` | Per-user, row-filtered; in `AuthContext` triggers `refreshUserRoles` |

**Note:** Queue channel uses unique ID per subscription instance to support multiple concurrent subscribers without channel collision.

### Storage Buckets

| Bucket | Used By | Notes |
|--------|---------|-------|
| `profile-pictures` | `userService.uploadProfilePicture` | Public URLs, `cacheControl: '3600'`, upsert allowed |
| `contact_uploads` | `contactService.submitReport` | Private — access via signed URLs (1 hr expiry) |

---

## Vercel

- Deployed to Vercel (SPA mode)
- `vercel.json` defines rewrites: all `/api/*` routes → `api/` serverless functions, all other routes → `index.html`
- `api/` directory contains serverless function(s) for server-side operations
- `@vercel/analytics` + `@vercel/speed-insights` auto-instrument page views and CWVs

---

## Geolocation API

- `src/services/geolocation.js` — browser `navigator.geolocation` used for location-based branch verification
- `src/hooks/useLocationVerification.js` + `useLocationGuard.js` drive geofencing logic (used to restrict queue edits to local users)

---

## Song Data (Local / Static)

- `src/services/songs.js` — local song database utility (reads from `src/data/`)
- `src/data/` — static JSON/JS song data files
- `SongDatabaseContext` + `useSongDatabase` hook provide app-wide access to song data
- No external API call for song data; data is bundled
