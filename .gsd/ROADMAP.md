# ROADMAP: Profile Page Performance Improvements

## Phase 1: Planning & Setup
- Draft SPEC, ROADMAP, Implementation Plan
- Identify performance bottlenecks in Profile Page and related components (Status: Done)

## Phase 2: Context Optimization
- Update `SongDatabaseContext` to provide O(1) Map lookups for songs by Title and ID.

## Phase 3: Component Re-render Optimization
- Wrap `ScoreCard`, `FavoriteSongCard`, and `PlaylistStack` in `React.memo`.

## Phase 4: Data Fetching Optimization
- Update `PublicProfilePage.jsx` to use O(1) lookup for Most Played.
- Update `FavoriteSongsSection.jsx` to use O(1) lookup for Favorites.
- Update `PlaylistSection.jsx` to memoize the mapped playlist songs array.

## Phase 5: Verification
- Verify build completeness.
- Check React DevTools Profiler or perform manual scrolled testing to ensure smooth experience.
