# Feature Specification: Profile Page Performance Improvements

## 1. Goal
Address reports of stuttering and slow scrolling on the profile page, particularly on mid-tier mobile devices and low-end PCs, to ensure the best user experience.

## 2. Requirements
1. **O(1) Data Lookups**:
   - Eliminate O(N*M) song lookups during render cycles for Most Played, Favorites, and Playlists.
   - Utilize a mapped context containing `songMapById` and `songMapByTitle`.
   
2. **Prevent Unnecessary Re-renders**:
   - React components like `ScoreCard`, `FavoriteSongCard`, and `PlaylistStack` must be wrapped in `React.memo` to prevent re-rendering when parent state (like dragging states) change.
   - Separate heavy computations from hot paths (e.g., inside component `render`).

3. **Performance Best Practices**:
   - Follow Vercel React Best Practices, especially regarding memoization, dependency lifting, and minimizing effects.

## Status: FINALIZED
