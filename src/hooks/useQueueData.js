import { useState, useEffect, useCallback } from 'react';
import { queueService, subscribeToQueueChanges, supabase } from '../services/supabase';
import { useBranch } from './useBranch';
import { QUEUE_STATUS } from '../constants/queue';

/**
 * Hook for managing queue data fetching and real-time subscriptions
 * @returns {Object} Queue data state and refresh function
 */
export const useQueueData = () => {
  const { selectedBranch } = useBranch();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Derived state
  const nowPlaying = queue.find(item => item.status === QUEUE_STATUS.PLAYING) || null;
  const waitingQueue = queue.filter(item => item.status === QUEUE_STATUS.WAITING);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!selectedBranch?.id) {
      return;
    }

    try {
      setLoading(true);
      const queueData = await queueService.getQueueEntries(selectedBranch.id);
      setQueue(queueData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch?.id]);

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
      
      if (isRelevantBranch) {
        queueService.getQueueEntries(selectedBranch.id)
          .then(data => setQueue(data))
          .catch(() => {});
      }
    };

    const queueSubscription = subscribeToQueueChanges(handleQueueChange);

    // Test connection
    supabase.from('queue_entries').select('count').limit(1)
      .then(({ error }) => {
        setIsConnected(!error);
      })
      .catch(() => setIsConnected(false));

    return () => {
      if (queueSubscription) {
        queueSubscription.unsubscribe();
      }
      setIsConnected(false);
    };
  }, [selectedBranch?.id]);

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
