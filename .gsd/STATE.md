# State Snapshot - Profile UI & Interactivity Polish

**Objective:** Enhance the user experience on the profile page with horizontal scrolling, drag-to-scroll interactivity, responsive score metrics, and unlimited favorites.

**Changes:**
- **Profile Layout**:
    - Moved Maimai DX name/rating to "Best 50" section.
    - Implemented responsive score summaries: desktop shows centralized totals; mobile shows totals per section.
- **Playlist UI**:
    - Enabled horizontal scrolling and drag-to-scroll (desktop) for playlists.
    - Moved "New Playlist" button to section header.
    - Relocated Delete button from Edit modal to Detail/View modal.
    - Reduced spacing and hidden scrollbars for a premium feel.
- **Favorite Songs**:
    - Removed the 5-song limit.
    - Enabled horizontal scrolling and drag-to-scroll.
- **Service Layer**: 
    - Fixed notification query by removing non-existent `user_id` column.
- **Interactivity**: 
    - Created `useMouseDragScroll` hook with `window` listeners and selection prevention.
    - Disabled image/ghost dragging on scrollable cards.

**Files Touched:**
- `src/services/supabase.js`
- `src/pages/ProfilePage.jsx`
- `src/components/profile/PlaylistSection.jsx`
- `src/components/profile/FavoriteSongsSection.jsx`
- `src/hooks/useMouseDragScroll.js`
- `src/components/profile/PlaylistDetailModal.jsx`
- `src/components/profile/PlaylistEditModal.jsx`
- `src/components/profile/PlaylistStack.jsx`
- `src/components/profile/FavoriteSongCard.jsx`
- `src/components/profile/PlaylistStack.css`

**Verification:**
- Verified drag-to-scroll on desktop across both sections.
- Verified responsive score visibility at 640px breakpoint.
- Verified unlimited favorites adding.
- Verified no selection/ghost dragging during scroll.

**Next Wave TODO:**
- Implement "View All" or pagination if favorites/playlists grow too large.
- Add visual feedback (e.g., arrow icons) for horizontal scrolling on desktop for better affordance.
