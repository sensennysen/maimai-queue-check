## Wave 11 Summary

**Objective:** Enhance Profile Features: Favorite Song Comment Editing, Playlist Multi-select, and UI/UX Refinements.

**Changes:**
- **Favorite Songs**: Added `updateFavoriteComment` to `favoritesService`. Updated `MaimaiSongDetailModal` with edit mode and `FavoriteSongsSection` with optimistic updates.
- **Playlist Multi-select**: Implemented unified selection where already-added songs are part of the active picker set, allowing them to be unselected centrally.
- **Clear Actions**: Added "Clear Selection" in the song picker (resets all) and "Clear All" in the playlist editor.
- **UI/UX Refinements**: Moved hover animations in `SongCard` to Mantine styles to prevent clobbering selection states. Switched to `outline` with negative `-3px` offset for highlights to ensure visibility and prevent clipping.
- **State Management**: Used React `key` prop on the selection modal to ensure automatic state reset (filters/pagination) on every open. Fixes horizontal stretching on mobile via stricter CSS width constraints.

**Files Touched:**
- `src/services/supabase.js`
- `src/components/profile/MaimaiSongDetailModal.jsx`
- `src/components/profile/FavoriteSongsSection.jsx`
- `src/features/songs/components/SongList.jsx`
- `src/features/songs/components/SongSelectionModal.jsx`
- `src/components/profile/PlaylistEditModal.jsx`
- `src/pages/PublicProfilePage.jsx`
- `src/features/songs/components/SongCard.jsx`
- `src/features/songs/components/SongFilters.jsx`

**Verification:**
- `npm run lint`: 0 errors.
- Manual verification of highlights, animations, and "Clear" button functionality.

---

## Wave 10 Summary

**Objective:** Implement Profile Picture Feature with custom uploads, cropping, and fallback logic.

**Changes:**
- **Database Migration**: Renamed `display_photo_url` to `dx_display_photo_url` and added a new `display_photo_url` for custom uploads in `user_profiles`.
- **Storage & Cleanup**: Created `profile-pictures` bucket with RLS. Implemented automatic file deletion in `userService` during removal or replacement to prevent storage bloat.
- **Service Layer**: Added `uploadProfilePicture`, `deleteProfilePictureFile`, and `extractStoragePath` to `userService`.
- **Cropping UI**: Integrated `react-easy-crop` with a 20MB limit and no resolution restriction, allowing users to reposition and zoom their icons.
- **UI Integration**: Updated `PublicProfilePage`, `LoginForm`, and `MaimaiImportModal` to prioritize custom photos over game-imported icons.

**Files Touched:**
- `src/services/supabase.js`
- `src/components/profile/ProfilePictureUploadModal.jsx` (NEW)
- `src/pages/PublicProfilePage.jsx`
- `src/components/LoginForm.jsx`
- `src/components/profile/MaimaiImportModal.jsx`
- `package.json`

**Verification:**
- `npm run dev`: Verified UI, upload, and cropping functionality.
- Manual storage verification: confirmed files are deleted from bucket on removal.

---

## Wave 9 Summary

**Objective:** Fix "Remaster" tag color in Best 50 and centralize difficulty normalization.

**Changes:**
- **Normalization Helper**: Added `normalizeDifficulty` to `maimai-constants.js` to canonicalize difficulty strings (e.g., "Remaster" -> "Re:Master").
- **UI Consistency**: Updated `ScoreCard`, `MaimaiSongDetailModal`, `SongCard`, and `SongDetailModal` to use the centralized helper. This ensures correct purple styling for Re:Master tags in the Best 50 section.

**Files Touched:**
- `src/config/maimai-constants.js`
- `src/components/maimai/ScoreCard.jsx`
- `src/components/profile/MaimaiSongDetailModal.jsx`
- `src/features/songs/components/SongCard.jsx`
- `src/features/songs/components/SongDetailModal.jsx`

**Verification:**
- `npm run lint`: 0 errors.

---

## Wave 8 Summary

**Objective:** Refine "Most Played" scraping, storage, and cross-schema data integrity.

**Changes:**
- **Revised Scraping**: Updated bookmarklet to iterate through all 5 difficulty levels on `musicMybest`.
- **Top 20 Retention**: Modified `MaimaiImportModal` to sort combined records and keep the Top 20 most played overall.
- **Table Rename**: Renamed `most_played` to `user_most_played_songs` for clarity and consistency.
- **Data Clearing**: Enhanced `clearMaimaiData` to delete from `user_most_played_songs` and `user_all_scores` in addition to profile fields. Added missing RLS `DELETE` policies.
- **FK Refactor**: Created migration to switch FKs of 6 tables (`user_roles`, `user_playlists`, etc.) from `auth.users` to `public.user_profiles` with `ON DELETE CASCADE`.

**Files Touched:**
- `src/assets/bookmarklet.js` & `public/bookmarklet.js` (Bookmarklet logic)
- `src/services/supabase.js` (Service layer & `clearMaimaiData`)
- `src/components/profile/MaimaiImportModal.jsx` (Import processing)
- `src/pages/PublicProfilePage.jsx` & `src/components/profile/MaimaiSongDetailModal.jsx` (UI updates)
- `supabase/migrations/20260220_most_played_table.sql` (Renamed table & policies)
- `supabase/migrations/20260221_refactor_fks.sql` (FK refactoring)

**Verification:**
- `npm run lint`: 0 errors.
- Manual verification of scraper output and DB migration success.

**Next Wave TODO:**
- Monitor for any edge cases in Top 20 sorting or FK cascading.

---

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
