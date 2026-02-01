import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useBranch } from './useBranch';
import { verifyUserLocationAndPermissions, requestUserLocation, findNearestBranch } from '../services/geolocation';
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
  // This effect triggers when user logs in or when userRoles become available
  useEffect(() => {
    const checkAndShowModal = () => {
      console.log('[Geolocation] Checking modal conditions:', {
        user: !!user,
        userRoles,
        geolocationConsent,
        locationCheckInProgress
      });

      // Must be logged in
      if (!user) {
        console.log('[Geolocation] Modal not shown: user not logged in');
        return;
      }

      // Must have userRoles loaded (not null/undefined)
      if (userRoles === null || userRoles === undefined) {
        console.log('[Geolocation] Modal not shown: userRoles not loaded yet');
        return;
      }

      // Admins don't need location consent - they bypass location checks
      if (userRoles.is_admin) {
        console.log('[Geolocation] Modal not shown: user is admin');
        return;
      }

      // Must have edit permissions to need geolocation
      if (!userRoles.can_edit) {
        console.log('[Geolocation] Modal not shown: user does not have can_edit permission');
        return;
      }

      // Don't show if currently checking location
      if (locationCheckInProgress) {
        console.log('[Geolocation] Modal not shown: location check in progress');
        return;
      }

      // If user has already made a consent decision (stored in localStorage), don't show modal
      if (geolocationConsent === 'granted' || geolocationConsent === 'denied') {
        console.log('[Geolocation] Modal not shown: consent already decided:', geolocationConsent);
        return;
      }

      // User is logged in, has edit permissions, and hasn't made consent decision yet
      // Show the consent modal
      console.log('[Geolocation] ✓ Showing consent modal');
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

  // Auto-verify if consent was previously granted (on page load with saved consent)
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
