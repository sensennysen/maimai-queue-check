import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useBranch } from './useBranch';
import { verifyUserLocationAndPermissions, checkGeolocationPermission, findNearestBranch } from '../services/geolocation';
import { ERRORS } from '../constants/queue';

/**
 * Hook for managing location verification state and geolocation consent flow
 * If browser already has location permission granted, skips the modal
 */
export const useLocationVerification = () => {
  const { user, userRoles } = useAuth();
  const { selectedBranch, setSelectedBranch, branches, refreshLocation, hasManuallySelected } = useBranch();

  const [locationVerified, setLocationVerified] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationCheckInProgress, setLocationCheckInProgress] = useState(false);
  const [hasAttemptedVerification, setHasAttemptedVerification] = useState(false);
  const [needsLocationPermission, setNeedsLocationPermission] = useState(false);
  
  // Consent flow state
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [geolocationConsent, setGeolocationConsent] = useState(null);

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
        userRoles?.is_super_admin || false
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
  }, [user, selectedBranch?.id, userRoles?.is_super_admin]);
  
  // Reset verification state when branch or user changes
  useEffect(() => {
    setLocationVerified(false);
    setHasAttemptedVerification(false);
    setLocationError(null);
  }, [selectedBranch?.id, user?.id]);

  // Check if we should show the consent modal
  useEffect(() => {
    const checkAndShowModal = async () => {
      // Must be logged in
      if (!user) {
        return;
      }

      // Must have userRoles loaded
      if (userRoles === null || userRoles === undefined) {
        return;
      }

      // Admins don't need location consent - they bypass location checks
      if (userRoles.is_super_admin) {
        return;
      }

      // Must have edit permissions (either global or for this branch) to need geolocation
      const canEditGlobal = userRoles.can_edit ?? false;
      const canEditOn = Array.isArray(userRoles.can_edit_on) ? userRoles.can_edit_on : [];
      const canEditBranch = selectedBranch 
        ? canEditOn.some(id => String(id) === String(selectedBranch.id)) 
        : false;

      if (!canEditGlobal && !canEditBranch) {
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

      // Check browser's existing permission state
      const permissionState = await checkGeolocationPermission();
      
      if (permissionState === 'granted') {
        // Browser already has permission granted - skip modal and auto-verify
        setGeolocationConsent('granted');
        return;
      } else if (permissionState === 'denied') {
        // Browser previously denied - skip modal, just show the alert
        setGeolocationConsent('denied');
        setLocationError('Geolocation services are disabled. Editing features are unavailable.');
        setHasAttemptedVerification(true);
        return;
      }

      // Permission is 'prompt' - show our consent modal
      setShowConsentModal(true);
    };

    checkAndShowModal();
  }, [user, userRoles, geolocationConsent, locationCheckInProgress, selectedBranch]);

  // Auto-verify when consent is granted (either from modal or auto-detected)
  useEffect(() => {
    if (user && geolocationConsent === 'granted' && !hasAttemptedVerification && !locationCheckInProgress) {
      // Check permission again using the composite logic
      const canEditGlobal = userRoles?.can_edit ?? false;
      const canEditOn = Array.isArray(userRoles?.can_edit_on) ? userRoles.can_edit_on : [];
      const canEditBranch = selectedBranch 
        ? canEditOn.some(id => String(id) === String(selectedBranch.id)) 
        : false;

      if (canEditGlobal || canEditBranch) {
        verifyLocation();
      }
    }
  }, [user, userRoles?.can_edit, geolocationConsent, hasAttemptedVerification, locationCheckInProgress, verifyLocation, selectedBranch, userRoles?.can_edit_on]);

  // Handle when user accepts consent modal - trigger browser permission
  const handleConsentAccepted = useCallback(async () => {
    setShowConsentModal(false);
    setLocationCheckInProgress(true);
    setGeolocationConsent('pending');

    try {
      // Request location from browser via BranchContext to ensure global state update
      const location = await refreshLocation();
      
      // Success - mark as granted
      setGeolocationConsent('granted');
      
      // Try to find nearest branch and auto-select it ONLY if no manual selection this session
      if (location && branches.length > 0 && !hasManuallySelected) {
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
  }, [branches, setSelectedBranch, verifyLocation, refreshLocation]);

  // Handle when user declines consent modal
  const handleConsentDeclined = useCallback(() => {
    setShowConsentModal(false);
    setGeolocationConsent('denied');
    setLocationVerified(false);
    setLocationError('Geolocation services are disabled. Editing features are unavailable.');
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
    handleConsentAccepted,
    handleConsentDeclined
  };
};
