# Endless Feed Execution Plan

## Scope
- Convert community feed to endless scrolling.
- Merge public posts and followed-account posts, with soft priority for followed authors.
- Replace suggested players list with an in-feed carousel of random 5 players.
- Rename "Active Song Discussions" to "Recent Song Discussions".
- Desktop: move `New Songs`, `Recent Song Discussions`, and `Community Playlists` into right rail.
- Mobile: render these modules in-feed between post groups.

## Decisions
- Priority model: soft-score recency (followed-author boost, still time-aware).
- Suggested players frequency: every 4 posts.

## Task Checklist
- [x] Add paginated feed-post API support.
- [x] Refactor `useFeedData` for endless merged post stream.
- [x] Add in-feed suggested players carousel component.
- [x] Refactor `FeedPage` layout and endless scroll rendering.
- [x] Update responsive styles for desktop/mobile placement.
- [x] Run lint checks for changed files and fix regressions.

## Progress Log
- [x] Initial analysis complete; implementation plan committed to this file.
- [x] Added paginated feed API and preserved backward-compatible `getFeedPosts` wrapper.
- [x] Added endless feed state (`hasMore`, `loadingMore`, `loadMore`) and followed-author priority scoring.
- [x] Implemented in-feed suggested players carousel (random 5) and module injection every 4 posts.
- [x] Renamed song discussions section to `Recent Song Discussions`.
- [x] Moved desktop right-rail modules (`New Songs`, `Recent Song Discussions`, `Community Playlists`), with mobile in-feed insertion.
- [x] Verified updated files with linter diagnostics and fixed minor follow-up issues.
- [x] Fixed endless-scroll flicker by stabilizing pagination offset flow and preventing reset reload loops.
- [x] Updated feed end-state copy to a friendlier catch-up message.
- [x] Increased right-module breathing room and visual separation on cards.
- [x] Removed sidebar background container styling and kept only module card surfaces.
- [x] Converted `Recent Song Discussions` and `Community Playlists` to horizontal carousels with desktop scroll.
- [x] Standardized suggested-player card dimensions to prevent overflow and hid follow label text on mobile.
- [x] Reworked post action row into evenly spaced `Comments / Like / Dislike` controls and relabeled comment action.
- [x] Added latest-comment preview on posts with comments.
- [x] Fixed desktop scroll behavior for `New Songs` and tuned uniform card sizing/alignment in discussion/playlists carousels.
- [x] Vertically centered suggested-player card content and corrected mobile follow button spacing.
- [x] Fixed desktop discussion-card overflow by constraining jacket size and text area in carousel items.
- [x] Reworked `Comments / Like / Dislike` row into visibly equal-width segmented controls.
- [x] Added dedicated mobile suggested-player card layout with icon-only follow action to prevent clipping.
- [x] Tightened post action icon-label spacing and moved latest-comment preview below actions.
- [x] Refactored suggested-player card with cleaner desktop/mobile layout constraints (safer tag truncation + compact mobile width).
- [x] Removed manual refresh buttons across feed modules and added pull-down-to-refresh interaction.
- [x] Updated suggested-player card to wrap branch badges onto additional lines and improve vertical alignment.
- [x] Removed uploaded-image outlines, enabled suggested-players carousel scrolling, and made desktop sidebar independently scrollable.
