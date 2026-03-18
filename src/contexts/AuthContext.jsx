import { useEffect, useState, useCallback } from 'react';
import { authService, rolesService, supabase } from '../services/supabase';
import { useBranch } from '../hooks/useBranch';
import { notifications } from '@mantine/notifications';
import { AuthContext } from './AuthContextProvider';
import { TABLES } from '../constants/database';

/**
 * Provider component for the global Authentication context.
 * Manages user session, role-based permissions, and synchronization with the database.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to be wrapped by the provider.
 * @returns {JSX.Element} The rendered context provider.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRoles, setUserRoles] = useState(null);
  const [loading, setLoading] = useState(true);

  const { selectedBranch } = useBranch();

  /**
   * Retrieves cached user roles from local storage.
   * Supports both legacy and current SMAD-specific cache keys.
   * @param {string} uid - The unique identifier of the user.
   * @returns {Object|null} The parsed role object from cache or null if missing/invalid.
   */
  const getCachedRoles = (uid) => {
    try {
      // Try new key first, fall back to old key for backward compatibility
      let cached = localStorage.getItem(`user_roles_${uid}`);
      if (!cached) {
        cached = localStorage.getItem(`smf_user_roles_${uid}`);
      }
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  /**
   * Stores current user roles in local storage for performance optimization.
   * @param {string} uid - The unique identifier of the user.
   * @param {Object} roles - The roles object to be serialized and cached.
   * @returns {void}
   */
  const cacheRoles = (uid, roles) => {
    try {
      // write using new key
      localStorage.setItem(`user_roles_${uid}`, JSON.stringify(roles));
    } catch (e) {
      console.warn('Failed to cache user roles', e);
    }
  };

  /**
   * Triggers a fresh fetch of user roles and permissions from the service layer.
   * Includes a 5-second timeout safety and background caching.
   * @returns {Promise<Object|null>} A promise resolving to the refreshed roles or null on failure.
   */
  const refreshUserRoles = useCallback(async () => {
    if (!user) return null;

    // Fetch roles in background (non-blocking) with timeout
    const branchId = selectedBranch?.id;
    const rolesPromise = rolesService.getUserRoles(user.id, branchId);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Role fetch timeout')), 5000)
    );

    try {
      const roles = await Promise.race([rolesPromise, timeoutPromise]);
      setUserRoles(roles);
      cacheRoles(user.id, roles);
      return roles;
    } catch {
      // Set default permissions on error (keep existing permissions if available)
      setUserRoles(prevRoles =>
        prevRoles || {
          user_id: user.id,
          can_edit: false,
          is_admin: false,
          is_super_admin: false
        }
      );

      // Surface UI notification for error handling
      notifications.show({
        title: 'Roles could not be loaded',
        message: 'There was a problem loading your permissions. Some actions may be temporarily unavailable.',
        color: 'yellow',
        autoClose: 5000,
      });

      return null;
    }
  }, [user, selectedBranch?.id]);

  useEffect(() => {
    // Listen for auth changes - this properly handles session restoration on page load
    let isMounted = true;

    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      try {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        // Optimistically set roles from cache if available
        if (currentUser) {
          const cached = getCachedRoles(currentUser.id);
          if (cached) {
            setUserRoles(cached);
          }
        }

        // Set loading to false immediately - don't wait for network fetch of roles
        setLoading(false);

        if (currentUser) {
          // We can't use the hoisted refreshUserRoles directly here because it depends on 'user' state 
          // which is being set in this very callback. However, we can duplicate the logic 
          // OR rely on the separate effect below that reacts to 'user' or 'selectedBranch'.
          //
          // ADDITIONALLY: We need to ensure we fetch based on the currentUser from the event, 
          // not the closure 'user' which might be stale.

          // To be safe and clean, let's just let the effect below handle the fetching
          // when 'user' state updates.
        } else {
          if (isMounted) setUserRoles(null);
        }
      } catch {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Effect to fetch roles whenever user or branch changes
  useEffect(() => {
    if (user) {
      refreshUserRoles();
    }
  }, [user, refreshUserRoles]);

  // Add real-time subscription for role and profile changes
  useEffect(() => {
    if (!user) {
      return;
    }

    const rolesChannel = supabase
      .channel(`user-roles-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.USER_ROLES,
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            // If role row deleted, we might still have a profile, but usually this means user gone?
            // For now, let's just re-fetch to be safe and consistent
            refreshUserRoles();
          } else {
            const newData = payload.new;
            setUserRoles(prev => ({
              ...prev,
              ...newData,
              is_admin: !!newData.is_admin,
              is_super_admin: !!newData.is_super_admin,
            }));
            // Trigger re-fetch to ensure consistency
            refreshUserRoles();
          }
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel(`user-profiles-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.USER_PROFILES,
          filter: `id=eq.${user.id}`,
        },
        () => {
          // Profile changed/added/deleted
          // Just re-fetch the world state
          refreshUserRoles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rolesChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [user, refreshUserRoles]);

  /**
   * Initiates an external OAuth sign-in flow (e.g., Discord, Google).
   * @param {string} provider - The case-sensitive name of the OAuth provider.
   * @returns {Promise<void>} A promise that resolves when the flow is initiated.
   */
  const signInWithProvider = async (provider) => {
    setLoading(true);
    try {
      await authService.signInWithProvider(provider);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Terminates the current session and clears all local auth/role caches.
   * @returns {Promise<void>} A promise that resolves when the sign-out is complete.
   */
  const signOut = async () => {
    setLoading(true);
    try {
      // Clear role cache before signing out
      if (user?.id) {
        localStorage.removeItem(`user_roles_${user.id}`);
        localStorage.removeItem(`smf_user_roles_${user.id}`);
      }

      // Safety fallback: clear any lingering role caches from previous sessions
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('smf_user_roles_') || key.startsWith('user_roles_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      await authService.signOut();
      setUser(null);
      setUserRoles(null);
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
    refreshUserRoles,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
