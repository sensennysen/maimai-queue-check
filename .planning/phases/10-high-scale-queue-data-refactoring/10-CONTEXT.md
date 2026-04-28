# Phase 10: High-Scale Queue Data Refactoring - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Decoupling realtime queue performance from total queue length by migrating from full-table refetches to incremental updates and batch RPCs, without breaking the live production build.

</domain>

<decisions>
## Implementation Decisions

### Incremental State Management
- Use a **Hybrid approach**: Apply manual incremental payload updates (deltas) from the realtime broadcast to the local array, but lean on the existing visibility-gated polling (from Phase 5) to trigger full re-syncs when the tab becomes visible, ensuring eventual consistency.

### Consistency Guarantees
- Covered by the Hybrid approach utilizing visibility-gated polling.

### Reordering Bulk RPC
- **Keep the UUID and literal positions**: The bulk update payload will continue to use explicit UUIDs and literal `order_position` integers rather than relative operations, maintaining predictability and ease of reasoning.

### Subscription Filtering (Claude's Suggestion applied)
- **Database-Level Channel Filtering with V2 Topics**: Use `realtime.broadcast_changes` on the database trigger to push updates to a specific topic like `queue_v2:<branchId>`. This ensures the live production build (which relies on `postgres_changes`) is completely unaffected during the rollout.

### Claude's Discretion
- The names of the new broadcast channels and exact trigger function names.
- The precise React state updater logic for merging `INSERT`, `UPDATE`, and `DELETE` payloads seamlessly.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### General Requirements
- `.planning/PROJECT.md` — Active v1.4 requirements and the critical non-breaking constraint.
- `.planning/STATE.md` — Prior decisions like visibility-gated polling and Optimistic Reordering.
- `.planning/phases/10-high-scale-queue-data-refactoring/10-RESEARCH.md` — Technical SOTA for Supabase realtime broadcasts and batch RPCs.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useQueueData.js`: Central location for modifying queue subscription logic.
- `queueService.js`: Already contains the `updateOrderPositions` function which uses an RPC.
- `visibilitychange` listeners: Already implemented in the application to leverage for consistency.

### Established Patterns
- Safely adding additive features without breaking legacy clients.

### Integration Points
- Modifying `subscribeToQueueChanges` to optionally use the new V2 broadcast channel instead of `postgres_changes`.

</code_context>

<specifics>
## Specific Ideas

- Ensure strict separation of the new realtime subscription from the production subscription to avoid breaking changes.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-high-scale-queue-data-refactoring*
*Context gathered: 2026-03-22*
