# Phase 08: Core Security & Auth Hardening - Research

## Standard Stack
- `@supabase/supabase-js`
- React Context (`useState`)

## Architecture Patterns
- **Role Caching:** Roles must reside strictly in memory via `AuthContext` (`useState`). They must rely on Realtime pub/sub (`postgres_changes`) to keep them fresh across tabs. `localStorage` must not be used for user roles or permissions.
- **Session Migration:** Context states that `sessionStorage` migration is deferred. `client.js` should continue using `localStorage` for now.
- **Edge RLS:** `import_sessions` already has correct strict RLS (`auth.uid() = user_id`). No further changes needed for the edge function validation boundary.

## Common Pitfalls
- **Hard Refresh Role Loss:** Since roles are in-memory, a hard refresh will drop them temporarily until `AuthContext` re-fetches them from the DB. `AuthContext` load states must handle this gracefully.
- **Stale Contexts:** Without `localStorage`, tabs won't sync instantly unless Realtime subscriptions broadcast the change. The existing `AuthContext` already subscribes to these.

## Don't Hand-Roll
- Complex tab-sync mechanisms (use existing Realtime channels).
- Custom `localStorage` fallback for roles (if DB fails, default to lowest privilege).

## Validation Architecture
- **In-Memory Role Check:** Verify that roles are not stored in `localStorage` by checking local storage keys.
- **Realtime Sync Check:** Verify that role changes in one tab or DB reflect in another without full page reload.

## Code Examples
```javascript
// AuthContext role caching is already in memory:
const [userRoles, setUserRoles] = useState(null);

// client.js remains unchanged per deferral
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: window.localStorage, // Deferred
  }
});
```
