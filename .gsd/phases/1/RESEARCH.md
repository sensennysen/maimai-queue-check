---
phase: 1
level: 2
researched_at: 2026-02-27
---

# Phase 1 Research

## Questions Investigated
1. SQL schema for tags, ratings, and comments.
2. How to implement the upvote/downvote system for comments?
3. How to implement "predefined tags + custom tags"?
4. RLS policies and user identity.

## Findings

### Topic: SQL Schema & User Identity
The `user_profiles` table contains `display_name` and points to the `auth.users` via the `id` column. We can use relational joins in Supabase queries to retrieve the display name for any activity. `song_id` refers to the `songId` in `otoge_db.json`, which is a `text` field.

**Recommendation:** Create individual tables linking `song_id` (text) and `user_id` (uuid referencing `user_profiles.id`).

### Topic: Upvote/Downvote System
To support upvotes and downvotes on comments, a separate mapping table is the most standard approach. It ensures a single user can only have one active vote on a comment at a time and avoids concurrency issues with array fields.

**Recommendation:** Create a `song_comment_votes` table with a composite primary key `(comment_id, user_id)` and a `vote_type` column (+1 for upvote, -1 for downvote).

### Topic: Predefined vs Custom Tags
To support both predefined system tags and user-generated custom tags, we should decouple the tag definitions from the tag assignments.

**Recommendation:**
1. `song_tags_dictionary` table to hold unique tag names (`id`, `name`, `is_predefined`).
2. `song_tags` table to map tags to songs with attribution (`song_id`, `tag_id`, `user_id`). This allows tracking *who* applied which tag to which song, and prevents a user from applying the same tag multiple times.

### Topic: RLS Policies
All new tables will need Row Level Security.
- **Read**: `SELECT` should be public or authenticated-only depending on privacy needs (public makes sense for a Song DB).
- **Write**: Users can only `INSERT`/`UPDATE`/`DELETE` where `user_id = auth.uid()`.

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Comment Voting | Separate `song_comment_votes` table | Enables constraints (1 vote per user) and easy aggregation without concurrency issues. |
| Tag Structure | Dictionary + Mapping table | Cleanly separates allowed tag values (with a flag for predefined) from the instances of users adding those tags to specific songs. |

## Patterns to Follow
- Link to `user_profiles(id)` instead of `auth.users` for foreign keys, to keep RI at the public schema level when querying for display names.

## Draft Schema Overview
- `song_comments`: id, song_id, user_id, content, created_at, updated_at
- `song_comment_votes`: comment_id, user_id, vote_type (smallint)
- `song_ratings`: song_id, user_id, rating (smallint 1-5), created_at
- `song_tags_dictionary`: id, name, is_predefined, created_by
- `song_tags`: song_id, tag_id, user_id, created_at

## Ready for Planning
- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
