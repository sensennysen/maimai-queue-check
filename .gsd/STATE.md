# State Snapshot - v1.7.0 Changelog Finalized

**Objective:** Finalize the changelog for version 1.7.0 with community credits and detailed feature descriptions.

**Changes:**
- **Changelog UI**: Added v1.7.0 to `src/data/changelog.js`.
- **Feature Highlights**:
    - **User Profile**: Linked profile sharing, favorites, and Best 50 (Credits: albinokoi).
    - **Queue Rules**: Custom rules for branch admins (Credits: UPTC maimai community).
    - **Song Database**: SEARCH/FAV/PLAYLIST integration (Credits: zetaraku).
    - **Privacy**: RA 10173 compliance.
    - **Redesign**: Consistent header aesthetics across database and profile.

**Files Touched:**
- `src/data/changelog.js`

**Verification:**
- User-approved final content.
- `npm run lint` verified.

# State Snapshot - Privacy Policy Update (RA 10173)

**Objective:** Update the site's privacy policy to comply with Philippines Data Privacy Laws (RA 10173).

**Changes:**
- **Comprehensive Policy Content**: Rewrote `PrivacyModal.jsx` to include legally required disclosures.
- **Data Categories**: Disclosed collection of Account Data (Auth), Profile Data (voluntary), and Usage Data (service-specific).
- **Purpose Disclosure**: Clarified that data is used for service delivery and anonymous analytics only.
- **User Rights**: Included explicit mention of rights under RA 10173 (Access, Correction, Erasure).
- **Service Disclosure**: Disclosed use of Supabase and Vercel services.

**Files Touched:**
- `src/components/modals/PrivacyModal.jsx`

**Verification:**
- Code-level verification confirms correct React/Mantine implementation.
- Content verified against Philippines Data Privacy Act requirements.

# State Snapshot - Song Database Header Redesign

**Objective:** Redesign the song database header to match the profile page's premium aesthetic and structure.

**Changes:**
- **Redesigned Header Card**: Replaced the custom hologram Box with a standard `Paper` component (shadow, border, radius) for consistency with profile sections.
- **Avatar Integration**: Added a circular `Avatar` with a music icon to the header.
- **Navigation Refactor**: Moved the "Back to queue" button above the header card, following the navigation pattern of the public profile page.
- **Responsive Layout**: Optimized the header for both mobile and desktop, ensuring the `ThemeToggle` is appropriately placed.

**Files Touched:**
- `src/features/songs/components/SongDatabase.jsx`

**Verification:**
- Verified with `npm run lint` (Exit code 0 after fixing unused variables).
- Manual verification of layout behavior across breakpoints.

# State Snapshot - Query and View Page Optimizations

**Objective:** Optimize Supabase queries and the View Page to reduce data transfer and eliminate background fetching of the song database.

**Changes:**
- **Lazy Song Database Loading**: Refactored `SongDatabaseContext.jsx` and `useSongDatabaseContext.js` to implement request-based lazy loading. The maimai song database is now only fetched when a component actually uses the context.
- **Supabase Service Optimizations**: 
    - Updated `queueService.getQueueEntries` to select only essential fields.
    - Added `requestService.hasPendingRequest` for efficient, limit-1 existence checks.
    - Optimized `getCompletedEntriesForToday` to fetch only player names for suggestions.
- **QueueManager Refactor**: Replaced inefficient `getUserRequests` call with the targeted `hasPendingRequest` check.
- **Admin UX**: Optimized `contactService.getReports` to exclude heavy fields in list view.

**Files Touched:**
- `src/services/supabase.js`
- `src/features/queue/components/QueueManager.jsx`
- `src/contexts/SongDatabaseContext.jsx`
- `src/hooks/useSongDatabaseContext.js`

**Verification:**
- `npm run lint` passed (Exit code 0).
- Verified that `/view` page and main queue page no longer trigger background song database fetches.
- Verified that autocomplete suggestions and queue timers remain functional.

# State Snapshot - Song Database Error Handling and Context Refactor

**Objective:** Use the unused `error` field in `useSongDatabase` and refactor `SongDatabaseContext` to resolve Fast Refresh lint errors.

