# Services — Architecture & Performance Notes

> Documentation last updated: 2026-02-24.

---

## Service Architecture

The service layer lives under `src/services/`. The Supabase integration was split into domain modules (Phase 5 tech debt — completed 2026-02-23) to enable better tree-shaking and single-responsibility separation.

### Domain Modules (`src/services/supabase/`)

| Module | Exports | Responsibility |
|--------|---------|----------------|
| `client.js` | `supabase` | Supabase client instance (one place, no logic) |
| `auth.js` | `authService`, `rolesService`, `subscribeToUserRoleChanges` | Sign-in/out, role fetching, role realtime |
| `admin.js` | `adminService`, `requestService`, `notificationService` | Access requests, notifications, admin ops |
| `queue.js` | `queueService`, `subscribeToQueueChanges`, `subscribeToSessionChanges` | Queue CRUD, realtime queue/session changes |
| `profile.js` | `userService`, `favoritesService`, `playlistService` | User profiles, favorite songs, playlists |
| `contact.js` | `contactService` | Contact/report form submissions |
| `import.js` | `createImportSession`, `getImportSession`, `deleteImportSession` | Maimai score import: create session (token), poll for payload from bookmarklet → Edge Function; delete session after success or when expired |

### Facade (`src/services/supabase.js`)

A thin re-export file that forwards everything from the domain modules above. Exists for backward compatibility so existing call sites don't need to be updated to per-module imports. Modern bundlers (Vite/Rollup) tree-shake re-exports, so the facade does not negate the bundle benefit of the split.

```
src/services/supabase.js  ← facade (re-exports all of the above)
src/services/supabase/
  client.js
  auth.js
  admin.js
  queue.js
  profile.js
  contact.js
```

**Bundle impact:** Before the split, the monolithic `supabase.js` (~49 KB, ~1,650 lines) was loaded in full for every import, preventing tree-shaking. After the split, route-specific chunks can omit unused domain modules.

---

## Realtime Subscriptions

### Global Rate Limit

`eventsPerSecond: 10` is configured globally in `src/services/supabase/client.js`:

```js
realtime: {
  params: {
    // Intentionally limited to 10 events per second globally to constrain
    // client/server load. (tuned constraint)
    eventsPerSecond: 10,
  },
},
```

This caps realtime throughput across all channels for all connected clients.

### Subscription Audit

> **Security note:** RLS is enforced server-side on all channels. Client-side filters below are for load reduction only — they are not the security boundary.

| Channel | File | Table | Filter | Assessment |
|---------|------|-------|--------|------------|
| `general_notifications` | `NotificationCenter.jsx` | `notifications` | `user_id=eq.${userId}` | ✅ Scoped — only the current user's notifications are broadcast |
| `admin-notifications` | `NotificationCenter.jsx` | `access_requests` | Global; filtered client-side by `branch_id` for regular admins | ✅ Acceptable — admin-only feature, low volume; RLS enforces access |
| `queue_realtime:branch:*` | `queue.js` | `queue_entries` | `branch_id=eq.${branchId}` when branchId provided | ✅ Scoped — branch-specific queue changes only |
| `session_realtime` | `queue.js` | `game_sessions` | None (global) | ✅ Acceptable — `game_sessions` is a low-volume internal table |
| `user_roles_realtime` | `auth.js` | `user_roles` | None (global) | ✅ Acceptable — broadcasts role changes; triggers client-side role refresh for all connected users |
| `allowed_places_changes` | `BranchContext.jsx` | `allowed_places` | None (global) | ✅ Acceptable — branch config is low-volume; changes are infrequent and relevant to all clients |
| AuthContext user roles | `AuthContext.jsx` | `user_roles` | `user_id=eq.${user.id}` | ✅ Scoped |
| AuthContext user profiles | `AuthContext.jsx` | `user_profiles` | `id=eq.${user.id}` | ✅ Scoped |

### Summary

No high-volume unscoped subscriptions exist. The two global channels (`session_realtime`, `user_roles_realtime`) operate on low-volume tables where global broadcast is intentional and acceptable. The `eventsPerSecond: 10` constraint provides a global safety ceiling.

---

## Import sessions (bookmarklet flow)

The maimai bookmarklet sends scraped JSON to a Supabase Edge Function instead of the clipboard. The app creates a row in `import_sessions` (token, `user_id`, `status: 'pending'`, `expires_at`), the user enters that token in the bookmarklet overlay, and the Edge Function updates the row with `payload` and `status: 'complete'`. The app polls until complete then processes the payload and **deletes the row** (to avoid retaining sensitive payloads).

- **RLS:** Table `import_sessions` must allow INSERT, SELECT, and DELETE for `user_id = auth.uid()` only. The Edge Function uses the service role to update by `id`.
- **CORS:** The Edge Function (see `sampleEdgeFunction.ts`) allows origins for maimai DX NET and the app so the bookmarklet can POST from the maimai site.
- **Build:** Run `npm run build:bookmarklet` (or rely on `prebuild`) so `public/bookmarklet.js` is generated with the correct Edge Function URL from `VITE_SUPABASE_URL`. The default function name is `receive-import` (override with `VITE_IMPORT_FUNCTION_NAME`).
