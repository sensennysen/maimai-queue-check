---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Database Foundation

## Objective
Design and implement Supabase tables for tags, ratings, and comments, including RLS policies.

## Context
- .planning/ROADMAP.md
- .gsd/phases/1/RESEARCH.md
- supabase/migrations

## Tasks

<task type="auto">
  <name>Create Database Migration</name>
  <files>supabase/migrations/</files>
  <action>
    Create a new migration file using Supabase CLI or manually creating the `{timestamp}_song_discussion_tables.sql` file to create the following tables:
    - `song_tags_dictionary` (id, name, is_predefined, created_by)
    - `song_tags` (song_id, tag_id, user_id, created_at)
    - `song_ratings` (song_id, user_id, rating, created_at)
    - `song_comments` (id, song_id, user_id, content, created_at, updated_at)
    - `song_comment_votes` (comment_id, user_id, vote_type)
    
    Add foreign key constraint from `user_id` to `user_profiles(id)`.
    Define RLS policies for each table so that anyone can SELECT, but only authenticated users can insert/update/delete their own rows. `song_tags_dictionary` allows insertion by authenticated users, but updates only for own custom tags.
  </action>
  <verify>Run the migration locally using `npx supabase db reset` or `supabase db push` or by using the `@supabase-mcp-server apply_migration` tool to verify syntax.</verify>
  <done>Tables are created and RLS policies are applied successfully without errors.</done>
</task>

## Success Criteria
- [ ] Migration applies successfully
- [ ] Tables exist with correct schemas
- [ ] RLS policies prevent unauthorized mutations
