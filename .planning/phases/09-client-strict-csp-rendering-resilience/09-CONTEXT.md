# Phase 09: Client Strict CSP & Rendering Resilience - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Prevent injection attack vectors by strictly enforcing Content-Security-Policy (removing `unsafe-eval` and reducing `unsafe-inline`). Ensure heavy canvas renders for the Best 50 Export degrade gracefully without locking the browser or overwhelming proxy services.
</domain>

<decisions>
## Implementation Decisions

### 1. CSP Enforcement Strategy (Dev vs Prod)
- **Local Enforcement:** CSP must be explicitly enforced during local development (e.g., via HTML meta tags or Vite config) to exactly match the target production policy.
- **Handling Breaking Third-Party Dependencies:**
  - If a production dependency strictly requires `unsafe-eval`, attempt to replace it with a compliant modern alternative.
  - If Vite HMR (dev-only) relies heavily on `unsafe-eval`, we will configure the injected CSP for local development to allow HMR *only* if unavoidable, but aim for a true strict `no-unsafe-eval` environment to guarantee prod readiness.
  - We will leverage nonces or hashes for legitimate inline scripts rather than allowing global `unsafe-inline`.

### 2. Proxy Concurrency & Degradation UX
- **Concurrency Limit:** The `ExportBest50Page` image proxy fetching will be wrapped in a concurrency limiter (e.g., using a library like `p-limit` or a custom semaphores implementation) to prevent overwhelming the server.
- **Degradation UX:** 
  - If a proxy request times out or fails, the resulting exported image will gracefully display a fallback placeholder.
  - **Placeholder Design:** A simple note icon (e.g., `IconNote` from Tabler Icons) centered in the jacket image space.
  - **Explicit Warning:** Upon export completion, if any cover arts failed to load, surface a notification/alert explicitly warning the user that their Best 50 export is "incomplete" due to network timeouts.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Configuration
- `vercel.json` (Production CSP headers)
- `vite.config.js` and `index.html` (Local CSP enforcement strategy)

### Rendering Logic
- `src/pages/ExportBest50Page.jsx` (Core export logic and proxy loop)
- `src/components/maimai/ScoreCard.jsx` (Image placeholder rendering)
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Mantine's `notifications.show()` in `ExportBest50Page.jsx` can be reused to trigger the "incomplete export" warning post-download.
- Tabler Icons are already heavily used; `IconNote` or `IconMusic` can be directly imported for the fallback placeholder.

### Established Patterns
- The export logic uses `html-to-image` over `src/pages/ExportBest50Page.jsx` and modifies `img.src` into local Base64 strings to bypass cross-origin restrictions. 
- A `Promise.all()` maps over `imageArray` concurrently; this array iteration will need to be refactored to limit concurrency.

### Integration Points
- Any strict CSP changes must not break the current `@mantine/core` CSS injections. (Prior phases have already prepared Mantine styles to play nicely with stricter CSP).
</code_context>

<specifics>
## Specific Ideas
- To implement the concurrency limit cleanly without a new dependency, we can chunk the image array or use a simple async queue processor.
</specifics>

<deferred>
## Deferred Ideas
- Dynamic configuration of the concurrency pool limit exposed to users (will hardcode a sensible limit like 5-10 for now).
</deferred>

---

*Phase: 09-client-strict-csp-rendering-resilience*
*Context gathered: 2026-03-22*
