import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useBranch } from './useBranch';
import { verifyUserLocationAndPermissions } from '../services/geolocation';
import { ERRORS } from '../constants/queue';

/**
 * Hook for managing location verification state and logic
 * @returns {import('../types/queue').LocationState & { verifyLocation: () => Promise<void> }}
 */
export const useLocationVerification = () => {
  const { user, userRoles } = useAuth();
  const { selectedBranch } = useBranch();

  const [locationVerified, setLocationVerified] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationCheckInProgress, setLocationCheckInProgress] = useState(false);
  const [hasAttemptedVerification, setHasAttemptedVerification] = useState(false);
  const [needsLocationPermission, setNeedsLocationPermission] = useState(false);

  // Function to verify user location and permissions
  const verifyLocation = useCallback(async () => {
    if (!user) {
      setLocationVerified(false);
      setLocationError(ERRORS.LOGIN_REQUIRED);
      setNeedsLocationPermission(false);
      return;
    }

    if (!selectedBranch?.id) {
      setLocationVerified(false);
      setLocationError(ERRORS.BRANCH_REQUIRED);
      setNeedsLocationPermission(false);
      return;
    }

    setLocationCheckInProgress(true);
    setLocationError(null);
    setHasAttemptedVerification(true);

    try {
      const result = await verifyUserLocationAndPermissions(
        user.id,
        selectedBranch.id,
        userRoles?.is_admin || false
      );
      setLocationVerified(result.allowed);
      setNeedsLocationPermission(result.needsPermission || false);
      if (!result.allowed) {
        setLocationError(result.reason);
      } else {
        setLocationError(null);
      }
    } catch {
      setLocationVerified(false);
      setLocationError(ERRORS.LOCATION_FAILED);
      setNeedsLocationPermission(false);
    } finally {
      setLocationCheckInProgress(false);
    }
  }, [user, selectedBranch?.id, userRoles?.is_admin]);

  // Automatically verify location when user is available and has not attempted verification
  useEffect(() => {
    const checkAndVerifyLocation = async () => {
      if (user && !hasAttemptedVerification && !locationCheckInProgress) {
        if (userRoles?.can_edit) {
          await verifyLocation();
        }
      }
    };
    
    checkAndVerifyLocation();
  }, [user, userRoles?.can_edit, hasAttemptedVerification, locationCheckInProgress, verifyLocation]);

  return {
    locationVerified,
    locationError,
    locationCheckInProgress,
    hasAttemptedVerification,
    needsLocationPermission,
    verifyLocation
  };
};
