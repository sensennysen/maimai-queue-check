import { vi, describe, it, expect, beforeEach } from 'vitest';

const { fromMock, rpcMock, validateDataMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
  validateDataMock: vi.fn(() => ({ success: true })),
}));

vi.mock('../services/supabase/client', () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
  },
}));

vi.mock('../utils/validation', () => ({
  validateData: validateDataMock,
  queueEntrySchema: {
    pick: vi.fn(() => ({})),
  },
}));

import { queueService } from '../services/supabase/queue';
import { QUEUE_STATUSES } from '../constants/queue';

function createCountQuery({ count = 0, error = null } = {}) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
  };

  query.eq = vi.fn((field) => {
    if (field === 'status') {
      return Promise.resolve({ count, error });
    }
    return query;
  });

  return query;
}

function createInsertQuery({ data, error = null } = {}) {
  const query = {
    insert: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn(async () => ({ data, error })),
  };
  return query;
}


describe('queueService integrity invariants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets second addQueueEntry to WAITING when one PLAYING already exists', async () => {
    const countQuery = createCountQuery({ count: 1 });
    const insertQuery = createInsertQuery({
      data: { id: 'entry-2', status: QUEUE_STATUSES.WAITING },
    });

    fromMock.mockReturnValueOnce(countQuery).mockReturnValueOnce(insertQuery);

    await queueService.addQueueEntry('Alice', 'Bob', 2, 'user-1', 'branch-1', 1);

    const insertPayload = insertQuery.insert.mock.calls[0][0][0];
    expect(insertPayload.status).toBe(QUEUE_STATUSES.WAITING);
  });

  it('finishGame calls the finish_game RPC', async () => {
    rpcMock.mockResolvedValue({ error: null });

    await queueService.finishGame('playing-1', 'waiting-1');

    expect(rpcMock).toHaveBeenCalledWith('finish_game', {
      p_current_playing_id: 'playing-1',
      p_next_waiting_id: 'waiting-1',
    });
  });

  it('updateOrderPositions calls the reorder_queue_entries RPC', async () => {
    const updates = [
      { id: 'wait-1', order_position: 2 },
      { id: 'wait-2', order_position: 1 },
    ];

    rpcMock.mockResolvedValue({ error: null });

    const result = await queueService.updateOrderPositions(updates);

    expect(rpcMock).toHaveBeenCalledWith('reorder_queue_entries', {
      p_updates: updates,
    });
    expect(result).toEqual(updates);
  });
});
