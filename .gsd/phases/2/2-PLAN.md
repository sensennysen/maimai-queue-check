---
phase: 2
plan: 2
wave: 2
---

# Plan 2.2: Basic Discussion Page Layout

## Objective
Implement `SongDiscussionPage.jsx` which fetches and displays the song's basic metadata alongside placeholders for discussion features.

## Context
- src/App.jsx
- src/services/supabase/discussion.js
- src/contexts/SongDatabaseContext.jsx
- src/components/songs/MaimaiSongDetailModal.jsx (for reference on displaying song images/details)

## Tasks

<task type="auto">
  <name>Implement SongDiscussionPage Component</name>
  <files>
    src/pages/SongDiscussionPage.jsx
  </files>
  <action>
    Create `src/pages/SongDiscussionPage.jsx`.
    1. Import `useParams`, `Link`, and `Navigate` from `react-router-dom`.
    2. Import `useSongDatabase` from `../hooks/useSongDatabase` (not directly from context file).
    3. Import `discussionService` from `../services/supabase`.
    4. Call `requestFetch()` from `useSongDatabase()` if songs are not loaded.
    5. Fetch the song using `songMapById.get(id)`. If `loading` is true, show a Mantine `<Loader />` or `<Skeleton />`. If the song is not found and loading is false, show a "Song Not Found" message or `<Navigate to="/songs" />`.
    6. Fetch `discussionData` using `discussionService.getSongDiscussionData(id)` inside a `useEffect` and store it in state (`{ ratings: [], comments: [], tags: [] }`). Handle loading states for this specific fetch too.
    7. Layout the page:
       - Header: Display `title`, `artist`, `version`, `category`, and `bpm`, utilizing existing UI patterns (like `Badge` components for category/version, similar to `MaimaiSongDetailModal`).
       - Image: Render the song jacket from Supabase storage using `import.meta.env.VITE_SONG_JACKETS_URL + song.imageName`.
       - Sections: Render empty/placeholder `<Paper>` components for "Tags", "Rating", and "Comments". For now, you can just dump `JSON.stringify(discussionData)` inside them to prove the data is loading.
       - Back Button: Add a top-level `<Button component={Link} to="/songs" variant="subtle" leftSection={<IconArrowLeft />}>Back to Songs</Button>` to provide easy navigation out. (Import `IconArrowLeft` from `@tabler/icons-react`).
  </action>
  <verify>Run ESLint: `npx eslint src/pages/SongDiscussionPage.jsx`</verify>
  <done>The new page component exists and fetches both the static song info and the dynamic discussion data from Supabase.</done>
</task>

## Success Criteria
- [ ] `SongDiscussionPage.jsx` is created.
- [ ] Navigating to `/songs/:id` properly renders the song details without crashing.
- [ ] The network tab shows a fetch to `discussionService.getSongDiscussionData`.
