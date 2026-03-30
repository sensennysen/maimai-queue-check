---
created: 2026-03-20T15:00:16.346Z
title: Implement optimistic UI for finishGame transition
area: ui
files:
  - src/hooks/useQueueActions.js
  - src/features/queue/components/QueueManager.jsx
---

## Problem

"Finishing a game" currently has high perceived latency because the UI blocks (via `setIsMutating(true)`) and waits for the database round-trip plus a full data refresh. While the database update is atomic (using the `finish_game` RPC), the frontend experience feels slow, especially on mobile or higher latency connections.

## Solution

Implement optimistic UI updates in `useQueueActions.js` for the `endGame` (and `startNextGame`) functions:
1. Remove the blocking `setIsMutating(true)` call.
2. Optimistically update the `setQueue` state by moving the 'playing' item to 'completed' and the first 'waiting' item to 'playing' locally.
3. Handle potential errors by reverting to the server state via `refreshData()`.
4. This will provide immediate visual feedback while the atomic RPC completes in the background.
