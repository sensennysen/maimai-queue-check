# Plan 3.1 Summary

**Objective**: Build the rating system UI and logic for users to leave 1-5 star song ratings.

## Execution Record
- Imported Mantine's `<Rating>` and the `useAuth` hook into `SongDiscussionPage.jsx`.
- Plumbed the global average rating calculation across all user ratings.
- Integrated the user's specific rating state with dynamic read/write binding to `discussionService.upsertSongRating` and `removeSongRating`.
- Reflected optimistic updates in the UI state immediately.
- Validated via ESLint and committed the results.

## Verification Results
- Component loads the average rating with fractions, and logs-in users can dynamically change their score without errors or required page reloads.
