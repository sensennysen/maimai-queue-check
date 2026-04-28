---
wave: 1
depends_on: []
files_modified:
  - "supabase/migrations/20260322_queue_v2_broadcast.sql"
  - "supabase/migrations/20260322_optimize_reorder_queue_entries.sql"
  - "src/hooks/useQueueData.js"
autonomous: true
---

# Phase 10: High-Scale Queue Data Refactoring

## Verification Criteria
- [ ] Database contains the `queue_entries_broadcast` trigger.
- [ ] The `reorder_queue_entries` RPC uses a set-based `UPDATE ... FROM` rather than a `FOR` loop.
- [ ] The React client connects to the `queue_v2:<branch_id>` realtime broadcast channel instead of `postgres_changes`.
- [ ] The React client applies discrete `INSERT`, `UPDATE`, and `DELETE` deltas to the local state array.

## must_haves
- Client must apply deltas incrementally without full refetches on every queue change (PERF-03).
- Queue list must use batch RPC for ordering (PERF-05).
- Existing production build (`postgres_changes` listeners) must NOT be broken by the database changes.

## Tasks

```xml
<task>
  <description>Optimize the queue reordering RPC to use batch set-based operations instead of loops</description>
  <read_first>
    - supabase/migrations/20260320150000_reorder_queue_entries.sql
  </read_first>
  <action>
    Create a new timestamped migration file `supabase/migrations/*_optimize_reorder_queue_entries.sql` that uses `CREATE OR REPLACE FUNCTION public.reorder_queue_entries(p_updates JSONB)` to execute a single set-based update instead of a `FOR LOOP`.
    The query should look like:
    ```sql
    UPDATE queue_entries qe
    SET order_position = update_row.order_position
    FROM jsonb_to_recordset(p_updates) AS update_row(id BIGINT, order_position INT)
    WHERE qe.id = update_row.id;
    ```
    This completes PERF-05.
  </action>
  <acceptance_criteria>
    - `ls supabase/migrations/*_optimize_reorder_queue_entries.sql` exits 0.
    - `cat supabase/migrations/*_optimize_reorder_queue_entries.sql | grep "FROM jsonb_to_recordset"` exits 0.
  </acceptance_criteria>
</task>

<task>
  <description>Add a table trigger to emit Queue V2 Realtime Broadcasts</description>
  <read_first>
    - .planning/phases/10-high-scale-queue-data-refactoring/10-CONTEXT.md
    - .planning/phases/10-high-scale-queue-data-refactoring/10-RESEARCH.md
  </read_first>
  <action>
    Create a new timestamped migration file `supabase/migrations/*_queue_v2_broadcast.sql`.
    Create a trigger function `public.queue_entries_broadcast()` that calls `realtime.broadcast_changes` with the topic identifier `'queue_v2:' || COALESCE(NEW.branch_id, OLD.branch_id)::text`.
    Include the `TG_OP`, `TG_TABLE_NAME`, `TG_TABLE_SCHEMA`, `NEW`, and `OLD` payload.
    Attach this function as an `AFTER INSERT OR UPDATE OR DELETE ON public.queue_entries` trigger.
    This maintains backward compatibility exactly as outlined in CONTEXT.md.
  </action>
  <acceptance_criteria>
    - `ls supabase/migrations/*_queue_v2_broadcast.sql` exits 0.
    - `grep "realtime.broadcast_changes" supabase/migrations/*_queue_v2_broadcast.sql` exits 0.
    - `grep "queue_v2:" supabase/migrations/*_queue_v2_broadcast.sql` exits 0.
  </acceptance_criteria>
</task>

<task>
  <description>Refactor `useQueueData.js` to consume V2 Incremental Broadcasts</description>
  <read_first>
    - src/hooks/useQueueData.js
  </read_first>
  <action>
    Modify `src/hooks/useQueueData.js` to subscribe to the new `queue_v2:<branchId>` broadcast channel instead of `postgres_changes`.
    Implement`.on('broadcast', { event: 'INSERT' }, ...)` to append locally.
    Implement `.on('broadcast', { event: 'UPDATE' }, ...)` to map and merge state.
    Implement `.on('broadcast', { event: 'DELETE' }, ...)` to filter out by ID.
    Keep any existing fallback logic (like polling or window visibility syncs) to ensure the queue retains eventual consistency in case of dropped packets.
    Remove the generic `postgres_changes` subscription.
    This completes PERF-03.
  </action>
  <acceptance_criteria>
    - `cat src/hooks/useQueueData.js | grep "queue_v2:"` exits 0.
    - `cat src/hooks/useQueueData.js | grep "\.on('broadcast'"` exits 0.
  </acceptance_criteria>
</task>
```
