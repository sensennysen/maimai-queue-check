---
phase: 1
plan: 2
wave: 2
---

# Plan 1.2: Service Layer APIs

## Objective
Update the JavaScript service layer to interact with the new Song Discussion tables.

## Context
- .gsd/phases/1/RESEARCH.md
- src/services/supabase/

## Tasks

<task type="auto">
  <name>Create Discussion Service</name>
  <files>
    src/services/supabase/discussion.js
    src/services/supabase/index.js
  </files>
  <action>
    Create `discussionService` exported from `src/services/supabase/discussion.js` with methods:
    - `getSongDiscussionData(songId)`: fetches comments, ratings, and tags for a song, joining with `user_profiles` for display names. Use `.select(..., user_profiles(display_name))`.
    - `addCustomTag(name)`: inserts into dictionary if doesn't exist and returns the tag id.
    - `addSongTag(songId, tagId, userId)`: inserts a new tag assignment.
    - `upsertSongRating(songId, userId, rating)`: upserts a 1-5 rating.
    - `addComment(songId, userId, content)`: inserts a new comment.
    - `voteComment(commentId, userId, voteType)`: upserts an upvote (+1) or downvote (-1) or removes the vote (0).
    
    Export `discussionService` from `src/services/supabase/index.js` so it can be imported cleanly.
  </action>
  <verify>Review the code for correct table names and Supabase select/insert formats.</verify>
  <done>Service layer has fully implemented methods for all CRUD operations on the discussion data.</done>
</task>

## Success Criteria
- [ ] Service methods exist for tags, ratings, and comments.
- [ ] Methods correctly join `user_profiles` to retrieve user display names.
