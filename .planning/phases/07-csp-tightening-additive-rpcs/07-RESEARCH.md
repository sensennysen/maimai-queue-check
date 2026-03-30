# Phase 07: CSP Tightening & Additive RPCs - Research

## Objective
investigate domain, patterns, and dependencies for Phase 07 (SEC-05, QUEUE-01).

## 1. CSP Tightening (SEC-05)
Current state: Several components inject style tags using `dangerouslySetInnerHTML` to handle media queries that Mantine's inline `style` prop cannot easily cover without a CSS-in-JS solution or separate CSS file.

### Findings
- **`src/features/songs/components/SongDatabase.jsx`**: Injects a style tag for `.song-db-grid` media query (lines 57-64).
- **`src/features/songs/components/SongSelectionModal.jsx`**: Injects a style tag for `.song-modal-grid` media query (lines 89-96).
- **Other uses of `dangerouslySetInnerHTML`**:
  - `QueueRulesModal.jsx`: Used for sanitized user content (HTML rules). Not a CSP tightening target for styles.
  - `IntroductionCard.jsx`: Used for sanitized user profile introductions. Not a CSP tightening target for styles.

### Strategy
- Use Mantine's `createStyles` (if using v5) or move to a separate CSS file (`SongDatabase.css`, `SongSelectionModal.css`).
- Given the current project uses vanilla CSS and Mantine, a CSS module or a simple `.css` file for these specific layout overrides is cleanest.

## 2. Additive RPC for finishGame (QUEUE-01)
Current state: `queueService.finishGame` (in `src/services/supabase/queue.js`) performs two separate SQL updates via the Supabase client. This is not atomic and can lead to race conditions where the queue "stalls" if the second request fails.

### Current Logic
1. Update `currentPlayingId` -> `status = 'completed'`, `ended_at = NOW()`.
2. Update `nextWaitingId` -> `status = 'playing'`, `started_at = NOW()`.

### Strategy
- **New RPC**: `finish_game(p_current_playing_id UUID, p_next_waiting_id UUID)`.
- **Benefits**: Atomic execution, reduced network round-trips, better data integrity.
- **Rollout**: Add the RPC to the database first (additive). Update `queueService` to use `rpc('finish_game', ...)` if available, or keep sequential calls as fallback if we want strict non-breaking.

## Verification Architecture
- **SEC-05**: Inspect browser console for CSP violations (if CSP is set up to block inline styles). Check that media queries still function correctly in the UI.
- **QUEUE-01**: Run a test sequence that triggers `finishGame` and verify both entries update correctly in one transaction.

---
*Phase: 07-csp-tightening-additive-rpcs*
*Research completed: 2026-03-20*
