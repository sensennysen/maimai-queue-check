# Phase 10: High-Scale Queue Data Refactoring - Research

## Standard Stack

*   **Supabase Client (`@supabase/supabase-js`)**: For all database and realtime interactions.
*   **Supabase Realtime Broadcast**: Instead of `postgres_changes` for high-volume, low-latency state synchronization.
*   **PostgreSQL Triggers & RPCs**: For executing complex state transitions atomically on the server and emitting broadcast events.

## Architecture Patterns

*   **Broadcast from Database (QETL / Reactive)**: The SOTA approach for scaling Supabase Realtime is to migrate away from native `postgres_changes` (which has a single-worker bottleneck during high scale) and instead use database triggers that call `realtime.broadcast_changes()`.
*   **Incremental State Updates**: Clients should maintain a local representation of the queue. Realtime broadcast messages should contain discrete deltas (`INSERT`, `UPDATE`, `DELETE`) rather than full table state. Clients apply these deltas to their local arrays using standard React state updater functions.
*   **Batch RPC Operations**: For linear queue interactions (like reordering multiple items dynamically or migrating a block of records), utilize a single RPC that accepts a JSON array (`jsonb` or `json`) of updates, unnest the array, and perform a single `UPDATE ... FROM` statement within a transaction.

## Don't Hand-Roll

*   **Client-Side Realtime Filtering at Scale**: If queue channels are branch-specific (e.g., specific `cabinet_num` or `branchId`), encode the topic in the broadcast channel name (e.g., `queue:<branchId>`). Do not blast all events to all clients and rely on client-side JS filtering.
*   **Postgres Changes for High-Velocity Tables**: Do not use the default `postgres_changes` for the `queue_entries` table if you expect hundreds of concurrent users mutating the queue. It will hit CPU bottlenecks checking Row Level Security (RLS) for every connected client synchronously.
*   **Chatty RPCs**: Do not execute a loop of `supabase.rpc(...)` calls from the client to update multiple items' positions.

## Common Pitfalls

*   **Missing RLS / Realtime Authorization**: Broadcast channels triggered from the database respect RLS natively by checking the `realtime.messages` table. Make sure to define policies (`authenticated can receive broadcasts`) so clients receive the messages.
*   **Out-of-Sync Local State**: If a client misses a broadcast message due to short offline windows or network hiccups, incremental updates can drift. A common pitfall is over-relying entirely on deltas.
    *   *Mitigation*: Re-sync the full queue data (`getQueueEntries()`) upon window focus (`visibilitychange` event) or WebSocket reconnection (`SUBSCRIBED` state).
*   **Payload Size Limits**: Large JSON structures inside the broadcast payload can degrade WebSocket performance. Keep the payload strictly limited to the necessary mutation data (e.g., `id`, `order_position`, `status`, `cabinet_num`).

## Code Examples

### 1. Database-Side: Triggering Broadcasts Incrementally

```sql
-- Create a trigger function that broadcasts queue changes
CREATE OR REPLACE FUNCTION public.queue_entries_broadcast()
RETURNS trigger
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    PERFORM realtime.broadcast_changes(
        'queue:' || COALESCE(NEW.branch_id, OLD.branch_id)::text, -- topic limited to branch
        TG_OP,                                                    -- event (INSERT/UPDATE/DELETE)
        TG_OP,                                                    -- operation
        TG_TABLE_NAME,                                            -- table
        TG_TABLE_SCHEMA,                                          -- schema
        NEW,                                                      -- new record
        OLD                                                       -- old record
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to the table
CREATE TRIGGER broadcast_queue_changes
AFTER INSERT OR UPDATE OR DELETE ON public.queue_entries
FOR EACH ROW
EXECUTE FUNCTION public.queue_entries_broadcast();
```

### 2. Client-Side: Applying Incremental Updates

```javascript
// Inside useQueueData.js
useEffect(() => {
  const channel = supabase
    .channel(`queue:${branchId}`)
    .on('broadcast', { event: 'INSERT' }, (payload) => {
      setQueue(current => [...current, payload.new]);
    })
    .on('broadcast', { event: 'UPDATE' }, (payload) => {
      setQueue(current => current.map(item => 
        item.id === payload.new.id ? { ...item, ...payload.new } : item
      ));
    })
    .on('broadcast', { event: 'DELETE' }, (payload) => {
      setQueue(current => current.filter(item => item.id !== payload.old.id));
    })
    .subscribe(status => {
      if (status === 'SUBSCRIBED') {
        // Fallback full re-fetch to repair state on reconnect
        queueService.getQueueEntries(branchId, true).then(setQueue);
      }
    });

  return () => supabase.removeChannel(channel);
}, [branchId]);
```

### 3. Database-Side: Batch RPC for Queue Reordering

```sql
CREATE OR REPLACE FUNCTION reorder_queue_entries(updates jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Assuming updates is an array of objects: [{"id": 1, "order_position": 2}, ...]
  UPDATE queue_entries qe
  SET order_position = (u->>'order_position')::int
  FROM jsonb_array_elements(updates) u
  WHERE qe.id = (u->>'id')::uuid;
END;
$$;
```
