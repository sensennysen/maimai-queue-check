import { vi, describe, it, expect, beforeEach } from 'vitest';

const { fromMock, validateDataMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  validateDataMock: vi.fn(() => ({ success: true })),
}));

vi.mock('../services/supabase/client', () => ({
  supabase: {
    from: fromMock,
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

function createUpdateQuery({ error = null } = {}) {
  const query = {
    update: vi.fn(() => query),
    eq: vi.fn(async () => ({ error })),
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

  it('finishGame transitions playing to completed and waiting to playing', async () => {
    const completeQuery = createUpdateQuery();
    const startQuery = createUpdateQuery();

    fromMock.mockReturnValueOnce(completeQuery).mockReturnValueOnce(startQuery);

    await queueService.finishGame('playing-1', 'waiting-1');

    expect(completeQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: QUEUE_STATUSES.COMPLETED })
    );
    expect(startQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: QUEUE_STATUSES.PLAYING })
    );
  });

  it('updateOrderPositions sends all waiting reorder updates in one upsert call', async () => {
    const updates = [
      { id: 'wait-1', order_position: 2 },
      { id: 'wait-2', order_position: 1 },
    ];

    const upsertQuery = {
      upsert: vi.fn(function () {
        return this;
      }),
      select: vi.fn(async () => ({ data: updates, error: null })),
    };

    fromMock.mockReturnValueOnce(upsertQuery);

    const result = await queueService.updateOrderPositions(updates);

    expect(upsertQuery.upsert).toHaveBeenCalledWith(updates, { onConflict: 'id' });
    expect(result).toEqual(updates);
  });
});
