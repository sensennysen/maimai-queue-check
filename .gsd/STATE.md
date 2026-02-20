## Wave 7 Summary

**Objective:** Implement SPEC-005: Simplify Mobile Bookmarklet

**Changes:**
- Extracted the massive 4,000+ character scraping logic from `BookmarkletInstructions.jsx`.
- Relocated the minified script to `public/bookmarklet.js` to be served statically.
- Replaced the embedded script in the UI with a tiny loader (`javascript:!function(){...}()`) that dynamically fetches and executes `bookmarklet.js` from `window.location.origin`.

**Files Touched:**
- `public/bookmarklet.js` (Created)
- `src/components/BookmarkletInstructions.jsx` (Modified)
- `.gsd/SPEC.md`
- `.gsd/ROADMAP.md`

**Verification:**
- `npm run lint`: 0 errors.
- `npm run build`: Success.
- The new loader is 158 characters long, well below the 2048 mobile browser limit.

**Risks/Debt:**
- The `bookmarklet.js` in the `public` folder bypasses Vite transpilation and linting (has an `eslint-disable` directive), but it is a static standalone script anyway.

**Next Wave TODO:**
- Ready for next feature request.
