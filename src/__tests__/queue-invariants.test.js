import { describe, expect, it, vi } from 'vitest';

function createSupabaseMock() {
  const updateMock = vi.fn();
  const eqMock = vi.fn();
  const selectMock = vi.fn();
  const upsertMock = vi.fn();
  const rpcMock = vi.fn(async () => ({ data: null, error: null }));
  const singleMock = vi.fn(async () => ({ data: { id: 'x' }, error: null }));

  const builder = {
    update: (...args) => {
      updateMock(...args);
      return builder;
    },
    eq: (...args) => {
      eqMock(...args);
      return builder;
    },
    select: (...args) => {
      selectMock(...args);
      if (upsertMock.mock.calls.length > 0) {
        return Promise.resolve({
          data: [
            { id: 'a', order_position: 1 },
            { id: 'b', order_position: 2 },
            { id: 'c', order_position: 3 },
          ],
          error: null,
        });
      }
      return { single: singleMock };
    },
    single: singleMock,
    upsert: (...args) => {
      upsertMock(...args);
      return builder;
    },
  };

  const fromMock = vi.fn(() => builder);
  const supabase = { from: fromMock, rpc: rpcMock };

  return { supabase, fromMock, updateMock, eqMock, selectMock, singleMock, upsertMock, rpcMock };
}

vi.mock('../services/supabase/client.js', () => {
  const { supabase } = createSupabaseMock();
  return { supabase };
});

describe('queue invariants (service boundary, mocked)', () => {
  it('finishGame calls the finish_game RPC', async () => {
    vi.resetModules();

    const { supabase, rpcMock } = createSupabaseMock();
    vi.doMock('../services/supabase/client.js', () => ({ supabase }));

    const { queueService } = await import('../services/supabase/queue.js');

    await queueService.finishGame('playing-id', 'next-id');

    expect(rpcMock).toHaveBeenCalledWith('finish_game', {
      p_current_playing_id: 'playing-id',
      p_next_waiting_id: 'next-id',
    });
  });

  it('updateOrderPositions calls the reorder_queue_entries RPC', async () => {
    vi.resetModules();

    const { supabase, rpcMock } = createSupabaseMock();
    vi.doMock('../services/supabase/client.js', () => ({ supabase }));

    const { queueService } = await import('../services/supabase/queue.js');

    const updates = [
      { id: 'a', order_position: 1 },
      { id: 'b', order_position: 2 },
      { id: 'c', order_position: 3 },
    ];

    const result = await queueService.updateOrderPositions(updates);

    expect(rpcMock).toHaveBeenCalledWith('reorder_queue_entries', {
      p_updates: updates,
    });
    expect(result).toHaveLength(3);
  });
});
