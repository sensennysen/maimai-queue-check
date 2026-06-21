import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { queueService, subscribeToQueueChanges } from '../services/supabase';
import { useBranch } from './useBranch';
import { QUEUE_STATUSES } from '../constants/queue';

const areRecordsEqual = (left, right) => {
  if (Object.is(left, right)) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  return leftKeys.length === rightKeys.length
    && leftKeys.every((key) => Object.is(left[key], right[key]));
};

const areQueueEntriesEqual = (left, right) => {
  if (Object.is(left, right)) return true;
  if (!left || !right) return false;

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  return leftKeys.length === rightKeys.length
    && leftKeys.every((key) => {
      const leftValue = left[key];
      const rightValue = right[key];

      if (Object.is(leftValue, rightValue)) return true;
      return areRecordsEqual(leftValue, rightValue);
    });
};

const reconcileQueueEntries = (previousQueue, nextQueue) => {
  const previousById = new Map(previousQueue.map((entry) => [entry.id, entry]));
  let changed = previousQueue.length !== nextQueue.length;

  const reconciledQueue = nextQueue.map((entry, index) => {
    const previousEntry = previousById.get(entry.id);
    const reconciledEntry = previousEntry && areQueueEntriesEqual(previousEntry, entry)
      ? previousEntry
      : entry;

    if (reconciledEntry !== previousQueue[index]) {
      changed = true;
    }

    return reconciledEntry;
  });

  return changed ? reconciledQueue : previousQueue;
};

/**
 * Hook for managing queue data fetching and real-time subscriptions
 * @param {number} selectedCabinet - Currently selected cabinet number
 * @returns {Object} Queue data state and refresh function
 */
export const useQueueData = (selectedCabinet = 1) => {
  const { selectedBranch } = useBranch();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const requestIdRef = useRef(0);

  // Keep derived references stable when unrelated UI state changes.
  const nowPlaying = useMemo(
    () => queue.find(item => item?.status === QUEUE_STATUSES.PLAYING) || null,
    [queue]
  );
  const waitingQueue = useMemo(
    () => queue.filter(item => item?.status === QUEUE_STATUSES.WAITING),
    [queue]
  );

  const loadQueueData = useCallback(async ({ showLoading = false } = {}) => {
    if (!selectedBranch?.id) {
      return;
    }

    const currentRequestId = ++requestIdRef.current;

    try {
      if (showLoading) {
        setLoading(true);
      }

      const queueData = await queueService.getQueueEntries(selectedBranch.id, selectedCabinet);
      
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setQueue((previousQueue) => reconcileQueueEntries(previousQueue, queueData));
      setError(null);
      setIsConnected(true);
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      if (err.name === 'AbortError') return;
      setError(err.message);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [selectedBranch?.id, selectedCabinet]);

  // Use a blocking loading state only when the branch/cabinet scope changes.
  useEffect(() => {
    if (selectedBranch?.id) {
      loadQueueData({ showLoading: true });
    }
  }, [loadQueueData, selectedBranch?.id]);

  // Subscribe to real-time changes using postgres_changes (Supabase built-in)
  useEffect(() => {
    if (!selectedBranch?.id) {
      return;
    }

    const handleQueueChange = (payload) => {
      const newRow = payload.new;
      const oldRow = payload.old;
      
      const isRelevant = 
        (newRow && newRow.branch_id === selectedBranch.id && newRow.cabinet_num === selectedCabinet) ||
        (oldRow && oldRow.branch_id === selectedBranch.id && oldRow.cabinet_num === selectedCabinet);
      
      if (isRelevant) {
        // Keep the current queue mounted while fresh data is fetched.
        loadQueueData();
      }
    };

    const queueSubscription = subscribeToQueueChanges(handleQueueChange, selectedBranch.id);

    return () => {
      if (queueSubscription) {
        queueSubscription.unsubscribe();
      }
      setIsConnected(false);
    };
  }, [selectedBranch?.id, selectedCabinet, loadQueueData]);

  // Generate next order number
  const getNextOrder = useCallback(() => {
    return queue.length > 0 ? Math.max(...queue.map(item => item.order_position)) + 1 : 1;
  }, [queue]);

  return {
    queue,
    waitingQueue,
    nowPlaying,
    loading,
    error,
    isConnected,
    setQueue,
    setError,
    getNextOrder,
    refreshData: loadQueueData
  };
};
