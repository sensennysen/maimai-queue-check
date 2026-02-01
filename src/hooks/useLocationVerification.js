import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useBranch } from './useBranch';
import { verifyUserLocationAndPermissions, checkGeolocationPermission, requestUserLocation, findNearestBranch } from '../services/geolocation';
import { ERRORS } from '../constants/queue';

const GEOLOCATION_CONSENT_KEY = 'maimai-geolocation-consent';

/**
 * Hook for managing location verification state and geolocation consent flow
 * @returns {import('../types/queue').LocationState & { 
 *   verifyLocation: () => Promise<void>,
 *   showConsentModal: boolean,
 *   geolocationConsent: 'pending' | 'granted' | 'denied' | null,
 *   requestGeolocationConsent: () => void,
 *   handleConsentAccepted: () => Promise<void>,
 *   handleConsentDeclined: () => void
 * }}
 */
export const useLocationVerification = () => {
  const { user, userRoles } = useAuth();
  const { selectedBranch, setSelectedBranch, branches } = useBranch();

  const [locationVerified, setLocationVerified] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationCheckInProgress, setLocationCheckInProgress] = useState(false);
  const [hasAttemptedVerification, setHasAttemptedVerification] = useState(false);
  const [needsLocationPermission, setNeedsLocationPermission] = useState(false);
  
  // Consent flow state
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [geolocationConsent, setGeolocationConsent] = useState(() => {
    // Load saved consent from localStorage
    const saved = localStorage.getItem(GEOLOCATION_CONSENT_KEY);
    return saved ? saved : null;
  });

  // Save consent to localStorage when it changes
  useEffect(() => {
    if (geolocationConsent) {
      localStorage.setItem(GEOLOCATION_CONSENT_KEY, geolocationConsent);
    }
  }, [geolocationConsent]);

  // Check if we should show the consent modal
  useEffect(() => {
    const checkAndShowModal = async () => {
      // Only show modal if:
      // 1. User is logged in
      // 2. User has edit permissions (not admin - admins bypass)
      // 3. User hasn't made a consent decision yet
      // 4. Not currently checking location
      if (!user || !userRoles?.can_edit || userRoles?.is_admin || locationCheckInProgress) {
        return;
      }

      // If consent is already granted or denied, don't show modal
      if (geolocationConsent === 'granted' || geolocationConsent === 'denied') {
        return;
      }

      // Check browser's existing permission state
      const permissionState = await checkGeolocationPermission();
      
      if (permissionState === 'granted') {
        // Browser already has permission, silently verify
        setGeolocationConsent('granted');
        return;
      } else if (permissionState === 'denied') {
        // Browser previously denied, mark as denied
        setGeolocationConsent('denied');
        setLocationError('Location permission was previously denied. Please enable it in your browser settings.');
        return;
      }
      
      // Permission is 'prompt' or 'unavailable' - show our consent modal
      setShowConsentModal(true);
    };

    checkAndShowModal();
  }, [user, userRoles?.can_edit, userRoles?.is_admin, geolocationConsent, locationCheckInProgress]);

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
      
      // Success - mark as granted
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

  // Auto-verify if consent was previously granted
  useEffect(() => {
    if (user && geolocationConsent === 'granted' && !hasAttemptedVerification && !locationCheckInProgress) {
      if (userRoles?.can_edit) {
        verifyLocation();
      }
    }
  }, [user, userRoles?.can_edit, geolocationConsent, hasAttemptedVerification, locationCheckInProgress, verifyLocation]);

  return {
    locationVerified,
    locationError,
    locationCheckInProgress,
    hasAttemptedVerification,
    needsLocationPermission,
    verifyLocation,
    // New consent flow exports
    showConsentModal,
    geolocationConsent,
    requestGeolocationConsent,
    handleConsentAccepted,
    handleConsentDeclined
  };
};
