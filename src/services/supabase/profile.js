import { supabase } from './client';
import { validateData, userProfileSchema } from '../../utils/validation';

// User service functions
export const userService = {
  // Update user preferences
  async updatePreferences(userId, { branch_ids, display_name, queue_name, main_branch, is_public }) {
    const updateData = {};
    if (branch_ids !== undefined) updateData.preferred_branches = branch_ids;
    if (display_name !== undefined) updateData.display_name = display_name;
    if (main_branch !== undefined) updateData.main_branch = main_branch;
    if (is_public !== undefined) updateData.is_public = is_public;
    
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
        .from('user_profiles')
        .upsert({ 
          id: userId,
          ...profileUpdateData, 
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (profileError) throw profileError;
      profileData = data;
    }

    // Save queue_name directly to user_roles
    if (queue_name !== undefined) {
      await supabase
        .from('user_roles')
        .update({ queue_name: queue_name || null })
        .eq('user_id', userId);
    }

    return profileData;
  },
  
  // Update maimai profile specifically
  async updateMaimaiProfile(userId, { maimai_dx_name, dx_display_photo_url }) {
    const updates = {
      id: userId,
      updated_at: new Date().toISOString()
    };

    if (maimai_dx_name !== undefined) updates.maimai_dx_name = maimai_dx_name;
    if (dx_display_photo_url !== undefined) updates.dx_display_photo_url = dx_display_photo_url;

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(updates)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // Update maimai best scores (Calculated Top 50)
  async updateMaimaiBestScores(userId, best_scores) {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        maimai_best_scores: best_scores,
        maimai_scores_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Save all raw scores from import
  async saveUserAllScores(userId, allScores) {
    const { data, error } = await supabase
      .from('user_all_scores')
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
        .from('user_profiles')
        .select('id, user_roles(queue_name)')
        .contains('preferred_branches', [branchId]);
    
    if (error) throw error;
    // Flatten for easy access: [{ queue_name: '...' }, ...]
    return (profiles || []).map(p => ({ queue_name: p.user_roles?.queue_name || null }));
  },

  // Get profile by slug
  async getProfileBySlug(slug) {
    if (!slug) return null;

    const { data, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, display_name, user_roles(queue_name), maimai_dx_name, maimai_best_scores, maimai_scores_updated_at, display_photo_url, dx_display_photo_url, main_branch, preferred_branches, privacy_settings, is_public, slug, slug_updated_at, introduction, user_attributions(attributions)')
      .eq('slug', slug.toLowerCase())
      .maybeSingle();

    if (profileError) throw profileError;
    return data;
  },

  // Update profile slug (once every 60 days)
  async updateProfileSlug(userId, slug) {
    if (!userId) throw new Error('User ID is required');

    // 1. Validate slug
    const validation = validateData(userProfileSchema.pick({ slug: true }), { slug });
    if (!validation.success) throw new Error(validation.error);

    // 2. Fetch current profile to check last update
    const { data: existingProfile, error: errorFetch } = await supabase
      .from('user_profiles')
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

    // 3. Check uniqueness if changing
    const normalizedSlug = slug.toLowerCase();
    if (normalizedSlug !== existingProfile?.slug) {
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('slug', normalizedSlug)
        .maybeSingle();

      if (existing) {
        throw new Error('This profile URL is already taken. Please choose another one.');
      }
    }

    // 4. Update
    const { data: updated, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        slug: normalizedSlug,
        slug_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  // Update privacy settings
  async updatePrivacySettings(userId, settings) {
    if (!userId) throw new Error('User ID is required');

    const { data, error } = await supabase
      .from('user_profiles')
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

    // 1. Clear profile fields
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        maimai_best_scores: null,
        maimai_scores_updated_at: null,
        dx_display_photo_url: null,
        maimai_dx_name: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) throw profileError;

    // 2. Delete from user_most_played_songs
    const { error: mostPlayedError } = await supabase
      .from('user_most_played_songs')
      .delete()
      .eq('user_id', userId);

    if (mostPlayedError) {
      console.error('Failed to clear most played songs:', mostPlayedError);
    }

    // 3. Delete from user_all_scores
    const { error: allScoresError } = await supabase
      .from('user_all_scores')
      .delete()
      .eq('user_id', userId);

    if (allScoresError) {
      console.error('Failed to clear all scores:', allScoresError);
    }

    return { success: true };
  },

  // Get own profile by userId
  async getOwnProfile(userId) {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, display_name, user_roles(queue_name), maimai_dx_name, display_photo_url, dx_display_photo_url, main_branch, preferred_branches, privacy_settings, is_public, slug, slug_updated_at, introduction')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Update custom profile picture
  async updateProfilePicture(userId, photoUrl) {
    if (!userId) throw new Error('User ID is required');

    const { data, error } = await supabase
      .from('user_profiles')
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
    
    // Create unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  // Extract storage path from public URL
  extractStoragePath(url) {
    if (!url) return null;
    const bucketName = 'profile-pictures';
    const marker = `/public/${bucketName}/`;
    if (url.includes(marker)) {
      return url.split(marker).pop().split('?')[0];
    }
    return null;
  },

  // Update introduction text
  async updateIntroduction(userId, text) {
    if (!userId) throw new Error('User ID is required');

    // VALIDATION: We only strip tags for length check, but Zod schema handles the raw HTML length (which we set to 500)
    // Actually, based on implementation plan, we should probably validate plain text length or total length.
    // The plan said "Use Tiptap's editor.getText().length for counting characters to ignore HTML tags in the limit."
    // But backend validation also needs to be consistent. 
    // If I use the Zod schema with max(500), it counts the HTML tags if "text" is HTML.
    // However, the service receives the HTML.
    
    // Let's validate the raw input against our schema first.
    const validation = validateData(userProfileSchema.pick({ introduction: true }), { introduction: text });
    if (!validation.success) throw new Error(validation.error);

    const { data, error } = await supabase
      .from('user_profiles')
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
      .from('profile-pictures')
      .remove([path]);
    
    if (error) {
      console.error('Error deleting profile picture file:', error);
    }
  }
};

// Favorites service functions
export const favoritesService = {
  // Get all favorite songs for a user
  async getFavorites(userId) {
    const { data, error } = await supabase
      .from('user_favorite_songs')
      .select('song_id, created_at, comment')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Add a favorite song
  async addFavorite(userId, songId, comment = null) {
    const { data, error } = await supabase
      .from('user_favorite_songs')
      .insert([{ user_id: userId, song_id: songId, comment }])
      .select()
      .maybeSingle();
    
    if (error) {
      if (error.code === '23505') return null;
      throw error;
    }
    return data;
  },

  // Remove a favorite song
  async removeFavorite(userId, songId) {
    const { error } = await supabase
      .from('user_favorite_songs')
      .delete()
      .eq('user_id', userId)
      .eq('song_id', songId);
    
    if (error) throw error;
  },

  // Update a favorite song comment
  async updateFavoriteComment(userId, songId, comment) {
    const { data, error } = await supabase
      .from('user_favorite_songs')
      .update({ comment })
      .eq('user_id', userId)
      .eq('song_id', songId)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }
};

// Playlist service functions
export const playlistService = {
  // Fetch all playlists for a user
  async getPlaylists(userId) {
    const { data, error } = await supabase
      .from('user_playlists')
      .select(`
        *,
        songs:playlist_songs(
          song_id,
          level,
          order_index
        )
      `)
      .eq('user_id', userId)
      .eq('deleted', false)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching playlists:', error);
      throw error;
    }

    return data.map(playlist => ({
      ...playlist,
      songs: playlist.songs ? playlist.songs.sort((a, b) => a.order_index - b.order_index) : []
    }));
  },

  // Update or create a playlist
  async upsertPlaylist(userId, playlistId, { title, comment, is_public, songIds, songs }) {
    let finalPlaylistId = playlistId;

    if (!finalPlaylistId) {
      const { data, error } = await supabase
        .from('user_playlists')
        .insert({
          user_id: userId,
          title: title || 'New Playlist',
          comment,
          is_public: is_public || false,
          order_index: 0
        })
        .select()
        .single();

      if (error) throw error;
      finalPlaylistId = data.id;
    } else {
      const updates = { title, comment };
      if (is_public !== undefined) updates.is_public = is_public;
      
      const { error } = await supabase
        .from('user_playlists')
        .update(updates)
        .eq('id', finalPlaylistId);

      if (error) throw error;
    }

    const { error: deleteError } = await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', finalPlaylistId);

    if (deleteError) throw deleteError;

    if (songs && songs.length > 0) {
      const songEntries = songs.map((song, index) => ({
        playlist_id: finalPlaylistId,
        song_id: song.id,
        level: song.level || null,
        order_index: index
      }));

      const { error: insertError } = await supabase
        .from('playlist_songs')
        .insert(songEntries);

      if (insertError) throw insertError;
    } else if (songIds && songIds.length > 0) {
      const songEntries = songIds.map((songId, index) => ({
        playlist_id: finalPlaylistId,
        song_id: songId,
        level: null,
        order_index: index
      }));

      const { error: insertError } = await supabase
        .from('playlist_songs')
        .insert(songEntries);

      if (insertError) throw insertError;
    }

    const playlists = await this.getPlaylists(userId);
    return playlists.find(p => p.id === finalPlaylistId);
  },

  // Delete a playlist
  async deletePlaylist(playlistId) {
    // 1. Soft delete the playlist
    const { error: playlistError } = await supabase
      .from('user_playlists')
      .update({ deleted: true })
      .eq('id', playlistId);

    if (playlistError) {
      console.error('Error deleting playlist:', playlistError);
      throw playlistError;
    }

    // 2. Soft delete related posts
    await this.softDeletePostsByPlaylist(playlistId);

    return true;
  },

  // Soft delete all posts for a specific playlist
  async softDeletePostsByPlaylist(playlistId) {
    const { error } = await supabase
      .from('playlist_posts')
      .update({ deleted: true })
      .eq('playlist_id', playlistId);

    if (error) {
      console.error('Error soft deleting posts for playlist:', error);
      // We don't necessarily want to throw here if the playlist itself was deleted,
      // but it's good to log.
    }
  },

  // Share a playlist
  async sharePlaylist(userId, playlistId, content, commentsEnabled = true) {
    const { data, error } = await supabase
      .from('playlist_posts')
      .insert({
        user_id: userId,
        playlist_id: playlistId,
        content: content?.trim() || null,
        comments_enabled: commentsEnabled
      })
      .select()
      .single();

    if (error) {
      console.error('Error sharing playlist:', error);
      throw error;
    }
    return data;
  },

  // Get shared playlists (feed)
  async getSharedPlaylists() {
    const { data, error } = await supabase
      .from('playlist_posts')
      .select(`
        id,
        content,
        created_at,
        comments_enabled,
      author:user_profiles!user_id(id, slug, display_name, display_photo_url),
      playlist:user_playlists!playlist_id(
        id,
        title,
        comment,
        is_public,
        updated_at,
        songs:playlist_songs(
            song_id,
            level,
            order_index
          )
        )
      `)
      .eq('deleted', false)
      .filter('playlist.deleted', 'eq', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shared playlists:', error);
      throw error;
    }
    
    // Sort songs cleanly for each post
    return data.map(post => {
      if (post.playlist?.songs) {
        post.playlist.songs = post.playlist.songs.sort((a, b) => a.order_index - b.order_index);
      }
      return post;
    });
  },

  // Get comments for a shared post
  async getPostComments(postId) {
    const { data, error } = await supabase
      .from('playlist_comments')
      .select(`
        id,
        content,
        created_at,
        user_id,
        user_profiles:user_id(display_name, display_photo_url, slug)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching post comments:', error);
      throw error;
    }
    return data;
  },

  // Add a comment to a shared post
  async addPostComment(postId, userId, content) {
    const { data, error } = await supabase
      .from('playlist_comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content: content.trim()
      })
      .select(`
        id,
        content,
        created_at,
        user_id,
        user_profiles:user_id(display_name, display_photo_url, slug)
      `)
      .single();

    if (error) {
      console.error('Error adding post comment:', error);
      throw error;
    }
    return data;
  },

  // Delete a comment
  async deletePostComment(commentId, userId) {
    // RLS handles permission
    const { error } = await supabase
      .from('playlist_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting post comment:', error);
      throw error;
    }
    return true;
  },

  // Delete a specific post
  async deletePost(postId) {
    const { error } = await supabase
      .from('playlist_posts')
      .update({ deleted: true })
      .eq('id', postId);

    if (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
    return true;
  },

  // Toggle comments on a specific post
  async togglePostComments(postId, enabled) {
    const { error } = await supabase
      .from('playlist_posts')
      .update({ comments_enabled: enabled })
      .eq('id', postId);

    if (error) {
      console.error('Error toggling post comments:', error);
      throw error;
    }
    return true;
  }
};

// Most Played service functions
export const mostPlayedService = {
  // Get most played for a user
  async getMostPlayed(userId) {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('user_most_played_songs')
      .select('data, updated_at')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error) throw error;
    return data?.data || [];
  },

  // Update most played for a user
  async upsertMostPlayed(userId, mostPlayedData) {
    if (!userId) throw new Error('user_id is required');

    const { data, error } = await supabase
      .from('user_most_played_songs')
      .upsert({
        user_id: userId,
        data: mostPlayedData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
