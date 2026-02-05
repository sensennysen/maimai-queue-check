import { useState, useEffect, useCallback } from 'react';
import { queueService, subscribeToQueueChanges, supabase } from '../services/supabase';
import { useBranch } from './useBranch';
import { QUEUE_STATUS } from '../constants/queue';

/**
 * Hook for managing queue data for ALL cabinets (Public Monitor)
 * @param {string|null} branchIdOverride - Optional branch ID to override context
 * @returns {Object} Monitor data state and refresh function
 */
export const useMonitorData = (branchIdOverride = null) => {
  const { selectedBranch } = useBranch();
  // Use override if provided, otherwise fallback to context, otherwise null
  const activeBranchId = branchIdOverride || selectedBranch?.id;

  const [queueData, setQueueData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Load initial data
  const loadData = useCallback(async () => {
    if (!activeBranchId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch all entries for the branch (cabinetNum = null)
      const data = await queueService.getQueueEntries(activeBranchId, null);
      
      // Group by cabinet
      const grouped = {};
      data.forEach(entry => {
        const cab = entry.cabinet_num || 1;
        if (!grouped[cab]) {
            grouped[cab] = {
                playing: [],
                waiting: []
            };
        }
        
        if (entry.status === QUEUE_STATUS.PLAYING) {
            grouped[cab].playing.push(entry);
        } else if (entry.status === QUEUE_STATUS.WAITING) {
            grouped[cab].waiting.push(entry);
        }
      });
      
      setQueueData(grouped);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeBranchId]);

  // Load initial data when branch changes
  useEffect(() => {
    loadData();
  }, [loadData, activeBranchId]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!activeBranchId) {
      return;
    }

    const handleQueueChange = (payload) => {
      const newRow = payload.new;
      const oldRow = payload.old;
      
      const isRelevantBranch = 
        (newRow && newRow.branch_id === activeBranchId) ||
        (oldRow && oldRow.branch_id === activeBranchId);
      
      if (isRelevantBranch) {
          // Identify which cabinet(s) might be affected and maybe only selectively update?
          // For simplicity in monitor mode, let's re-fetch all. It's safe.
          // Debouncing could be good here if rapid updates happen, but usually queue events are human-speed.
          loadData();
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
  }, [activeBranchId, loadData]);

  return {
    queueData, // Structure: { [cabinetNum]: { playing: [], waiting: [] } }
    loading,
    error,
    isConnected,
    refreshData: loadData,
    activeBranchId
  };
};
