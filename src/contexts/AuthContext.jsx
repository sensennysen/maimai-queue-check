import { useEffect, useState } from 'react';
import { authService, rolesService } from '../services/supabase';
import { useBranch } from '../hooks/useBranch';
import { AuthContext } from './AuthContextProvider';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRoles, setUserRoles] = useState(null);
  const [loading, setLoading] = useState(true);

  const { selectedBranch } = useBranch();

  useEffect(() => {
    // Listen for auth changes - this properly handles session restoration on page load
    let isMounted = true;

    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      try {
        setUser(session?.user ?? null);

        // Set loading to false immediately - don't wait for roles
        setLoading(false);

        // Success notifications are shown from explicit login actions
        // (avoid showing toasts during automatic session restoration on page load)

        if (session?.user) {
          // Fetch roles in background (non-blocking) with timeout
          const branchId = selectedBranch?.id;
          const rolesPromise = rolesService.getUserRoles(session.user.id, branchId);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Role fetch timeout')), 5000)
          );

          try {
            const roles = await Promise.race([rolesPromise, timeoutPromise]);
            if (isMounted) setUserRoles(roles);
          } catch {
            // Set default permissions on error (keep existing permissions if available)
            if (isMounted) setUserRoles(prevRoles =>
              prevRoles || {
                user_id: session.user.id,
                can_edit: false,
                is_admin: false,
                is_super_admin: false
              }
            );
          }

          // Roles are fetched on auth state change or branch change - no need for polling
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