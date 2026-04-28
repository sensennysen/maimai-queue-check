# Phase 01: Safety Rails (No Behavior Breaks) - Research

**Researched:** 2026-03-19  
**Domain:** React stale-request guards; SSRF-safe image proxy patterns; safe HTML/meta rendering for link previews  
**Confidence:** MEDIUM

<queue_03>
## QUEUE-03: Realtime stale-update guard

**Observed current behavior:**
- `src/hooks/useQueueData.js` refetches on realtime payloads via `queueService.getQueueEntries(...).then(setQueue)` with no scoping.
- If the user changes branch/cabinet while an earlier fetch is in-flight, a late resolution can overwrite the newer selection’s state.

**Recommended low-risk patterns (in order of preference):**
1. **Request scoping via monotonic requestId** (no service changes required)
   - Keep a `useRef(0)` counter.
   - On each fetch start, increment and capture `myId`.
   - Only apply `setQueue(...)` if `myId === currentIdRef.current`.
   - Apply the same pattern to errors (avoid showing stale errors).
2. **AbortController cancellation** (requires plumbing)
   - Use a `useRef(AbortController)` per hook and abort the previous controller on selection change and/or on each realtime-triggered refetch.
   - Requires `queueService.getQueueEntries(branchId, cabinetNum, { signal })` (or similar) to forward the signal into fetch calls, if any.

**Key safety note:** RequestId guard is often sufficient even if the underlying request cannot be cancelled.
</queue_03>

<sec_01>
## SEC-01: Harden `/api/proxy`

**Observed current behavior (`api/proxy.js`):**
- Parses URL and blocks localhost / private IP literals / DNS resolution to private IPs.
- Allows all public hosts, sets `Access-Control-Allow-Origin: *`, has no timeouts or size limits, and returns any content-type.

**Recommended hardening (keeping export working):**
- **Scheme restriction:** keep http/https only.
- **Host allowlist (minimal-break approach):**
  - Prefer a configurable allowlist via env (e.g., `PROXY_ALLOWED_HOSTS`), plus a small default allowlist for known sources used by the app (Supabase storage host, `placehold.co`, etc.).
  - If allowlist is too risky right now, at least add *deny-by-default* for obviously dangerous targets and block redirects to disallowed hosts.
- **Timeout:** Abort fetch after a short window (e.g., 5–10s).
- **Response size cap:** enforce a max bytes limit for buffers returned to clients (pre-check `content-length` and hard-cap while reading).
- **Content-type allowlist:** only allow `image/*` (or a specific list like png/jpeg/webp/gif) since the client code is image-localizing.
- **Redirect policy:** disable redirects or validate each redirect hop against the same SSRF/allowlist rules.
- **CORS:** prefer same-origin; if cross-origin access is required, use an explicit allowlist of origins.

**Test strategy:**
- Keep handler unit tests deterministic by mocking:
  - `globalThis.fetch`
  - `node:dns/promises` `lookup` (for private-resolving hostnames)
</sec_01>

<sec_02>
## SEC-02: Escape/encode `/api/profile-meta`

**Observed current behavior (`api/profile-meta.js`):**
- Has escaping helpers and uses `JSON.stringify(url)` for the redirect.
- Builds `baseUrl` from `req.headers.host` which is vulnerable to host header poisoning in some deployments.

**Recommended hardening:**
- **Do not trust `Host` header** for canonical URLs.
  - Prefer `process.env.PUBLIC_BASE_URL` (or derive from `VERCEL_URL` when available) and fall back to a safe constant.
- Ensure all user-controlled values in:
  - `<title>`
  - `<meta ... content="...">`
  - `og:*` / `twitter:*` fields
  are escaped for HTML attribute/text contexts.

**Test strategy:**
- Unit-test against hostile `display_name` payloads and a hostile `Host` header.
- Assert the output does not contain raw payload substrings and that the canonical URL is built from the trusted base, not the attacker-controlled host.
</sec_02>

<sources>
## Sources

This research is primarily derived from:
- Existing repo code paths listed in `01-CONTEXT.md`
- Common secure-by-default patterns for request scoping/cancellation and SSRF-safe proxying
</sources>

---

*Phase: 01-safety-rails-no-behavior-breaks*  
*Research date: 2026-03-19*

