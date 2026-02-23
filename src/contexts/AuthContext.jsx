import { useEffect, useState, useCallback } from 'react';
import { authService, rolesService, supabase } from '../services/supabase';
import { useBranch } from '../hooks/useBranch';
import { notifications } from '@mantine/notifications';
import { AuthContext } from './AuthContextProvider';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRoles, setUserRoles] = useState(null);
  const [loading, setLoading] = useState(true);

  const { selectedBranch } = useBranch();

  // Helper to manage local storage cache
  const getCachedRoles = (uid) => {
    try {
      // SEC-04: Try new key first, fall back to old key for backward compatibility
      let cached = localStorage.getItem(`user_roles_${uid}`);
      if (!cached) {
        cached = localStorage.getItem(`smf_user_roles_${uid}`);
      }
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const cacheRoles = (uid, roles) => {
    try {
      // SEC-04: write using new key
      localStorage.setItem(`user_roles_${uid}`, JSON.stringify(roles));
    } catch (e) {
      console.warn('Failed to cache user roles', e);
    }
  };

  // Define fetch roles logic as a reusable function
  // Define fetch roles logic as a reusable function
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

      // Surface UI notification per FRAG-03 requirement
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
          table: 'user_roles',
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
          table: 'user_profiles',
          filter: `id=eq.${user.id}`,
        },
        () => {
          // Profile changed/added/deleted
          // Just re-fetch the merged world state
          refreshUserRoles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rolesChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [user, refreshUserRoles]);

  const signInWithProvider = async (provider) => {
    setLoading(true);
    try {
      await authService.signInWithProvider(provider);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // SEC-01: Clear role cache before signing out
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