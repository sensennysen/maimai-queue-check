import { vi, describe, it, expect, beforeEach } from 'vitest';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('../services/supabase/client', () => ({
  supabase: {
    from: fromMock,
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

  it('uses a single upsert call for bulk updates', async () => {
    const updates = [
      { id: 'a', order_position: 1 },
      { id: 'b', order_position: 2 },
    ];

    const upsertQuery = createUpsertQuery({ data: updates });
    fromMock.mockReturnValueOnce(upsertQuery);

    const result = await queueService.updateOrderPositions(updates);

    expect(fromMock).toHaveBeenCalledWith(TABLES.QUEUE_ENTRIES);
    expect(upsertQuery.upsert).toHaveBeenCalledWith(updates, { onConflict: 'id' });
    expect(upsertQuery.select).toHaveBeenCalledWith('id, order_position');
    expect(result).toEqual(updates);
  });

  it('falls back to per-row updates when upsert fails', async () => {
    const updates = [
      { id: 'a', order_position: 10 },
      { id: 'b', order_position: 11 },
    ];

    const upsertQuery = createUpsertQuery({ error: new Error('upsert unavailable') });
    const rowAQuery = createSingleUpdateQuery({ id: 'a', orderPosition: 10 });
    const rowBQuery = createSingleUpdateQuery({ id: 'b', orderPosition: 11 });

    fromMock
      .mockReturnValueOnce(upsertQuery)
      .mockReturnValueOnce(rowAQuery)
      .mockReturnValueOnce(rowBQuery);

    const result = await queueService.updateOrderPositions(updates);

    expect(fromMock).toHaveBeenCalledTimes(3);
    expect(rowAQuery.update).toHaveBeenCalledWith({ order_position: 10 });
    expect(rowAQuery.eq).toHaveBeenCalledWith('id', 'a');
    expect(rowBQuery.update).toHaveBeenCalledWith({ order_position: 11 });
    expect(rowBQuery.eq).toHaveBeenCalledWith('id', 'b');
    expect(result).toEqual([
      { id: 'a', order_position: 10 },
      { id: 'b', order_position: 11 },
    ]);
  });

  it('returns empty array for empty updates input', async () => {
    const result = await queueService.updateOrderPositions([]);
    expect(result).toEqual([]);
    expect(fromMock).not.toHaveBeenCalled();
  });
});
