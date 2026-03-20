import { supabase } from './client';
import { validateData, userProfileSchema } from '../../utils/validation';
import { validateImageUpload, getNormalizedFileExtension } from '../../utils/uploadValidation';
import { TABLES, BUCKETS } from '../../constants/database';
import { LIMITS } from '../../constants/limits';

/**
 * Service for user profile management
 */
export const userService = {
  // Update user preferences
  async updatePreferences(userId, { branch_ids, display_name, queue_name, main_branch, is_public, privacy_settings }) {
    const updateData = {};
    if (branch_ids !== undefined) updateData.preferred_branches = branch_ids;
    if (display_name !== undefined) updateData.display_name = display_name;
    if (main_branch !== undefined) updateData.main_branch = main_branch;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (privacy_settings !== undefined) updateData.privacy_settings = privacy_settings;
    
    // VALIDATION
    if (display_name) {
        const validation = validateData(userProfileSchema.pick({ display_name: true }), { display_name });
        if (!validation.success) throw new Error(validation.error);
    }
    if (queue_name !== undefined) {
        if (queue_name) {
          const validation = validateData(userProfileSchema.pick({ queue_name: true }), { queue_name });
          if (!validation.success) throw new Error(validation.error);
        }
    }
    
    const profileUpdateData = { ...updateData };
    // queue_name is stored in user_roles, not user_profiles
    delete profileUpdateData.queue_name;
    
    // Update user_profiles (Primary)
    let profileData = null;
    if (Object.keys(profileUpdateData).length > 0) {
      const { data, error: profileError } = await supabase
        .from(TABLES.USER_PROFILES)
        .update({ 
          ...profileUpdateData, 
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .maybeSingle();
      if (profileError) throw profileError;
      profileData = data;
    }

    // Save queue_name directly to user_roles
    if (queue_name !== undefined) {
      await supabase
        .from(TABLES.USER_ROLES)
        .update({ queue_name: queue_name || null })
        .eq('user_id', userId);
    }

    return profileData;
  },
  
  // Update maimai profile specifically
  async updateMaimaiProfile(userId, { maimai_dx_name, dx_display_photo_url, circle_name }) {
    const updates = {
      id: userId,
      updated_at: new Date().toISOString()
    };

    if (maimai_dx_name !== undefined) updates.maimai_dx_name = maimai_dx_name;
    if (dx_display_photo_url !== undefined) updates.dx_display_photo_url = dx_display_photo_url;
    if (circle_name !== undefined) updates.circle_name = circle_name;

    const { data, error } = await supabase
      .from(TABLES.USER_PROFILES)
      .upsert(updates)
      .select()
      .maybeSingle();
      
    if (error) throw error;
    return data;
  },

  // Update maimai best scores (Calculated Top 50)
  async updateMaimaiBestScores(userId, best_scores) {
    const { data, error } = await supabase
      .from(TABLES.USER_PROFILES)
      .upsert({
        id: userId,
        maimai_best_scores: best_scores,
        maimai_scores_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Save recent play history (JSON storage)
  async saveRecentPlays(userId, recentPlays) {
    if (!userId || !Array.isArray(recentPlays)) return;

    const { error } = await supabase
      .from(TABLES.USER_PROFILES)
      .update({ 
        recent_plays: recentPlays,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  },

  // Get recent play history (from JSON storage)
  async getRecentPlays(userId) {
    const { data, error } = await supabase
      .from(TABLES.USER_PROFILES)
      .select('recent_plays')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.recent_plays || [];
  },

  // Save all raw scores from import
  async saveUserAllScores(userId, allScores) {
    const { data, error } = await supabase
      .from(TABLES.USER_ALL_SCORES)
      .upsert({
        user_id: userId,
        all_scores: allScores,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get users who have a specific branch in their preferred_branches
  async getUsersPrefersBranch(branchId) {
    if (!branchId) return [];

    const { data: profiles, error } = await supabase
        .from(TABLES.USER_PROFILES)
        .select(`id, ${TABLES.USER_ROLES}(queue_name)`)
        .contains('preferred_branches', [branchId]);
    
    if (error) throw error;
    return (profiles || []).map(p => ({ queue_name: p.user_roles?.queue_name || null }));
  },

  // Get profile by slug
  async getProfileBySlug(slug) {
    if (!slug) return null;

    const { data, error: profileError } = await supabase
      .from(TABLES.USER_PROFILES)
      .select(`id, display_name, ${TABLES.USER_ROLES}(queue_name), maimai_dx_name, circle_name, maimai_best_scores, maimai_scores_updated_at, recent_plays, display_photo_url, dx_display_photo_url, main_branch, preferred_branches, privacy_settings, is_public, slug, slug_updated_at, introduction, user_attributions(attributions)`)
      .eq('slug', slug.toLowerCase())
      .maybeSingle();

    if (profileError) throw profileError;
    return data;
  },

  // Search public profiles by display name or slug
  async searchPublicProfiles(query, limit = LIMITS.FEED_ACTIVITY) {
    const trimmed = query?.trim();
    if (!trimmed) return [];

    const search = `%${trimmed}%`;
    const { data, error } = await supabase
      .from(TABLES.USER_PROFILES)
      .select('id, display_name, slug, display_photo_url, dx_display_photo_url, is_public')
      .eq('is_public', true)
      .or(`display_name.ilike.${search},slug.ilike.${search}`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Update profile slug (once every 60 days)
  async updateProfileSlug(userId, slug) {
    if (!userId) throw new Error('User ID is required');

    const validation = validateData(userProfileSchema.pick({ slug: true }), { slug });
    if (!validation.success) throw new Error(validation.error);

    const { data: existingProfile, error: errorFetch } = await supabase
      .from(TABLES.USER_PROFILES)
      .select('slug, slug_updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (errorFetch) throw errorFetch;

    if (existingProfile?.slug_updated_at) {
      const lastUpdate = new Date(existingProfile.slug_updated_at);
      const sixtyDaysInMs = 60 * 24 * 60 * 60 * 1000;
      const nextUpdateAllowed = lastUpdate.getTime() + sixtyDaysInMs;
      const now = new Date().getTime();

      if (now < nextUpdateAllowed) {
        const daysRemaining = Math.ceil((nextUpdateAllowed - now) / (24 * 60 * 60 * 1000));
        throw new Error(`Profile URL can only be updated once every 60 days. Please wait ${daysRemaining} more days.`);
      }
    }

    const normalizedSlug = slug.toLowerCase();
    if (normalizedSlug !== existingProfile?.slug) {
      const { data: existing } = await supabase
        .from(TABLES.USER_PROFILES)
        .select('id')
        .eq('slug', normalizedSlug)
        .maybeSingle();

      if (existing) {
        throw new Error('This profile URL is already taken. Please choose another one.');
      }
    }

    const { data: updated, error } = await supabase
      .from(TABLES.USER_PROFILES)
      .upsert({
        id: userId,
        slug: normalizedSlug,
        slug_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return updated;
  },

  // Update privacy settings
  async updatePrivacySettings(userId, settings) {
    if (!userId) throw new Error('User ID is required');

    const { data, error } = await supabase
      .from(TABLES.USER_PROFILES)
      .upsert({
        id: userId,
        privacy_settings: settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Clear maimai related data (scores, photo, name)
  async clearMaimaiData(userId) {
    if (!userId) throw new Error('User ID is required');

    const { error: profileError } = await supabase
      .from(TABLES.USER_PROFILES)
      .update({
        maimai_best_scores: null,
        maimai_scores_updated_at: null,
        recent_plays: null,
        dx_display_photo_url: null,
        maimai_dx_name: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) throw profileError;

    await supabase.from(TABLES.USER_MOST_PLAYED_SONGS).delete().eq('user_id', userId);
    await supabase.from(TABLES.USER_ALL_SCORES).delete().eq('user_id', userId);

    return { success: true };
  },

  // Get own profile by userId
  async getOwnProfile(userId) {
    if (!userId) return null;

    const { data, error } = await supabase
      .from(TABLES.USER_PROFILES)
      .select(`id, display_name, ${TABLES.USER_ROLES}(queue_name), maimai_dx_name, circle_name, recent_plays, display_photo_url, dx_display_photo_url, main_branch, preferred_branches, privacy_settings, is_public, slug, slug_updated_at, introduction`)
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Update custom profile picture
  async updateProfilePicture(userId, photoUrl) {
    if (!userId) throw new Error('User ID is required');

    const { data, error } = await supabase
      .from(TABLES.USER_PROFILES)
      .update({
        display_photo_url: photoUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Upload file to profile-pictures bucket
  async uploadProfilePicture(userId, file) {
    if (!userId) throw new Error('User ID is required');
    
    validateImageUpload(file);

    const fileExt = getNormalizedFileExtension(file.type);
    if (!fileExt) throw new Error('Unsupported image extension');

    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error } = await supabase.storage
      .from(BUCKETS.PROFILE_PICTURES)
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKETS.PROFILE_PICTURES)
      .getPublicUrl(filePath);

    return publicUrl;
  },

  // Extract storage path from public URL
  extractStoragePath(url) {
    if (!url) return null;
    const bucketName = BUCKETS.PROFILE_PICTURES;
    const marker = `/public/${bucketName}/`;
    if (url.includes(marker)) {
      return url.split(marker).pop().split('?')[0];
    }
    return null;
  },

  // Update introduction text
  async updateIntroduction(userId, text) {
    if (!userId) throw new Error('User ID is required');

    const validation = validateData(userProfileSchema.pick({ introduction: true }), { introduction: text });
    if (!validation.success) throw new Error(validation.error);

    const { data, error } = await supabase
      .from(TABLES.USER_PROFILES)
      .update({
        introduction: text || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete file from profile-pictures bucket
  async deleteProfilePictureFile(path) {
    if (!path) return;
    const { error } = await supabase.storage
      .from(BUCKETS.PROFILE_PICTURES)
      .remove([path]);
    
    if (error) {
      console.error('Error deleting profile picture file:', error);
    }
  }
};
