---
phase: 3
slug: client-side-hardening-consistency
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

## Sampling Rate
- After every task commit: run `npm test`
- After every plan wave: run `npm run lint && npm test && npm run build`

## Green Commands (proof)
- `npm test`
- `npm run lint && npm test && npm run build`

## Gate Checks
- `src/utils/sanitizeHtml.js` has a single exported wrapper used by rich-text surfaces (`IntroductionCard`, `QueueRulesModal`) and plain-text surfaces (`QueueForm` player names).
- `src/utils/uploadValidation.js` exists and is called by:
  - `src/services/supabase/user.js#uploadProfilePicture`
  - `src/services/supabase/posts.js#uploadPostImage`

