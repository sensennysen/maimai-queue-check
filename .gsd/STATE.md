# Project State

## Session: Best 50 Calculation Update
**Date**: 2026-02-20
**Mode**: Feature/Refactor

### Changes
- Updated `src/utils/maimai-calc.js`:
  - Modified `processScore` to check for `sheet.regionOverrides.intl.version`.
  - Uses the overridden version for "New" vs "Old" categorization if available.
- Updated `src/hooks/useMouseDragScroll.js`:
  - Removed unused `eslint-disable` directive.

### Verification
- Verified logic with `scripts/test-best50.mjs` (PASSED).
- Lint check passed.

## Session: Profile Slug Limit
**Date**: 2026-02-20
**Mode**: Feature

### Changes
- Updated `src/components/profile/ProfileSettingsModal.jsx`:
  - Added `maxLength={20}` to slug input field.

### Verification
- Manual verification confirmed input stops at 20 characters.

### Next Steps
- None.
