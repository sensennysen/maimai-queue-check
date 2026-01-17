import { useEffect, useState, useRef } from 'react';
import { authService, rolesService } from '../services/supabase';
import { AuthContext } from './AuthContextProvider';
import { notifications } from '@mantine/notifications';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRoles, setUserRoles] = useState(null);
  const [loading, setLoading] = useState(true);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Listen for auth changes - this properly handles session restoration on page load
    let isMounted = true;
    let rolesCheckInterval = null;

    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      try {
        setUser(session?.user ?? null);

        // Set loading to false immediately - don't wait for roles
        setLoading(false);

        // Show success toast only on actual new login
        // Skip on initial mount (session restoration from localStorage)
        if (session?.user && !isInitialMount.current) {
          notifications.show({
            title: 'Login Successful',
            message: `Welcome! You have been logged in.`,
            color: 'green',
          });
        }

        // Mark that we've passed the initial mount
        if (isInitialMount.current) {
          isInitialMount.current = false;
        }

        if (session?.user) {
          // Clear any existing roles check interval
          if (rolesCheckInterval) clearInterval(rolesCheckInterval);

          // Fetch roles in background (non-blocking) with timeout
          const rolesPromise = rolesService.getUserRoles(session.user.id);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Role fetch timeout')), 5000)
          );

          try {
            const roles = await Promise.race([rolesPromise, timeoutPromise]);
            if (isMounted) setUserRoles(roles);
          } catch (roleError) {
            console.error('Error fetching user roles:', roleError);
            // Set default permissions on error (keep existing permissions if available)
            if (isMounted) setUserRoles(prevRoles =>
              prevRoles || {
                user_id: session.user.id,
                can_edit: false,
                is_admin: false
              }
            );
          }

          // Periodically re-check roles every 30 seconds to ensure they don't get lost
          rolesCheckInterval = setInterval(async () => {
            if (!isMounted) return;
            try {
              const roles = await rolesService.getUserRoles(session.user.id);
              if (isMounted) setUserRoles(roles);
            } catch (err) {
              console.error('Error rechecking user roles:', err);
              // Don't clear roles on recheck error, just log it
            }
          }, 30000);
        } else {
          if (rolesCheckInterval) clearInterval(rolesCheckInterval);
          if (isMounted) setUserRoles(null);
        }
      } catch (unexpectedError) {
        console.error('Unexpected error in auth state change:', unexpectedError);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (rolesCheckInterval) clearInterval(rolesCheckInterval);
      subscription?.unsubscribe();
    };
  }, []);

  const signInWithProvider = async (provider) => {
    try {
      setLoading(true);
      await authService.signInWithProvider(provider);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
      setUserRoles(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    userRoles,
    loading,
    signInWithProvider,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};