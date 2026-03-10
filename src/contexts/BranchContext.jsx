/* eslint-disable react-refresh/only-export-components */
/* The hook and provider are co-located intentionally (standard React context pattern).
   Splitting into separate files would add indirection without benefit. */
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { branchService, supabase } from '../services/supabase';
import { requestUserLocation, getDistance } from '../services/geolocation';

const BranchContext = createContext(null);

const STORAGE_KEY = 'maimai-selected-branch';

export const BranchProvider = ({ children }) => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranchState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [hasManuallySelected, setHasManuallySelected] = useState(false);

  const loadBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load branches ONLY, do not request location automatically on app load
      const allBranches = await branchService.getAllBranches();

      setBranches(allBranches);

      if (allBranches.length === 0) {
        setError('No branches found');
        return;
      }

      // Logic to select initial branch on load
      // 1. Check for saved branch first (respect manual user selection)
      const savedBranchId = localStorage.getItem(STORAGE_KEY);
      if (savedBranchId) {
        const parsedBranchId = Number(savedBranchId);
        const savedBranch = allBranches.find(b => b.id === parsedBranchId);
        if (savedBranch) {
          setSelectedBranchState(savedBranch);
          setLoading(false);
          return;
        }
      }

      // 2. Absolute default to first branch alphabetically if no saved branch
      setSelectedBranchState(allBranches[0]);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []); // Static loader

  const setSelectedBranch = useCallback((branch) => {
    setSelectedBranchState(branch);
    setHasManuallySelected(true);
    localStorage.setItem(STORAGE_KEY, String(branch.id));
  }, []);

  const handleBranchChange = useCallback((payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT') {
      // New branch added - only add if enabled and has coordinates
      if (newRecord.enabled && newRecord.latitude != null && newRecord.longitude != null) {
        // Note: we can't easily verify mall_schedule here, but coordinate presence is a good proxy 
        // until a full reload happens.
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

        // If branch was disabled or lost coordinates, remove it from the list
        if (!newRecord.enabled || newRecord.latitude == null || newRecord.longitude == null) {
          return updated.filter(b => b.id !== newRecord.id);
        }

        // If branch was enabled with coordinates, make sure it's in the list
        if (newRecord.enabled && newRecord.latitude != null && newRecord.longitude != null && !prev.find(b => b.id === newRecord.id)) {
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

      // If the selected branch was disabled or lost coordinates, switch to first available
      if (newRecord.id === selectedBranch?.id && (!newRecord.enabled || newRecord.latitude == null || newRecord.longitude == null)) {
        setBranches(currentBranches => {
          const otherBranches = currentBranches.filter(b => b.id !== newRecord.id && b.enabled && b.latitude != null && b.longitude != null);
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

  // Load branches on mount
  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  /**
   * Auto-detect nearest branch when location becomes available.
   * ONLY auto-selects if there is NO saved preference in localStorage.
   */
  useEffect(() => {
    if (userLocation && branches.length > 0 && !hasManuallySelected) {
      const sorted = [...branches].sort((a, b) => {
        const distA = getDistance(userLocation, { latitude: a.latitude, longitude: a.longitude });
        const distB = getDistance(userLocation, { latitude: b.latitude, longitude: b.longitude });
        return distA - distB;
      });

      const nearest = sorted[0];

      // Only update if it's different to minimize re-renders
      if (selectedBranch?.id !== nearest.id) {
        setSelectedBranchState(nearest);
        localStorage.setItem(STORAGE_KEY, String(nearest.id));
      }
    }
  }, [userLocation, branches, hasManuallySelected, selectedBranch?.id]);

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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mall_schedule',
        },
        () => {
          // Schedules changed, trigger a full reload since we filter by schedule presence
          loadBranches();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleBranchChange, loadBranches]);

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
    hasManuallySelected, // Expose for other hooks to know if they should auto-override
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
