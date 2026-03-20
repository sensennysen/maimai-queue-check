import { useState, useEffect, useCallback, useRef } from 'react';
import { queueService, subscribeToQueueChanges } from '../services/supabase';
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

  // Subscribe to real-time changes
  useEffect(() => {
    if (!selectedBranch?.id) {
      return;
    }

    const handleQueueChange = (payload) => {
      const newRow = payload.new;
      const oldRow = payload.old;
      
      const isRelevantBranch = 
        (newRow && newRow.branch_id === selectedBranch.id) ||
        (oldRow && oldRow.branch_id === selectedBranch.id);
      
      // Check if this change is relevant to the selected cabinet
      const isRelevantCabinet =
        (newRow && newRow.cabinet_num === selectedCabinet) ||
        (oldRow && oldRow.cabinet_num === selectedCabinet);
      
      if (isRelevantBranch && isRelevantCabinet) {
        const currentRequestId = ++requestIdRef.current;
        queueService.getQueueEntries(selectedBranch.id, selectedCabinet)
          .then(data => {
            if (currentRequestId === requestIdRef.current) {
              setQueue(data);
            }
          })
          .catch(err => {
            if (currentRequestId === requestIdRef.current) {
              console.error('[useQueueData] Failed to refresh queue on subscription event:', err);
            }
          });
      }
    };

    const queueSubscription = subscribeToQueueChanges(handleQueueChange, selectedBranch.id);

    // Test connection removed
    
    return () => {
      if (queueSubscription) {
        queueSubscription.unsubscribe();
      }
      setIsConnected(false);
    };
  }, [selectedBranch?.id, selectedCabinet]);

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
