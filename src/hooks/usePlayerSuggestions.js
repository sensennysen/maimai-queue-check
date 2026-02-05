import { useState, useEffect, useRef } from 'react';
import { userService, queueService } from '../services/supabase';

/**
 * Hook to fetch player name suggestions based on the selected branch.
 * Suggestions come from:
 * 1. Players currently in the queue for the branch (from all cabinets, fetched on mount/branch change)
 * 2. Players in the current cabinet's realtime queue (passed via currentQueue prop)
 * 3. Users who have this branch in their preferred list (fetched on mount/branch change)
 * 
 * @param {string|number} branchId - The ID of the current branch
 * @param {Array} currentQueue - The current queue entries (real-time for selected cabinet)
 * @returns {Object} { suggestions, loading }
 */
export const usePlayerSuggestions = (branchId, currentQueue = []) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  // Store the full branch queue (fetched once per branchId change)
  const [fullBranchQueue, setFullBranchQueue] = useState([]);
  const [preferredUsers, setPreferredUsers] = useState([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch baseline data (Preferred Users + All Cabinet Queues)
  useEffect(() => {
    const fetchBaselineData = async () => {
      if (!branchId) {
        setFullBranchQueue([]);
        setPreferredUsers([]);
        return;
      }

      try {
        setLoading(true);
        const [users, allQueue] = await Promise.all([
            userService.getUsersPrefersBranch(branchId),
            queueService.getQueueEntries(branchId, null) // null cabinetNum = fetch all for branch
        ]);

        if (mountedRef.current) {
            setPreferredUsers(users || []);
            setFullBranchQueue(allQueue || []);
        }
      } catch (err) {
        console.error("Failed to fetch suggestion baseline data", err);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchBaselineData();
  }, [branchId]);

  // Combine baseline data with realtime currentQueue
  useEffect(() => {
    const queueNames = new Set();
    
    // 1. Add names from the full branch fetch (covers other cabinets)
    if (fullBranchQueue && Array.isArray(fullBranchQueue)) {
        fullBranchQueue.forEach(entry => {
            if (entry.player1) queueNames.add(entry.player1);
            if (entry.player2) queueNames.add(entry.player2);
        });
    }

    // 2. Add names from currentQueue prop (covers realtime updates for current cabinet)
    // This will override/add to the baseline if there are new local entries
    if (currentQueue && Array.isArray(currentQueue)) {
        currentQueue.forEach(entry => {
            if (entry.player1) queueNames.add(entry.player1);
            if (entry.player2) queueNames.add(entry.player2);
        });
    }

    // 3. Add preferred users
    const userNames = new Set();
    if (preferredUsers && Array.isArray(preferredUsers)) {
        preferredUsers.forEach(user => {
            if (user.display_name) userNames.add(user.display_name);
        });
    }

    // Combine and dedup
    const combined = Array.from(new Set([...queueNames, ...userNames]))
        .filter(name => name && name.trim().length > 0)
        .sort();

    setSuggestions(combined);

  }, [fullBranchQueue, preferredUsers, currentQueue]);

  return { suggestions, loading };
};
