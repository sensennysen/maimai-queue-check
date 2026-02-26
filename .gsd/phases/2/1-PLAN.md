---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Route & Component Boilerplate

## Objective
Add the new route for the Song Discussion page and link to it from the existing track details modal.

## Context
- src/App.jsx
- src/components/songs/MaimaiSongDetailModal.jsx

## Tasks

<task type="auto">
  <name>Add Song Discussion Route</name>
  <files>
    src/App.jsx
    src/components/songs/MaimaiSongDetailModal.jsx
  </files>
  <action>
    1. In `src/App.jsx`, add a lazy import for `SongDiscussionPage`: `const SongDiscussionPage = lazy(() => import('./pages/SongDiscussionPage'));`
    2. Add the route `<Route path="/songs/:id" element={<SongDiscussionPage />} />` inside the `<Routes>` block in `AppProviders`.
    3. In `src/components/songs/MaimaiSongDetailModal.jsx`, add a button labelled "Discuss this Song" (e.g., using a `<Button component={Link} to={\`/songs/\${song.songId}\`}>` or similar, make sure to import `Link` from `react-router-dom`). Place this button inside the modal's footer or right below the song details, ensuring it is visible to both logged-in and public users.
  </action>
  <verify>Check `App.jsx` and `MaimaiSongDetailModal.jsx` for syntax errors using `npx eslint src/App.jsx src/components/songs/MaimaiSongDetailModal.jsx`.</verify>
  <done>The route is correctly mapped and accessible from the song detail modal.</done>
</task>

## Success Criteria
- [ ] Route `/songs/:id` is registered in `App.jsx`.
- [ ] Modal includes a visible button that links to the new route.
