/* eslint-disable react-refresh/only-export-components */
/* The hook and provider are co-located intentionally (standard React context pattern).
   Splitting into separate files would add indirection without benefit. */
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { branchService, supabase } from '../services/supabase';
import { requestUserLocation, getDistance } from '../services/geolocation';
import { TABLES } from '../constants/database';

const BranchContext = createContext(null);

const STORAGE_KEY = 'maimai-selected-branch';

/**
 * Provider component for the global Branch context.
 * Manages the list of available arcade branches, location-based auto-selection, and real-time updates.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to be wrapped by the provider.
 * @returns {JSX.Element} The rendered context provider.
 */
export const BranchProvider = ({ children }) => {
  const [branches, setBranches] = useState([]);
  const [allEnabledBranches, setAllEnabledBranches] = useState([]);
  const [selectedBranch, setSelectedBranchState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [hasManuallySelected, setHasManuallySelected] = useState(false);

  /**
   * Loads the initial list of branches and enabled branches from the database.
   * Handles restoration of the user's previously selected branch from local storage.
   * @returns {Promise<void>} A promise that resolves when the branches are loaded.
   */
  const loadBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load branches ONLY, do not request location automatically on app load
      const [allBranches, allEnabled] = await Promise.all([
        branchService.getAllBranches(),
        branchService.getAllEnabledBranches()
      ]);

      setBranches(allBranches);
      setAllEnabledBranches(allEnabled);

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

  /**
   * Sets the currently active branch and persists the selection to local storage.
   * @param {Object} branch - The branch object to select.
   * @returns {void}
   */
  const setSelectedBranch = useCallback((branch) => {
    setSelectedBranchState(branch);
    setHasManuallySelected(true);
    localStorage.setItem(STORAGE_KEY, String(branch.id));
  }, []);

  /**
   * Handles real-time database change payloads for the branches table.
   * Updates local state (INSERT/UPDATE/DELETE) while maintaining sorting and selection consistency.
   * @param {Object} payload - The Supabase real-time change payload.
   * @returns {void}
   */
  const handleBranchChange = useCallback((payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT') {
      // Add to allEnabledBranches if enabled
      if (newRecord.enabled) {
        setAllEnabledBranches(prev => [...prev, newRecord].sort((a, b) =>
          a.arcade_name.localeCompare(b.arcade_name)
        ));
      }
      // New branch added - only add if enabled and has coordinates
      if (newRecord.enabled && newRecord.latitude != null && newRecord.longitude != null) {
        // Note: we can't easily verify mall_schedule here, but coordinate presence is a good proxy 
        // until a full reload happens.
        setBranches(prev => [...prev, newRecord].sort((a, b) =>
          a.arcade_name.localeCompare(b.arcade_name)
        ));
      }
    } else if (eventType === 'UPDATE') {
      // Update allEnabledBranches
      setAllEnabledBranches(prev => {
        const updated = prev.map(branch =>
          branch.id === newRecord.id ? newRecord : branch
        );
        if (!newRecord.enabled) {
          return updated.filter(b => b.id !== newRecord.id);
        }
        if (newRecord.enabled && !prev.find(b => b.id === newRecord.id)) {
          return [...updated, newRecord].sort((a, b) =>
            a.arcade_name.localeCompare(b.arcade_name)
          );
        }
        return updated.sort((a, b) =>
          a.arcade_name.localeCompare(b.arcade_name)
        );
      });

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
      // Update allEnabledBranches
      setAllEnabledBranches(prev => prev.filter(b => b.id !== oldRecord.id));

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
          table: TABLES.ALLOWED_PLACES,
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
  /**
   * Requests the user's current geographical coordinates and updates the context state.
   * @returns {Promise<Object|null>} A promise resolving to the location object or null on failure.
   */
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
    allEnabledBranches,
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

/**
 * Custom hook to access the global Branch context.
 * Provides access to available branches, the selected branch, and location-related utilities.
 * @returns {Object} The Branch context value.
 * @throws {Error} If used outside of a BranchProvider.
 */
export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within BranchProvider');
  }
  return context;
};
