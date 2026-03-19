import { describe, expect, it, vi } from 'vitest';

function createSupabaseMock() {
  const updateMock = vi.fn(async () => ({ data: null, error: null }));
  const eqMock = vi.fn(async () => ({ data: null, error: null }));
  const selectMock = vi.fn(() => ({ single: singleMock }));
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
      return { single: singleMock };
    },
  };

  const fromMock = vi.fn(() => builder);
  const supabase = { from: fromMock };

  return { supabase, fromMock, updateMock, eqMock, selectMock, singleMock };
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

  it('updateOrderPositions performs N sequential updates for N entries', async () => {
    vi.resetModules();

    const { supabase, updateMock, eqMock, selectMock, singleMock } = createSupabaseMock();
    vi.doMock('../services/supabase/client.js', () => ({ supabase }));

    const { queueService } = await import('../services/supabase/queue.js');

    const updates = [
      { id: 'a', order_position: 1 },
      { id: 'b', order_position: 2 },
      { id: 'c', order_position: 3 },
    ];

    await queueService.updateOrderPositions(updates);

    expect(updateMock).toHaveBeenCalledTimes(updates.length);
    expect(eqMock).toHaveBeenCalledTimes(updates.length);
    expect(selectMock).toHaveBeenCalledTimes(updates.length);
    expect(singleMock).toHaveBeenCalledTimes(updates.length);
  });
});

