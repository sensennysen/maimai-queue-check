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

      // Fetch all branches from database
      const allBranches = await branchService.getAllBranches();
      setBranches(allBranches);

      if (allBranches.length === 0) {
        setError('No branches found');
        return;
      }

      // Check if there's a saved branch in localStorage
      const savedBranchId = localStorage.getItem(STORAGE_KEY);
      if (savedBranchId) {
        const savedBranch = allBranches.find(b => b.id === savedBranchId);
        if (savedBranch) {
          setSelectedBranchState(savedBranch);
          setLoading(false);
          return;
        }
      }

      // Try to detect nearest branch using geolocation
      try {
        const location = await requestUserLocation();
        setUserLocation(location);

        const { nearestBranch } = await findNearestBranch(location);
        if (nearestBranch) {
          setSelectedBranchState(nearestBranch);
          localStorage.setItem(STORAGE_KEY, nearestBranch.id);
        } else {
          // Fallback to first branch
          setSelectedBranchState(allBranches[0]);
          localStorage.setItem(STORAGE_KEY, allBranches[0].id);
        }
      } catch (geoError) {
        console.log('Geolocation not available, using first branch:', geoError.message);
        // Fallback to first branch if geolocation fails
        setSelectedBranchState(allBranches[0]);
        localStorage.setItem(STORAGE_KEY, allBranches[0].id);
      }
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
