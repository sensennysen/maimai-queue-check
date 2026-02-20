# SPEC-002: Best 50 Validation and Changelog Update

## Status: FINALIZED

## Problem Statement
The app needs to handle malformed/outdated "Best 50" data by prompting users to re-import their scores using the latest bookmarklet. Additionally, the changelog needs to be updated with the latest performance and feature improvements.

## Requirements
1.  **Best 50 Validation**:
    *   Detect "malformed" or "outdated" `maimai_best_scores` data.
    *   "Malformed" criteria: Missing `best_new`, `best_old`, or `songs` arrays.
    *   "Out of date" criteria: Missing `most_played` or `total_play_count` (introduced in Feb 20 update).
    *   Display Message: "Data and Bookmark is out of date. Please create a new bookmark from the Import message and reimport".
2.  **Changelog Update**:
    *   Update `src/data/changelog.js` with latest features from commit `c27d1d4`.
    *   Version: `v1.7.2`.
    *   Features: Most Played section, Best 50 calculation fix, Total Play Count.

## Success Criteria
- Users with legacy/malformed data see the warning message.
- The changelog correctly displays the new features and fixes.
