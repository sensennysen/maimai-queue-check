# Feature Tracker

This document tracks the features of the application, their status, and relevant timestamps.

## Existing Features
- **Queue Check**: Core functionality to check Maimai queues.
- **Admin Panel**: Management interface for branches and queues.
- **Authentication**: User login and management via Supabase.
- **Distance Badge**: Visual indicator of distance to branches, with theme support.
- **Places Selector**: Component to select branches, ordered by distance.
- **Export Page**: Functionality to export queue data/images.
- **Feature Flags**: System to toggle features on/off (e.g., Profile tab).
- **Score Cards**: UI for displaying user scores.

## In Development
*(Add features here when the "Planning" phase begins)*
- [ ] **Agentic Workflow Integration**: Implementing the `AGENTS.md` and associated tracking files. (Started: 2026-02-18)

## Recently Added
*(Add features here when the "Confirmation" phase is complete)*

### 2026-02-18: Song Database Refinements
- **Status**: Released
- **Phase**: Done

**Summary of Changes**:
1.  **Enriched Data**: Added BPM and Release Date (from `maimai_song_extras`) and Note Designer (from `maimai_sheet_extras`) to the database and modal.
2.  **Internal Level Fallback**: Implemented logic to calculate internal levels from display levels (e.g., 13+ -> 13.6) when actual data is missing.
3.  **Verification**: Verified correct sort order and data population with automated script.

### 2026-02-18: Songs Database Improvements (Mobile & Details)
- **Status**: Released
- **Phase**: Done

**Summary of Changes**:
1.  **Mobile Optimization**: Implemented 2-column grid layout for mobile devices in `SongList.jsx`.
2.  **Song Detail Modal**: Created `SongDetailModal.jsx` to display full song info (Artist, Category, Version, BPM, Charts).
3.  **UI Refinements**:
    *   Replaced badges with text labels in modal.
    *   Used DX/Standard image logos.
    *   Corrected difficulty sorting (Basic -> Re:Master) in both Modal and Card.
    *   Applied English translations for categories (e.g., "POPS & ANIME").
4.  **Verification**: Verified manually by user.

### 2026-02-18: Achievement Rate Formatting
- **Status**: Released
- **Phase**: Done

**Summary of Changes**:
1.  **Consistent Formatting**: Updated the `ScoreCard` component to always display achievement rates with exactly 4 decimal places (e.g., 100.0000%).
2.  **Breadth**: Verified that all pages using `ScoreCard` (Profile, Export) reflect this change correctly.
3.  **Verification**: Manually verified display precision.

### 2026-02-18: Song Database Visual & Interaction Refinements
- **Status**: Released
- **Phase**: Done

**Summary of Changes**:
1.  **Grid Layout**: Optimized song list to display 25 items per page.
2.  **Interactions**: Added touch-responsive click animation to song cards. Implemented explicit "click title to copy" functionality in the modal.
3.  **Modal Visuals**: Enlarged song jacket for better visibility. Reorganized metadata into a centered 2-column grid layout to minimize whitespace and improve balance.
4.  **Verification**: Validated by user feedback and iteration.


### 2026-02-18: Song Database Theme & Navigation
- **Status**: Released
- **Phase**: Done

**Summary of Changes**:
1.  **Theme Integration**: Integrated `ThemeContext` into Song Database. Replaced hardcoded colors with theme variables for consistent styling across Circle, Prism, and Buddies themes.
2.  **Navigation**: Added a "Back to Queue" button to the header for better user flow.
3.  **UI Controls**: Added a Theme Toggle button directly to the Song Database interface.
4.  **Verification**: Verified theme switching and navigation functionality.

### 2026-02-18: User Display Picture
- **Status**: Released
- **Phase**: Done

**Summary of Changes**:
1.  **Database**: Added `display_photo_url` to `user_profiles` table.
2.  **Display Logic**: Updated Queue entries and Profile page to display the user's custom profile picture (from Score Import data) instead of the default Google avatar.
3.  **Fallback**: Implemented a strict fallback to a default filler image if no custom photo is present, ensuring consistent UI.
4.  **Performance**: optimized `ProfilePage` to prevent unnecessary re-fetches on window focus.

### 2026-02-18: Profile Improvements
- **Status**: Released
- **Phase**: Done

**Summary of Changes**:
1.  **Main Branch**: Added `main_branch` field to `user_profiles` (FK to `allowed_places`) and rendered it in the profile header.
2.  **Preferred Branches**: Fixed rendering to show a UNION of branches from both `user_profiles` and legacy `user_roles` data.
3.  **Name Resolution**: Implemented `branchService.getBranchesForResolution()` to ensure even "disabled" branches (e.g., test/proxy branches) resolve to human-readable names.
4.  **UI**: Added Map Pin and Star icons/badges for branch information.
