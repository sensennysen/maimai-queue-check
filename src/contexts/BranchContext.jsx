/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from 'react';
import { branchService } from '../services/supabase';
import { requestUserLocation, findNearestBranch } from '../services/geolocation';

const BranchContext = createContext(null);

const STORAGE_KEY = 'maimai-selected-branch';

export const BranchProvider = ({ children }) => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranchState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Load branches and detect nearest on mount
  useEffect(() => {
    loadBranches();
  }, []);

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
        console.log('Location request failed or denied:', locationResult.reason);
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
        } catch (findError) {
          console.warn('Error finding nearest branch with location:', findError);
        }
      }

      // 3. Fallback to first branch
      setSelectedBranchState(allBranches[0]);
      localStorage.setItem(STORAGE_KEY, allBranches[0].id);

    } catch (err) {
      console.error('Error loading branches:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setSelectedBranch = (branch) => {
    setSelectedBranchState(branch);
    localStorage.setItem(STORAGE_KEY, branch.id);
  };

  // Refresh user location
  const refreshLocation = async () => {
    try {
      const location = await requestUserLocation();
      setUserLocation(location);
      return location;
    } catch (err) {
      console.error('Error refreshing location:', err);
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
