# Phase 08: Core Security & Auth Hardening - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Securing the session caching layer and score import boundary against XSS and unauthorized access. Moving away from long-lived `localStorage` persistence toward more volatile security defaults, and enforcing strict Database Edge RLS checks for score imports.
</domain>

<decisions>
## Implementation Decisions

### Session Storage Strategy
- DEFERRED: User will handle `sessionStorage` migration manually. Keep `localStorage` for now.
- Future milestone: Move to HttpOnly cookies for Supabase authentication.

### Role Caching Policy
- Move role caching to in-memory only (React state variable without `localStorage`).
- Rely on the existing Realtime pub/sub channels in `AuthContext` to stay fresh.

### Edge Validation Strictness
- ALREADY IMPLEMENTED: `import_sessions` table already has strict RLS (`auth.uid() = user_id`).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Auth & Roles
- `src/contexts/AuthContext.jsx` — [Existing role caching and real-time subscription logic]
- `src/services/supabase/client.js` — [Supabase instantiation logic]

### Security & Architecture
- `src/services/README.md` — [Documentation on bookmarklet import and Edge Function flow]
- `api/README.md` (or similar) — [Optional edge function logic if available in repo]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AuthContext.jsx`: Already defines robust loading falbacks and error boundaries that will gracefully handle in-memory cache misses on hard refreshes.
- `client.js`: Currently uses an explicit `storage: window.localStorage` key logic which can be pointed to `window.sessionStorage`.

### Established Patterns
- Client-side token storage relies completely on browser APIs.
- Auth context has comprehensive pub/sub channels (`user-roles-${user.id}`) to sync roles/profiles across tabs, meaning roles can be effectively kept in memory.

### Integration Points
- `client.js` is the central configuration entry point for changing Supabase persistence.
- Any change to `import_sessions` RLS will implicitly secure the `receive-import` Edge Function as long as it parses the JWT correctly.
</code_context>

<specifics>
## Specific Ideas

- N/A
</specifics>

<deferred>
## Deferred Ideas

- Migrate exclusively to HttpOnly cookies and SSR/API based session management (Planned for a future version).
</deferred>

---

*Phase: 08-core-security-auth-hardening*
*Context gathered: 2026-03-21*
