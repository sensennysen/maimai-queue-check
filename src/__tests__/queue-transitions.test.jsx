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
import { QUEUE_STATUSES } from '../constants/queue';

function createUpdateQuery({ error = null } = {}) {
  const query = {
    update: vi.fn(() => query),
    eq: vi.fn(async () => ({ error })),
  };
  return query;
}

describe('queueService.finishGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('transitions current playing to completed and next waiting to playing', async () => {
    const completeQuery = createUpdateQuery();
    const startQuery = createUpdateQuery();

    fromMock.mockReturnValueOnce(completeQuery).mockReturnValueOnce(startQuery);

    await queueService.finishGame('playing-123', 'waiting-456');

    expect(fromMock).toHaveBeenNthCalledWith(1, TABLES.QUEUE_ENTRIES);
    expect(fromMock).toHaveBeenNthCalledWith(2, TABLES.QUEUE_ENTRIES);

    expect(completeQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: QUEUE_STATUSES.COMPLETED,
        ended_at: expect.any(String),
      })
    );
    expect(completeQuery.eq).toHaveBeenCalledWith('id', 'playing-123');

    expect(startQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: QUEUE_STATUSES.PLAYING,
        started_at: expect.any(String),
      })
    );
    expect(startQuery.eq).toHaveBeenCalledWith('id', 'waiting-456');
  });

  it('only transitions current playing when no next waiting id is provided', async () => {
    const completeQuery = createUpdateQuery();
    fromMock.mockReturnValueOnce(completeQuery);

    await queueService.finishGame('playing-123', null);

    expect(fromMock).toHaveBeenCalledTimes(1);
    expect(completeQuery.eq).toHaveBeenCalledWith('id', 'playing-123');
  });

  it('only transitions next waiting when no current playing id is provided', async () => {
    const startQuery = createUpdateQuery();
    fromMock.mockReturnValueOnce(startQuery);

    await queueService.finishGame(null, 'waiting-456');

    expect(fromMock).toHaveBeenCalledTimes(1);
    expect(startQuery.eq).toHaveBeenCalledWith('id', 'waiting-456');
  });

  it('throws when both ids are the same to prevent invalid state transitions', async () => {
    await expect(queueService.finishGame('same-id', 'same-id')).rejects.toThrow(/same entry/i);
  });
});
