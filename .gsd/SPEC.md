# Feature Specification: Most Played Refactor

## 1. Goal
Modify the "Most Played" scraping strategy to fetch Top played songs per difficulty (0-4) instead of digging into individual song details. The scraper will combine these results, and the application will store the Top 20 overall records in the `most_played` table.

## 2. Requirements
1. **Bookmarklet Scraper Update**:
   - Iterate through difficulties 0 to 4 (Basic to Re:Master).
   - Fetch URL: `https://maimaidx-eng.com/maimai-mobile/record/musicMybest/search/?diff=[0-4]`
   - Collect all songs and their play counts from each page.
   - Output JSON payload with the new `most_played` structure: `[{ title, difficulty, play_count, type, ... }]`.
   - Keep bookmarklet within 2048 characters minified constraint.

2. **Storage Logic Update**:
   - In `MaimaiImportModal.jsx`, sort the incoming `most_played` list by `play_count` descending.
   - Retain only the Top 20 items for database storage. 
   - Store results in the `most_played` table.

2. **Database Migration**:
   - Create a new table `most_played`.
   - Columns: `id` (uuid, primary key), `user_id` (uuid, FK to auth.users), `data` (jsonb, stores the array of most played songs), `created_at` (timestamptz), `updated_at` (timestamptz).
   - Data cleanup: Remove the `most_played` key from the existing `maimai_best_scores` JSONB column in the `user_profiles` table, leaving only the "best scores" (best_new, best_old, total_play_count, etc.) there. Backfill existing `most_played` data into the new table.

3. **Frontend Changes**:
   - Update `PublicProfilePage.jsx` and other relevant components to read the most played data from the new `most_played` table rather than `user_profiles.maimai_best_scores`.
   - Since `most_played` will now include specific difficulties, update the UI cards to display the difficulty styling (maybe border or badge) and the specific play count.

## Status: FINALIZED
