import { useState, useEffect, useRef } from 'react';
import { userService, queueService } from '../services/supabase';

/**
 * Hook to fetch player name suggestions based on the selected branch.
 * Suggestions come from:
 * 1. Players who have completed their games today (from all cabinets)
 * 2. Users who have this branch in their preferred list AND have a display name
 * 
 * @param {string|number} branchId - The ID of the current branch
 * @param {Array} currentQueue - Not used anymore, kept for backward compatibility
 * @returns {Object} { suggestions, loading }
 */
export const usePlayerSuggestions = (branchId) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  // Store completed entries and preferred users
  const [completedEntries, setCompletedEntries] = useState([]);
  const [preferredUsers, setPreferredUsers] = useState([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch baseline data (Completed Entries + Preferred Users with display names)
  useEffect(() => {
    const fetchBaselineData = async () => {
      if (!branchId) {
        setCompletedEntries([]);
        setPreferredUsers([]);
        return;
      }

      try {
        setLoading(true);
        const [users, completed] = await Promise.all([
            userService.getUsersPrefersBranch(branchId),
            queueService.getCompletedEntriesForToday(branchId)
        ]);

        if (mountedRef.current) {
            // Filter users to only include those with display names
            const usersWithDisplayNames = (users || []).filter(user => 
              user.display_name && user.display_name.trim().length > 0
            );
            setPreferredUsers(usersWithDisplayNames);
            setCompletedEntries(completed || []);
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

  // Combine baseline data
  useEffect(() => {
    const completedNames = new Set();
    
    // 1. Add names from completed entries
    if (completedEntries && Array.isArray(completedEntries)) {
        completedEntries.forEach(entry => {
            if (entry.player1) completedNames.add(entry.player1);
            if (entry.player2) completedNames.add(entry.player2);
        });
    }

    // 2. Add preferred users with display names
    const userNames = new Set();
    if (preferredUsers && Array.isArray(preferredUsers)) {
        preferredUsers.forEach(user => {
            if (user.display_name) userNames.add(user.display_name);
        });
    }

    // Combine and dedup
    const combined = Array.from(new Set([...completedNames, ...userNames]))
        .filter(name => name && name.trim().length > 0)
        .sort();

    setSuggestions(combined);

  }, [completedEntries, preferredUsers]);

  return { suggestions, loading };
};
