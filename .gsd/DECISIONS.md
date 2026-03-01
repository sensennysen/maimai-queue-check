# Decisions Log

## Phase 1 Decisions

**Date:** 2026-02-27

### Scope
- **Tags**: Predefined tags provided, but users can add custom ones.
- **Ratings**: 1 per user per song, updated if changed.
- **Comments**: Users can upvote/downvote. Basic CRUD initially, with moderation tools (reporting, deleting/hiding) planned for the future.

### Approach
- **Chose**: Option A (Individual Tables for tags, ratings, comments).
- **Reason**: Easier query management. The unified activity feed might be considered in the future, but individual tables are simpler for the initial implementation.

### Constraints
- Users are identified by their `display_name`.

---

## Phase 5 Decisions

**Date:** 2026-03-01

### Scope
- Store only `circle_name` per user — no points, no member list.
- Full member leaderboard is explicitly out of scope for Milestone 2.

### Approach
- Chose: **Option A** — extend `user_profiles` with a single `circle_name TEXT` column.
- Reason: One scalar value per user makes a dedicated table unnecessary. No joins, consistent with how all other per-user data is stored.

### Constraints
- Bookmarklet scrapes circle name and adds it to the payload; edge function upserts it to `user_profiles`.
- RLS follows existing `is_public` pattern: `circle_name` visible on public profiles, hidden on private ones.
