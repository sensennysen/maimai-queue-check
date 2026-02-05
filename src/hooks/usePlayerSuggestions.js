import { useState, useEffect, useRef } from 'react';
import { userService } from '../services/supabase';

/**
 * Hook to fetch player name suggestions based on the selected branch.
 * Suggestions come from:
 * 1. Players currently in the queue for the branch (passed via currentQueue prop)
 * 2. Users who have this branch in their preferred list (fetched on mount)
 * 
 * @param {string|number} branchId - The ID of the current branch
 * @param {Array} currentQueue - The current queue entries (real-time)
 * @returns {Object} { suggestions, loading }
 */
export const usePlayerSuggestions = (branchId, currentQueue = []) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!branchId) {
        setSuggestions([]);
        return;
      }

      try {
        setLoading(true);

        // Fetch preferred users (fresh on each branchId change or mount)
        // We removed the module-level cache to ensure we get updates like display name changes
        // when the user re-opens the form.
        const preferredUsers = await userService.getUsersPrefersBranch(branchId);

        // Process queue entries (from prop)
        const queueNames = new Set();
        if (currentQueue && Array.isArray(currentQueue)) {
            currentQueue.forEach(entry => {
            if (entry.player1) queueNames.add(entry.player1);
            if (entry.player2) queueNames.add(entry.player2);
            });
        }

        // Process preferred users
        const userNames = new Set();
        preferredUsers.forEach(user => {
          if (user.display_name) userNames.add(user.display_name);
        });

        // Combine and dedup
        const combined = Array.from(new Set([...queueNames, ...userNames]))
          .filter(name => name && name.trim().length > 0)
          .sort();

        if (mountedRef.current) {
          setSuggestions(combined);
        }
      } catch (err) {
        console.error("Failed to fetch player suggestions", err);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchSuggestions();
  }, [branchId, currentQueue]); // Re-run when branchId OR currentQueue changes

  return { suggestions, loading };
};
