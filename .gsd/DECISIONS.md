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