**Changes:**
- **Refactored SongDatabaseContext**: Split the context definition, provider, and hook into separate files (`SongDatabaseContextDef.js`, `SongDatabaseContext.jsx`, `useSongDatabaseContext.js`) to follow project patterns and fix `react-refresh/only-export-components` lint error.
- **Hook Update**: Updated `useSongDatabase.js` to return the `error` field from the new `useSongDatabaseContext` hook.
- **Component Destructuring**: Updated `SongSelectionModal.jsx` and `SongDatabase.jsx` to destructure and use the `error` state.
- **Error UI**: Updated `SongList.jsx` to display a user-friendly error message when a database error occurs.
- **Import Sync**: Updated all imports of `useSongDatabaseContext` to point to the new location.

**Files Touched:**
- `src/contexts/SongDatabaseContextDef.js` [NEW]
- `src/hooks/useSongDatabaseContext.js` [NEW]
- `src/contexts/SongDatabaseContext.jsx` [MODIFY]
- `src/hooks/useSongDatabase.js` [MODIFY]
- `src/features/songs/components/SongSelectionModal.jsx` [MODIFY]
- `src/features/songs/components/SongDatabase.jsx` [MODIFY]
- `src/features/songs/components/SongList.jsx` [MODIFY]
- `src/components/profile/PlaylistSection.jsx` [MODIFY]
- `src/components/profile/FavoriteSongsSection.jsx` [MODIFY]

**Verification:**
- Full `npm run lint` check confirms the `SongDatabaseContext.jsx` error is resolved.
- Targeted ESLint check on all modified files passed (Exit code 0).
- Verified error state propagation from context to UI.

# State Snapshot - Song Database Error Handling implemented

**Objective:** Use the unused `error` field in `useSongDatabase` and implement error UI in consuming components.

**Changes:**
- **Hook Update**: Updated `useSongDatabase.js` to return the `error` field from `SongDatabaseContext`.
- **Component Destructuring**: Updated `SongSelectionModal.jsx` and `SongDatabase.jsx` to destructure and use the `error` state.
- **Error UI**: Updated `SongList.jsx` to display a user-friendly error message when a database error occurs.

**Files Touched:**
- `src/hooks/useSongDatabase.js`
- `src/features/songs/components/SongSelectionModal.jsx`
- `src/features/songs/components/SongDatabase.jsx`
- `src/features/songs/components/SongList.jsx`

**Verification:**
- Targeted ESLint check on all modified files passed (Exit code 0).
- Verified error state propagation from context to UI.

# State Snapshot - Best 50 Visibility and Data Management

**Objective:** Enhance Best 50 visibility on profile pages, implement data removal, and refine privacy overrides for owners.

**Changes:**
- **Best 50 Visibility**: Modified `PublicProfilePage.jsx` to show the "Best 50" section even when empty, providing an "Import" button for the owner.
- **Data Removal**: 
    - Added `clearMaimaiData` to `userService` in `supabase.js` to reset score data, maimai DX name, and profile photo.
    - Added a "Clear Data" button with confirmation logic to the profile page.
- **Privacy Overrides**: Updated `PublicProfilePage.jsx` to bypass privacy toggles when the owner is viewing their own profile, ensuring they can always manage their information.
- **UX Refinement**: 
    - Added specific alerts for missing "New" vs "Old" scores within the Best 50 section.
    - Hidden the "Export Image" button when no best score data exists.
    - Adjusted layout spacing (gap and divider margins) in profile sections.

**Files Touched:**
- `src/pages/PublicProfilePage.jsx`
- `src/services/supabase.js`
- `src/components/profile/FavoriteSongsSection.jsx`
- `src/components/profile/PlaylistSection.jsx`

**Verification:**
- Verified with ESLint on modified files.
- Confirmed owner-only visibility logic for management buttons and privacy toggles.

**Next Wave TODO:**
- Implement 60-day cooldown visual countdown in the Slug settings.
- Add error boundaries to the Profile sections for more robust fault tolerance.

# State Snapshot - User Profile Creation Fixed

**Objective:** Fix missing user_profiles entries upon signup and implement random slug generation.

**Changes:**
- **Trigger Fix**: Updated `handle_new_user()` trigger function in Supabase to insert into both `user_profiles` and `user_roles`.
- **Slug Generation**: Added `generate_unique_slug()` Postgres function to automatically assign random 8-character slugs on signup.
- **Backfill**: Synchronized 100% of existing users (52 records) to have matching profiles and slugs.

**Files Touched:**
- `supabase/migrations` (Applied via SQL Editor)

**Verification:**
- Verified 52/52 count synchronization between `auth.users` and `user_profiles`.
- Confirmed trigger success on latest signup (`dev.bille.lagarde@gmail.com`).

