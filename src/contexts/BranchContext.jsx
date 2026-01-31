/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { branchService, supabase } from '../services/supabase';
import { requestUserLocation, findNearestBranch } from '../services/geolocation';

const BranchContext = createContext(null);

const STORAGE_KEY = 'maimai-selected-branch';

export const BranchProvider = ({ children }) => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranchState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const setSelectedBranch = useCallback((branch) => {
    setSelectedBranchState(branch);
    localStorage.setItem(STORAGE_KEY, branch.id);
  }, []);

  const handleBranchChange = useCallback((payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT') {
      // New branch added - only add if enabled
      if (newRecord.enabled) {
        setBranches(prev => [...prev, newRecord].sort((a, b) =>
          a.arcade_name.localeCompare(b.arcade_name)
        ));
      }
    } else if (eventType === 'UPDATE') {
      // Branch updated
      setBranches(prev => {
        const updated = prev.map(branch =>
          branch.id === newRecord.id ? newRecord : branch
        );

        // If branch was disabled, remove it from the list
        if (!newRecord.enabled) {
          return updated.filter(b => b.id !== newRecord.id);
        }

        // If branch was enabled, make sure it's in the list
        if (newRecord.enabled && !prev.find(b => b.id === newRecord.id)) {
          return [...updated, newRecord].sort((a, b) =>
            a.arcade_name.localeCompare(b.arcade_name)
          );
        }

        return updated.sort((a, b) =>
          a.arcade_name.localeCompare(b.arcade_name)
        );
      });

      // Update selected branch state if it was updated
      setSelectedBranchState(prev => {
        if (prev?.id === newRecord.id) {
          if (!newRecord.enabled) {
            // Branch was disabled, will be handled below
            return prev;
          }
          // Update the selected branch data
          return newRecord;
        }
        return prev;
      });

      // If the selected branch was disabled, switch to first available
      if (newRecord.id === selectedBranch?.id && !newRecord.enabled) {
        setBranches(currentBranches => {
          const otherBranches = currentBranches.filter(b => b.id !== newRecord.id && b.enabled);
          if (otherBranches.length > 0) {
            setSelectedBranch(otherBranches[0]);
          }
          return currentBranches;
        });
      }
    } else if (eventType === 'DELETE') {
      // Branch deleted
      setBranches(prev => prev.filter(b => b.id !== oldRecord.id));

      // If the selected branch was deleted, switch to first available
      if (selectedBranch?.id === oldRecord.id) {
        setBranches(currentBranches => {
          const otherBranches = currentBranches.filter(b => b.id !== oldRecord.id);
          if (otherBranches.length > 0) {
            setSelectedBranch(otherBranches[0]);
          } else {
            setSelectedBranchState(null);
            localStorage.removeItem(STORAGE_KEY);
          }
          return currentBranches;
        });
      }
    }
  }, [selectedBranch, setSelectedBranch]);

  // Load branches and detect nearest on mount
  useEffect(() => {
    loadBranches();
  }, []);

  // Set up real-time subscription for branch changes
  useEffect(() => {
    // Subscribe to changes in allowed_places table
    const channel = supabase
      .channel('allowed_places_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'allowed_places',
        },
        (payload) => {
          handleBranchChange(payload);
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleBranchChange]);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError(null);

      // Start both requests in parallel
      const branchesPromise = branchService.getAllBranches();
      const locationPromise = requestUserLocation();

      // Wait for both to complete (success or fail)
      const [branchesResult, locationResult] = await Promise.allSettled([
        branchesPromise,
        locationPromise
      ]);

      // Handle branches
      let allBranches = [];
      if (branchesResult.status === 'fulfilled') {
        allBranches = branchesResult.value;
        setBranches(allBranches);
      } else {
        throw new Error(branchesResult.reason?.message || 'Failed to load branches');
      }

      if (allBranches.length === 0) {
        setError('No branches found');
        return;
      }

      // Handle location
      let location = null;
      if (locationResult.status === 'fulfilled') {
        location = locationResult.value;
        setUserLocation(location);
      } else {
        // Location request failed or denied
      }

      // Logic to select branch
      // 1. Check for saved branch
      const savedBranchId = localStorage.getItem(STORAGE_KEY);
      if (savedBranchId) {
        const savedBranch = allBranches.find(b => b.id === savedBranchId);
        if (savedBranch) {
          setSelectedBranchState(savedBranch);

          // Even if we used saved branch, if we have location, we can check if another is effectively closer?
          // For now, respect the saved choice, but we have the location stored in state if needed.
          setLoading(false);
          return;
        }
      }

      // 2. Use location if available
      if (location) {
        try {
          // We already have the location, just find the branch
          const { nearestBranch } = await findNearestBranch(location);
          if (nearestBranch) {
            setSelectedBranchState(nearestBranch);
            localStorage.setItem(STORAGE_KEY, nearestBranch.id);
            setLoading(false);
            return;
          }
        } catch {
          // Failed to find nearest branch
        }
      }

      // 3. Fallback to first branch
      setSelectedBranchState(allBranches[0]);
      localStorage.setItem(STORAGE_KEY, allBranches[0].id);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh user location
  const refreshLocation = async () => {
    try {
      const location = await requestUserLocation();
      setUserLocation(location);
      return location;
    } catch {
      return null;
    }
  };

  const value = {
    branches,
    selectedBranch,
    setSelectedBranch,
    loading,
    error,
    userLocation,
    refreshLocation,
    reloadBranches: loadBranches, // Expose reload function
  };

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within BranchProvider');
  }
  return context;
};
