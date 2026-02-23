# CONCERNS.md — Technical Debt & Known Issues

## Active Tech Debt (DEBT-XX)

### DEBT-01 — Supabase Service Refactor ✅ RESOLVED
**Status:** Completed (Phase 5, cf310bf5 conversation)

The monolithic `src/services/supabase.js` (~700+ lines) was refactored into domain-specific modules under `src/services/supabase/`. A facade `src/services/supabase.js` re-exports everything for backward compatibility.

**Result:**
- `auth.js` — authService, rolesService, subscribeToUserRoleChanges
- `queue.js` — queueService, subscribeToQueueChanges, subscribeToSessionChanges
- `profile.js` — userService, favoritesService, playlistService, mostPlayedService
- `admin.js` — branchService, scheduleService, adminService, requestService, rulesService
- `contact.js` — contactService, notificationService

---

### DEBT-02 — ESLint Disable Comments ✅ RESOLVED
**Status:** Completed (Phase 5)

Several files contain `// eslint-disable` directives to suppress lint rules rather than fixing them. These mask potential bugs.

**Result:** All 6 files audited. `PublicProfilePage.jsx` eslint-disable removed (deps were already correct). All other 5 files retain their disable with an explanatory comment justifying the intentional exception.

---

### DEBT-03 — `contactReportSchema` File Validation ✅ RESOLVED
**Status:** Completed (Phase 5)

In `src/utils/validation.js`:
```js
file: z.instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, ...)
  .refine((file) => ALLOWED_IMAGE_TYPES.includes(file.type), 'Only .jpg, .png, .gif, and .webp formats are supported')
```

Issues:
1. `z.instanceof(File)` fails in non-browser environments (tests, SSR)
2. Only image types allowed but the field is described as an attachment — no PDFs, etc.
3. MIME type can be spoofed client-side (no server-side content sniffing)

**Result:** `file` field now uses `z.instanceof(File).optional()` with the same two `.refine()` calls. The redundant `if (!file) return true` guards were removed since `.optional()` handles the undefined case natively.

---

### DEBT-04 — Error Swallowing in `useQueueData` ✅ RESOLVED
**Status:** Completed (Phase 5)

In `src/hooks/useQueueData.js`, real-time refresh failures are only logged:
```js
.catch(err => {
  console.error('[useQueueData] Failed to refresh queue on subscription event:', err);
});
```

The `error` state is never set for realtime failures, so users see stale data with no indication.

**Result:** The catch block in `handleQueueChange` now calls `console.error('[useQueueData] Failed to refresh queue on subscription event:', err)`. Users won't be left with silently stale data.

---

## Architecture Concerns

### Dual Data Source for User Roles
`user_roles` and `user_profiles` are merged in `rolesService.getUserRoles()` — permissions from `user_roles`, profile data from `user_profiles`. The `user_roles.preferred_branches` column was deprecated (set to NULL via migration, Phase 2). However, `user_roles` still exists as a separate table and has some data duplicated with `user_profiles` (e.g., `display_name`).

**Risk:** Medium — sync logic between tables adds complexity. Future writes must update both tables or the sync logic in `profile.js` `updatePreferences()`.

### Realtime Channel Proliferation
Multiple realtime channels are created per session:
- `queue_realtime:<branchId>:<ts>:<rand>` per `useQueueData` mount
- `user-roles-<uid>` + `user-profiles-<uid>` in `AuthContext`
- `user_roles_realtime` + `session_realtime` (exported/global)

**Risk:** Low-medium — the Supabase client is already throttled to `eventsPerSecond: 10` (PERF-01). However, if multiple components mount simultaneously, channel count could spike. No explicit cleanup tracking outside of React effect cleanup.

### Role Cache Consistency
User roles are cached in `localStorage` under `user_roles_<uid>`. Cache is read on mount and written after each fetch. Cache is cleared on sign-out (SEC-01). However:
- If the role cache is stale and the network is unavailable, users could operate with outdated permissions
- No TTL on the cache — only invalidated on sign-out or successful re-fetch

**Risk:** Low — acceptable trade-off for performance, but noted.

### `AuthContext` Effect Race Condition Risk
`onAuthStateChange` sets `user` state, then a separate `useEffect` calls `refreshUserRoles()` when `user` changes. There's a comment in `AuthContext.jsx` (lines 100–108) acknowledging the potential for stale closure. The current approach relies on React's batched re-render to avoid a race condition.

**Risk:** Low — documented and understood; not currently manifesting.

---

## Performance Concerns

### Manual Chunk Splitting — Intentionally Disabled (Vercel Incompatibility)
`vite.config.js` has a `manualChunks` configuration kept commented out. Manual chunk splitting interferes with Vercel's output file serving, so it cannot be enabled for this deployment target.

**Risk:** Accepted — bundle is Vercel-optimized as-is. Do not uncomment `manualChunks` without testing a Vercel preview deployment first.

### `PublicProfilePage.jsx` Size
At 29,456 bytes, `PublicProfilePage.jsx` is the largest page file. It likely handles too many concerns and could benefit from extraction of sub-components.

**Risk:** Low-medium — maintenance burden; no performance issue unless Suspense boundary is too coarse.

---

## Security Concerns

### SEC-01 ✅ RESOLVED
Role cache cleared on sign-out. Prevents stale roles persisting in `localStorage` after switching accounts.

### SEC-04 ✅ RESOLVED
Cache keys renamed from `smf_user_roles_<uid>` to `user_roles_<uid>`. Backward compat read in `getCachedRoles` — falls back to old key, then writes new key only.

### File Upload Security
`contact_uploads` files are uploaded directly to Supabase Storage from the browser with client-side MIME type check only. There is no server-side content inspection.

**Risk:** Medium — malicious files could be uploaded if MIME type is spoofed. Mitigated by signed URL access (files not publicly listed).

### Admin Routes
`/admin` route has no route-level auth guard in `App.jsx` — protection is implemented inside `AdminPage.jsx`. If component-level auth fails silently, admin UI could be exposed.

**Risk:** Low — Supabase RLS policies are the real guard. Admin UI operations would fail at the DB level even if UI is visible.

---

## Fragile Areas (FRAG-XX)

### FRAG-03 ✅ RESOLVED
`AuthContext` now shows a Mantine notification when role fetch fails instead of silently falling back to defaults.

### `updateOrderPositions` — Sequential Loop
`queueService.updateOrderPositions()` updates order positions in a `for` loop (sequential DB calls). Under heavy reorder operations, this could be slow.

```js
for (const update of updates) {
  await supabase.from('queue_entries').update(...).eq('id', update.id)...;
}
```

**Risk:** Low — queue sizes are small in practice; this is not a hot path.

### `upsertPlaylist` — Delete-then-Insert Pattern
Playlist songs are always deleted and re-inserted on every save. No diff/patch approach.

**Risk:** Low — acceptable for playlist sizes; could become an issue with very large playlists.
