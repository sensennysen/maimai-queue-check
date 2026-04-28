import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContextProvider';

/**
 * Custom hook to access the global Authentication context.
 * Provides user data, roles, and auth-related actions.
 * @returns {Object} The Authentication context value.
 * @throws {Error} If used outside of an AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};