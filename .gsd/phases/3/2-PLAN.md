---
phase: 3
plan: 2
wave: 2
---

# Plan 3.2: Tagging System Integration

## Objective
Build the UI and link logic for users to view and add tags to a song.

## Context
- `src/pages/SongDiscussionPage.jsx`
- `src/services/supabase/discussion.js`
- `@mantine/core` `MultiSelect`, `Badge`, `Pill`, or similar tagging components.

## Tasks

<task type="auto">
  <name>Implement Tagging UI Component</name>
  <files>
    src/pages/SongDiscussionPage.jsx
  </files>
  <action>
    Modify `src/pages/SongDiscussionPage.jsx` to implement the Tags section.
    1. Import `MultiSelect` or similar combobox elements from Mantine. Import `useAuth`.
    2. Add local state to hold available dictionary tags: `const [availableTags, setAvailableTags] = useState([])`.
    3. Modify the data-fetching `useEffect` to also fetch available tags using `discussionService.getAvailableTags()` and set them in state.
    4. Prepare the existing song tags for display: aggregate `discussionData.tags` to count occurrences and list the unique tags applied. (e.g., `Funny (3)`, `Hard (1)`). Sort by occurrence count descending.
    5. In the existing Tags placeholder section (`<Paper p="md" radius="md" withBorder>`):
       - Render the aggregated tags as `<Badge>` elements.
       - Below the badges, if `user` is not logged in, display a message "Log in to add tags".
       - If `user` is logged in, show an "Add Tag" UI. A simple `<MultiSelect>` or a text input + button combo (`<Group> <TextInput .../><Button>Add</Button> </Group>`) or `<TagsInput>` from Mantine.
       - A user can select from existing dictionary tags, or type a custom tag.
    6. Implement `handleAddTag(tagName)`:
       - Check if tag exists in `availableTags`. If not, call `discussionService.addCustomTag(tagName)` to create it in the dictionary.
       - Call `discussionService.addSongTag(songId, tagId, user.id)`.
       - Catch errors, particularly around users adding duplicate tags (Supabase will throw a constraint error, catch it and show a smooth notification "You already tagged this song").
       - Re-fetch `discussionData.tags` or push directly to state to update UI immediately.
       - Use Mantine `notifications.show` on success/error.
  </action>
  <verify>Run ESLint `npx eslint src/pages/SongDiscussionPage.jsx` and review the UX flow for adding tags.</verify>
  <done>The Tags placeholder is replaced with a functional component handling read/write of song tags, including resolving custom tag additions.</done>
</task>

## Success Criteria
- [ ] Users see existing tags aggregated by popularity/count.
- [ ] Logged in users can assign an existing tag to the song.
- [ ] Logged in users can create a new custom tag and assign it simultaneously.
- [ ] Tag submissions are persisted to the database.
