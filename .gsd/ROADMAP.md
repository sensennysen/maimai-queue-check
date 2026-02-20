# ROADMAP: Most Played Refactor

## Phase 1: Planning & Setup
- Draft SPEC, ROADMAP, Implementation Plan
- Review Supabase schema and bookmarklet constraints

## Phase 2: Database Layer
- Create a SQL migration script for the new `most_played` table.
- Include a script to migrate existing `most_played` arrays from `user_profiles.maimai_best_scores` into the new table.
- Ensure proper RLS policies for `most_played` so users can update their own and anyone can view.
- Update `supabase.js` to handle saving and fetching `most_played` separately.

## Phase 3: Bookmarklet Update
- Implement difficulty loop in `bookmarklet.js` to fetch `musicMybest` for diffs 0-4.
- Collect all songs/count pairs from these pages into the final JSON output.
- Minify and aggressively optimize to stay under 2048 characters.

## Phase 4: Frontend Updates
- Modify `PublicProfilePage.jsx` to fetch `most_played` data independently.
- Update `MaimaiImportModal.jsx` to sort and keep Top 20 most played songs across all difficulties.
- Update UI cards to display difficulty colors/styles.

## Phase 5: Verification
- Test bookmarklet payload.
- Test DB migration safely.
- Test frontend rendering.
