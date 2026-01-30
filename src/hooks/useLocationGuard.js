import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { ERRORS } from '../constants/queue';

/**
 * Hook that provides a function to guard queue operations requiring location verification
 * @param {Object} options
 * @param {boolean} options.locationVerified - Whether location is verified
 * @param {string|null} options.locationError - Current location error message
 * @param {(error: string) => void} options.setError - Function to set error state
 * @returns {{ requireLocationVerification: () => void }}
 */
export const useLocationGuard = ({ locationVerified, locationError, setError }) => {
  const { userRoles } = useAuth();

  /**
   * Throws an error if location verification is required but not satisfied.
   * Admins bypass this check entirely.
   * @throws {Error} If location verification required but not verified
   */
  const requireLocationVerification = useCallback(() => {
    // Admins bypass location verification
    if (userRoles?.is_admin) return;
    
    if (!locationVerified) {
      const errorMsg = locationError || ERRORS.LOCATION_REQUIRED;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [userRoles?.is_admin, locationVerified, locationError, setError]);

  return { requireLocationVerification };
};
