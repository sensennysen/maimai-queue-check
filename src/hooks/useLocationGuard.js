import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { ERRORS } from '../constants/queue';

/**
 * Provides a guard function to enforce location requirements for sensitive operations.
 * Allows Super Admins to bypass location checks.
 * @param {Object} options - Guard configuration options.
 * @param {boolean} options.locationVerified - Current location verification status.
 * @param {string|null} options.locationError - Current location error message.
 * @param {Function} options.setError - Function to update UI error state.
 * @returns {Object} An object containing the `requireLocationVerification` guard function.
 */
export const useLocationGuard = ({ locationVerified, locationError, setError }) => {
  const { userRoles } = useAuth();

  /**
   * Throws an error if location verification is required but not satisfied.
   * Admins bypass this check entirely.
   * @throws {Error} If location verification required but not verified
   */
  const requireLocationVerification = useCallback(() => {
    // Super Admins bypass location verification
    if (userRoles?.is_super_admin) return;
    
    // Regular Admins and Queue Managers must be verified
    if (!locationVerified) {
      const errorMsg = locationError || ERRORS.LOCATION_REQUIRED;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [userRoles?.is_super_admin, locationVerified, locationError, setError]);

  return { requireLocationVerification };
};
