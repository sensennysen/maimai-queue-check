---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Rating System Integration

## Objective
Build the UI and link logic for users to submit and view 1-5 star ratings for a song.

## Context
- `src/pages/SongDiscussionPage.jsx`
- `src/services/supabase/discussion.js`
- `@mantine/core` `Rating` component

## Tasks

<task type="auto">
  <name>Implement Rating UI Component</name>
  <files>
    src/pages/SongDiscussionPage.jsx
  </files>
  <action>
    Modify `src/pages/SongDiscussionPage.jsx` to implement the Rating section.
    1. Import the `<Rating>` component from `@mantine/core`.
    2. Import `useAuth` from `../hooks/useAuth`. Keep track of the current user using `const { user } = useAuth();`.
    3. Calculate the average rating from `discussionData.ratings`. Sum the ratings and divide by count (handle length 0).
    4. Find if the current user has already rated the song (search `discussionData.ratings` for `user_id === user?.id`).
    5. In the existing Rating placeholder section (`<Paper p="md" radius="md" withBorder>`):
       - If `user` is not logged in: Display the average rating using a read-only `<Rating value={averageRating} fractions={2} readOnly />` and show a text indicating they must log in to rate. Also show total count of ratings.
       - If `user` is logged in: Show their current rating using an interactive `<Rating>` component. When `onChange` fires, call `discussionService.upsertSongRating(id, user.id, newValue)`. Ensure there is a UI loading state while saving. If `newValue` is 0 (or null from clearing), it should call `discussionService.removeSongRating`.
       - Update the local `discussionData.ratings` state optimistically or by re-fetching so the UI updates immediately after a rating change.
    6. Ensure the UI clearly shows both the *Global Average* and *Your Rating* (if logged in).
  </action>
  <verify>Run ESLint `npx eslint src/pages/SongDiscussionPage.jsx` and review the logic for handling unauthenticated users safely.</verify>
  <done>The Rating placeholder is replaced with a functional component handling read/write of song ratings.</done>
</task>

## Success Criteria
- [ ] Users can see the average rating of a song.
- [ ] Logged in users can add/update their 1-5 star rating.
- [ ] The rating is persisted to the Supabase backend.
