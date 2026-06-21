/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useQueueData } from '../hooks/useQueueData';
import { useBranch } from '../hooks/useBranch';

// Mock the hooks and services
vi.mock('../hooks/useBranch', () => ({
  useBranch: vi.fn(),
}));

vi.mock('../services/supabase', () => {
  return {
    queueService: {
      getQueueEntries: vi.fn(),
    },
    subscribeToQueueChanges: vi.fn(() => ({
      unsubscribe: vi.fn(),
    })),
    subscribeToQueueV2: vi.fn(() => ({
      unsubscribe: vi.fn(),
    })),
  };
});

describe('useQueueData stale-request guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ignores early result when a newer request has been started', async () => {
    const { queueService } = await import('../services/supabase');
    const branch1 = { id: 'branch-1' };
    const branch2 = { id: 'branch-2' };
    
    // First setup the initial call that happens on mount
    let resolve1;
    const promise1 = new Promise((resolve) => {
      resolve1 = resolve;
    });

    queueService.getQueueEntries.mockReturnValue(promise1);
    useBranch.mockReturnValue({ selectedBranch: branch1 });

    const { result, rerender } = renderHook(({ cabinet }) => useQueueData(cabinet), {
      initialProps: { cabinet: 1 }
    });

    // Manually trigger the effect if renderHook didn't do it as expected
    // but usually it does. The issue might be the mock placement.
    
    // Check it started the first request
    await waitFor(() => expect(queueService.getQueueEntries).toHaveBeenCalled());
    expect(queueService.getQueueEntries).toHaveBeenCalledWith('branch-1', 1);
    expect(result.current.loading).toBe(true);

    // Setup for scenario: request 2 (fast)
    const fastPromise = Promise.resolve([{ id: 'entry-fast', status: 'WAITING' }]);

    // Trigger second request by changing branch
    useBranch.mockReturnValue({ selectedBranch: branch2 });
    queueService.getQueueEntries.mockReturnValue(fastPromise);

    await act(async () => {
      rerender({ cabinet: 1 });
    });

    // Wait for the fast request to complete
    await waitFor(() => expect(result.current.queue).toEqual([{ id: 'entry-fast', status: 'WAITING' }]));
    expect(result.current.loading).toBe(false);

    // Now resolve the first (slow) request
    await act(async () => {
      resolve1([{ id: 'entry-slow', status: 'WAITING' }]);
    });

    // Assert that the state STAYS at the fast request's data
    expect(result.current.queue).toEqual([{ id: 'entry-fast', status: 'WAITING' }]);
  });

  it('refreshes realtime changes without returning to the blocking loading state', async () => {
    const { queueService, subscribeToQueueChanges } = await import('../services/supabase');
    const initialQueue = [
      { id: 'entry-1', player1: 'Alice', status: 'waiting' },
      { id: 'entry-2', player1: 'Bob', status: 'waiting' },
    ];

    useBranch.mockReturnValue({ selectedBranch: { id: 'branch-1' } });
    queueService.getQueueEntries.mockResolvedValueOnce(initialQueue);

    const { result } = renderHook(() => useQueueData(1));

    await waitFor(() => expect(result.current.loading).toBe(false));
    const firstEntryReference = result.current.queue[0];
    const secondEntryReference = result.current.queue[1];

    queueService.getQueueEntries.mockResolvedValueOnce([
      { id: 'entry-1', player1: 'Alice', status: 'waiting' },
      { id: 'entry-2', player1: 'Bobby', status: 'waiting' },
    ]);

    const realtimeHandler = subscribeToQueueChanges.mock.calls[0][0];

    await act(async () => {
      realtimeHandler({
        new: { branch_id: 'branch-1', cabinet_num: 1 },
        old: null,
      });
    });

    expect(result.current.loading).toBe(false);

    await waitFor(() => expect(result.current.queue[1].player1).toBe('Bobby'));
    expect(result.current.queue[0]).toBe(firstEntryReference);
    expect(result.current.queue[1]).not.toBe(secondEntryReference);
  });
});

