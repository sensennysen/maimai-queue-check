import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useBranch } from './useBranch';
import { verifyUserLocationAndPermissions, requestUserLocation, findNearestBranch } from '../services/geolocation';
import { ERRORS } from '../constants/queue';

/**
 * Hook for managing location verification state and geolocation consent flow
 * Consent is NOT persisted - modal appears on every page load for users with edit permissions
 */
export const useLocationVerification = () => {
  const { user, userRoles } = useAuth();
  const { selectedBranch, setSelectedBranch, branches } = useBranch();

  const [locationVerified, setLocationVerified] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationCheckInProgress, setLocationCheckInProgress] = useState(false);
  const [hasAttemptedVerification, setHasAttemptedVerification] = useState(false);
  const [needsLocationPermission, setNeedsLocationPermission] = useState(false);
  
  // Consent flow state - NOT persisted to localStorage
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [geolocationConsent, setGeolocationConsent] = useState(null);

  // Check if we should show the consent modal
  // This effect triggers when user logs in or when userRoles become available
  useEffect(() => {
    const checkAndShowModal = () => {
      // Must be logged in
      if (!user) {
        return;
      }

      // Must have userRoles loaded
      if (userRoles === null || userRoles === undefined) {
        return;
      }

      // Admins don't need location consent - they bypass location checks
      if (userRoles.is_admin) {
        return;
      }

      // Must have edit permissions to need geolocation
      if (!userRoles.can_edit) {
        return;
      }

      // Don't show if currently checking location
      if (locationCheckInProgress) {
        return;
      }

      // If user has already made a consent decision this session, don't show modal again
      if (geolocationConsent === 'granted' || geolocationConsent === 'denied') {
        return;
      }

      // Show the consent modal
      setShowConsentModal(true);
    };

    checkAndShowModal();
  }, [user, userRoles, geolocationConsent, locationCheckInProgress]);

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

  // Request user to provide geolocation consent (shows modal)
  const requestGeolocationConsent = useCallback(() => {
    if (!user || geolocationConsent === 'granted' || geolocationConsent === 'denied') {
      return;
    }
    setShowConsentModal(true);
  }, [user, geolocationConsent]);

  // Handle when user accepts consent modal - trigger browser permission
  const handleConsentAccepted = useCallback(async () => {
    setShowConsentModal(false);
    setLocationCheckInProgress(true);
    setGeolocationConsent('pending');

    try {
      // Request location from browser
      const location = await requestUserLocation();
      
      // Success - mark as granted (session only)
      setGeolocationConsent('granted');
      
      // Try to find nearest branch and auto-select it
      if (location && branches.length > 0) {
        try {
          const { nearestBranch } = await findNearestBranch(location);
          if (nearestBranch) {
            setSelectedBranch(nearestBranch);
          }
        } catch {
          // Failed to find nearest branch, continue with current selection
        }
      }
      
      // Now verify location for edit permissions
      await verifyLocation();
    } catch (error) {
      // Browser permission denied or error
      setGeolocationConsent('denied');
      setLocationError(error.message || 'Location permission denied');
      setLocationVerified(false);
    } finally {
      setLocationCheckInProgress(false);
      setHasAttemptedVerification(true);
    }
  }, [branches, setSelectedBranch, verifyLocation]);

  // Handle when user declines consent modal
  const handleConsentDeclined = useCallback(() => {
    setShowConsentModal(false);
    setGeolocationConsent('denied');
    setLocationVerified(false);
    setLocationError('Location features are disabled. Some editing features may be limited.');
    setHasAttemptedVerification(true);
  }, []);

  return {
    locationVerified,
    locationError,
    locationCheckInProgress,
    hasAttemptedVerification,
    needsLocationPermission,
    verifyLocation,
    // Consent flow exports
    showConsentModal,
    geolocationConsent,
    requestGeolocationConsent,
    handleConsentAccepted,
    handleConsentDeclined
  };
};
