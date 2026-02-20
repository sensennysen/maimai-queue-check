# Roadmap - Simplify Mobile Bookmarklet

## Phase 1: Planning
- Define requirements in `SPEC.md`.
- Create `implementation_plan.md`.
- Status: IN PROGRESS

## Phase 2: Implementation (Immediate)
- Update `public/bookmarklet.js` with the full scraper script from `BookmarkletInstructions.jsx`.
- Update `BookmarkletInstructions.jsx` to generate the loader script.
- Ensure the loader script utilizes `window.location.origin` for the correct host.
- Status: PLANNED

## Phase 3: Verification
- Verify the `public/bookmarklet.js` file is accessible.
- Verify the generated bookmarklet code is short.
- Verify no lint errors are introduced.
- Status: PLANNED
