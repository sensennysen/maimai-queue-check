import { describe, expect, it, vi } from 'vitest';

function createSupabaseMock() {
  const updateMock = vi.fn();
  const eqMock = vi.fn();
  const selectMock = vi.fn();
  const upsertMock = vi.fn();
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
  const supabase = { from: fromMock };

  return { supabase, fromMock, updateMock, eqMock, selectMock, singleMock, upsertMock };
}

vi.mock('../services/supabase/client.js', () => {
  const { supabase } = createSupabaseMock();
  return { supabase };
});

describe('queue invariants (service boundary, mocked)', () => {
  it('finishGame performs a two-step update sequence', async () => {
    vi.resetModules();

    const { supabase, updateMock, eqMock } = createSupabaseMock();
    vi.doMock('../services/supabase/client.js', () => ({ supabase }));

    const { queueService } = await import('../services/supabase/queue.js');

    await queueService.finishGame('playing-id', 'next-id');

    expect(updateMock).toHaveBeenCalledTimes(2);
    expect(eqMock).toHaveBeenCalledTimes(2);
  });

  it('updateOrderPositions uses one upsert call when supported', async () => {
    vi.resetModules();

    const { supabase, upsertMock, selectMock } = createSupabaseMock();
    vi.doMock('../services/supabase/client.js', () => ({ supabase }));

    const { queueService } = await import('../services/supabase/queue.js');

    const updates = [
      { id: 'a', order_position: 1 },
      { id: 'b', order_position: 2 },
      { id: 'c', order_position: 3 },
    ];

    const result = await queueService.updateOrderPositions(updates);

    expect(upsertMock).toHaveBeenCalledTimes(1);
    expect(selectMock).toHaveBeenCalledWith('id, order_position');
    expect(result).toHaveLength(3);
  });
});
