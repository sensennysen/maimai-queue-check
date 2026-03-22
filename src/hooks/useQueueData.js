import { useState, useEffect, useCallback, useRef } from 'react';
import { queueService, subscribeToQueueV2 } from '../services/supabase';
import { useBranch } from './useBranch';
import { QUEUE_STATUSES } from '../constants/queue';

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

  // Derived state
  const nowPlaying = (queue || []).find(item => item?.status === QUEUE_STATUSES.PLAYING) || null;
  const waitingQueue = (queue || []).filter(item => item?.status === QUEUE_STATUSES.WAITING);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!selectedBranch?.id) {
      return;
    }

    const currentRequestId = ++requestIdRef.current;

    try {
      setLoading(true);
      const queueData = await queueService.getQueueEntries(selectedBranch.id, selectedCabinet);
      
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setQueue(queueData);
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

  // Load initial data when branch changes
  useEffect(() => {
    if (selectedBranch?.id) {
      loadInitialData();
    }
  }, [loadInitialData, selectedBranch?.id]);

  // Subscribe to real-time changes using V2 Incremental Broadcasts (PERF-03)
  useEffect(() => {
    if (!selectedBranch?.id) {
      return;
    }

    const handlers = {
      onInsert: (payload) => {
        const newRow = payload.new;
        if (newRow && newRow.cabinet_num === selectedCabinet) {
          setQueue(current => {
            // Avoid duplicates if multiple messages arrive
            if (current.some(item => item.id === newRow.id)) return current;
            return [...current, newRow].sort((a, b) => a.order_position - b.order_position);
          });
        }
      },
      onUpdate: (payload) => {
        const newRow = payload.new;
        if (newRow) {
          setQueue(current => {
            // If it belongs to a different cabinet now, remove it
            if (newRow.cabinet_num !== selectedCabinet) {
              return current.filter(item => item.id !== newRow.id);
            }
            // If it was from a different cabinet and now belongs here, add it
            if (!current.some(item => item.id === newRow.id)) {
              return [...current, newRow].sort((a, b) => a.order_position - b.order_position);
            }
            // Normal update: merge changes
            return current.map(item => 
              item.id === newRow.id ? { ...item, ...newRow } : item
            ).sort((a, b) => a.order_position - b.order_position);
          });
        }
      },
      onDelete: (payload) => {
        const oldRow = payload.old;
        if (oldRow) {
          setQueue(current => current.filter(item => item.id !== oldRow.id));
        }
      }
    };

    const queueSubscription = subscribeToQueueV2(
      selectedBranch.id, 
      handlers,
      () => {
        // Fallback: full re-fetch to repair state on (re)connect
        loadInitialData();
      }
    );

    return () => {
      if (queueSubscription) {
        queueSubscription.unsubscribe();
      }
      setIsConnected(false);
    };
  }, [selectedBranch?.id, selectedCabinet, loadInitialData]);

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
    refreshData: loadInitialData
  };
};
