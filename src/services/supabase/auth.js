import { supabase } from './client';
import { TABLES } from '../../constants/database';

// Authentication service functions
export const authService = {
  // Sign in with OAuth provider
  async signInWithProvider(provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin
      }
    });
    
    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  getCurrentUser() {
    return supabase.auth.getUser();
  },

  // Subscribe to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// User roles service functions
export const rolesService = {
  // Fetch user roles/permissions and profile data
  async getUserRoles(userId, branchIdOptional) {
    try {
      const [roleResult, profileResult] = await Promise.all([
        supabase
          .from(TABLES.USER_ROLES)
          .select('user_id, can_edit, can_edit_on, is_admin, is_super_admin, admin_branch, queue_name')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle(),
        
        supabase
          .from(TABLES.USER_PROFILES)
          .select(`id, display_name, preferred_branches, main_branch, maimai_dx_name, maimai_best_scores, maimai_scores_updated_at, display_photo_url, dx_display_photo_url, slug, slug_updated_at, privacy_settings, is_public, ${TABLES.USER_ATTRIBUTIONS}(attributions)`)
          .eq('id', userId)
          .maybeSingle()
      ]);

      const { data: roleData } = roleResult;
      const { data: profileData } = profileResult;

      // If both missing, return safe defaults
      if (!roleData && !profileData) {
        return {
          user_id: userId,
          can_edit: false,
          can_edit_on: [],
          is_admin: false,
          is_super_admin: false,
          preferred_branches: [],
          display_name: null,
          queue_name: null
        };
      }

      const normalizedCanEditOn = Array.isArray(roleData?.can_edit_on)
        ? roleData.can_edit_on.map(id => typeof id === 'string' ? parseInt(id, 10) : id).filter(n => !isNaN(n))
        : [];

      // Merge data, preferring profileData for profile fields
      // Default to roleData if profileData missing (backward compat)
      const mergedData = {
        user_id: userId,
        // Permissions from roleData
        can_edit: !!roleData?.can_edit,
        can_edit_on: normalizedCanEditOn,
        is_admin: !!roleData?.is_admin,
        is_super_admin: !!roleData?.is_super_admin,
        admin_branch: roleData?.admin_branch || null,
        
        // Profile fields - prefer profileData only (user_roles no longer stores display_name)
        display_name: profileData?.display_name || null,
        queue_name: roleData?.queue_name || null,
        
        // Get preferred_branches directly from user_profiles
        preferred_branches: Array.isArray(profileData?.preferred_branches) 
          ? profileData.preferred_branches.map(id => typeof id === 'string' ? parseInt(id, 10) : id).filter(id => !isNaN(id))
          : [],
          
        // Maimai fields (only in profileData)
        maimai_dx_name: profileData?.maimai_dx_name || null,
        maimai_best_scores: profileData?.maimai_best_scores || null,

        maimai_scores_updated_at: profileData?.maimai_scores_updated_at || null,
        
        // Display Photos
        display_photo_url: profileData?.display_photo_url || null,
        dx_display_photo_url: profileData?.dx_display_photo_url || null,

        // Main Branch
        main_branch: profileData?.main_branch ?? null,

        // Profile sharing & Privacy
        slug: profileData?.slug || null,
        slug_updated_at: profileData?.slug_updated_at || null,
        privacy_settings: profileData?.privacy_settings || {
          show_maimai_name: true,
          show_dx_rating: true,
          show_best_50: true,
          show_favorite_songs: true,
          show_playlists: true,
          show_main_branch: true,
          show_preferred_branches: true
        },
        is_public: !!profileData?.is_public
      };

      if (branchIdOptional !== undefined && branchIdOptional !== null) {
        mergedData.canEditInBranch = mergedData.can_edit || mergedData.can_edit_on.some(id => String(id) === String(branchIdOptional));
      }
      
      return mergedData;

    } catch (err) {
      console.error('Error fetching user roles/profile:', err);
      return {
        user_id: userId,
        can_edit: false,
        can_edit_on: [],
        is_admin: false,
        is_super_admin: false
      };
    }
  }
};

export const subscribeToUserRoleChanges = (callback) => {
  const channel = supabase
    .channel('user_role_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.USER_ROLES
      },
      (payload) => {
        if (callback && typeof callback === 'function') {
          callback(payload);
        }
      }
    )
    .subscribe();

  return channel;
};
