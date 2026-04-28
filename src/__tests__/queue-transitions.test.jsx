import { vi, describe, it, expect, beforeEach } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
}));

vi.mock('../services/supabase/client', () => ({
  supabase: {
    rpc: rpcMock,
  },
}));

import { queueService } from '../services/supabase/queue';

describe('queueService.finishGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('batch updates positions via the reorder_queue_entries RPC', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });

    const updates = [
      { id: '1001', order_position: 2 },
      { id: '1002', order_position: 1 }
    ];

    await queueService.updateOrderPositions(updates);

    expect(rpcMock).toHaveBeenCalledWith('reorder_queue_entries', {
      p_updates: updates
    });
  });

  it('atomically transitions via the finish_game RPC', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });

    await queueService.finishGame('1001', '1002');

    expect(rpcMock).toHaveBeenCalledWith('finish_game', {
      p_current_playing_id: '1001',
      p_next_waiting_id: '1002',
    });
  });

  it('passes null values to the RPC when IDs are missing', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });

    await queueService.finishGame('1001', null);

    expect(rpcMock).toHaveBeenCalledWith('finish_game', {
      p_current_playing_id: '1001',
      p_next_waiting_id: null,
    });
  });

  it('only calls the RPC if at least one ID is provided', async () => {
    await queueService.finishGame(null, null);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('throws error when RPC returns an error', async () => {
    const error = { message: 'DB Error' };
    rpcMock.mockResolvedValueOnce({ error });

    await expect(queueService.finishGame('playing-123', 'waiting-456')).rejects.toThrow('DB Error');
  });

  it('throws when both ids are the same to prevent invalid state transitions', async () => {
    await expect(queueService.finishGame('same-id', 'same-id')).rejects.toThrow(/same entry/i);
  });
});

