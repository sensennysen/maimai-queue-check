import { useEffect, useState } from 'react';
import { authService, rolesService, supabase } from '../services/supabase';
import { useBranch } from '../hooks/useBranch';
import { AuthContext } from './AuthContextProvider';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRoles, setUserRoles] = useState(null);
  const [loading, setLoading] = useState(true);

  const { selectedBranch } = useBranch();

  // Helper to manage local storage cache
  const getCachedRoles = (uid) => {
    try {
      const cached = localStorage.getItem(`smf_user_roles_${uid}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const cacheRoles = (uid, roles) => {
    try {
      localStorage.setItem(`smf_user_roles_${uid}`, JSON.stringify(roles));
    } catch (e) {
      console.warn('Failed to cache user roles', e);
    }
  };

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
          // Fetch roles in background (non-blocking) with timeout
          const branchId = selectedBranch?.id;
          const rolesPromise = rolesService.getUserRoles(currentUser.id, branchId);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Role fetch timeout')), 5000)
          );

          try {
            const roles = await Promise.race([rolesPromise, timeoutPromise]);
            if (isMounted) {
              setUserRoles(roles);
              cacheRoles(currentUser.id, roles);
            }
          } catch {
            // Set default permissions on error (keep existing permissions if available)
            if (isMounted) setUserRoles(prevRoles =>
              prevRoles || {
                user_id: currentUser.id,
                can_edit: false,
                is_admin: false,
                is_super_admin: false
              }
            );
          }
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
  }, [selectedBranch?.id]); // Re-subscribe/re-run when branch changes to ensure correct roles are fetched

  // Add real-time subscription for role changes
  useEffect(() => {
    if (!user) {
      return;
    }

    const channel = supabase
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
            setUserRoles(null);
          } else {
            // Normalize data exactly like getUserRoles
            const newData = payload.new;
            setUserRoles({
              ...newData,
              is_admin: !!newData.is_admin,
              is_super_admin: !!newData.is_super_admin,
              preferred_branches: Array.isArray(newData.preferred_branches) ? newData.preferred_branches : []
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};