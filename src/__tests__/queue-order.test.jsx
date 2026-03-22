import { vi, describe, it, expect, beforeEach } from 'vitest';

const { fromMock, rpcMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock('../services/supabase/client', () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
  },
}));

import { queueService } from '../services/supabase/queue';
import { TABLES } from '../constants/database';

function createUpsertQuery({ data = [], error = null } = {}) {
  const query = {
    upsert: vi.fn(() => query),
    select: vi.fn(async () => ({ data, error })),
  };
  return query;
}

function createSingleUpdateQuery({ id, orderPosition, error = null } = {}) {
  const query = {
    update: vi.fn(() => query),
    eq: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn(async () => ({
      data: id ? { id, order_position: orderPosition } : null,
      error,
    })),
  };
  return query;
}

describe('queueService.updateOrderPositions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the reorder_queue_entries RPC for bulk updates', async () => {
    const updates = [
      { id: 'a', order_position: 1 },
      { id: 'b', order_position: 2 },
    ];

    rpcMock.mockResolvedValue({ error: null });

    const result = await queueService.updateOrderPositions(updates);

    expect(rpcMock).toHaveBeenCalledWith('reorder_queue_entries', {
      p_updates: updates,
    });
    expect(result).toEqual(updates);
  });

  it('returns empty array for empty updates input', async () => {
    const result = await queueService.updateOrderPositions([]);
    expect(result).toEqual([]);
    expect(fromMock).not.toHaveBeenCalled();
  });
});
