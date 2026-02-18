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

### 2026-02-18: Song Database Visual & Interaction Refinements
- **Status**: Released
- **Phase**: Done

**Summary of Changes**:
1.  **Grid Layout**: Optimized song list to display 25 items per page.
2.  **Interactions**: Added touch-responsive click animation to song cards. Implemented explicit "click title to copy" functionality in the modal.
3.  **Modal Visuals**: Enlarged song jacket for better visibility. Reorganized metadata into a centered 2-column grid layout to minimize whitespace and improve balance.
4.  **Verification**: Validated by user feedback and iteration.

