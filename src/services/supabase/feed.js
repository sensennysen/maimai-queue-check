import { supabase } from './client';

export const feedService = {
  /**
   * Get songs with recent discussions (most recently commented songs).
   * Returns up to `limit` song_ids with their latest comment timestamp.
   */
  async getSongsWithRecentDiscussions(limit = 10) {
    const { data, error } = await supabase
      .from('song_comments')
      .select(`
        song_id,
        created_at,
        user_profiles:user_profiles!song_comments_user_id_fkey(display_name, display_photo_url, dx_display_photo_url, slug),
        content
      `)
      .order('created_at', { ascending: false })
      .limit(limit * 3); // Fetch more, then deduplicate by song_id

    if (error) throw error;

    // Deduplicate: keep one entry per song (the most recent comment)
    const seen = new Set();
    const deduped = [];
    for (const row of (data || [])) {
      if (!seen.has(row.song_id)) {
        seen.add(row.song_id);
        deduped.push(row);
        if (deduped.length >= limit) break;
      }
    }
    return deduped;
  },

  /**
   * Get playlist posts that have recent discussions.
   */
  async getPlaylistsWithRecentDiscussions(limit = 10) {
    const { data, error } = await supabase
      .from('playlist_comments')
      .select(`
        post_id,
        created_at,
        user_profiles:user_profiles!playlist_comments_user_id_fkey(display_name, display_photo_url, dx_display_photo_url, slug),
        post:playlist_posts!post_id(
          id,
          content,
          created_at,
          author:user_profiles!user_id(id, slug, display_name, display_photo_url, dx_display_photo_url),
          playlist:user_playlists!playlist_id(
            id, title, comment, is_public,
            songs:playlist_songs(song_id, level, order_index)
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit * 3);

    if (error) throw error;

    // Deduplicate by post_id and filter out deleted or private posts
    const seen = new Set();
    const deduped = [];
    for (const row of (data || [])) {
      if (!row.post || !row.post.playlist?.is_public) continue;
      if (!seen.has(row.post_id)) {
        seen.add(row.post_id);
        deduped.push(row);
        if (deduped.length >= limit) break;
      }
    }
    return deduped;
  },

  /**
   * Get new playlist posts (recently shared playlists).
   */
  async getNewPlaylistPosts(limit = 10) {
    const { data, error } = await supabase
      .from('playlist_posts')
      .select(`
        id,
        content,
        created_at,
        comments_enabled,
        author:user_profiles!user_id(id, slug, display_name, display_photo_url, dx_display_photo_url),
        playlist:user_playlists!playlist_id(
          id, title, comment, is_public,
          songs:playlist_songs(song_id, level, order_index)
        )
      `)
      .eq('deleted', false)
      .filter('playlist.is_public', 'eq', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || [])
      .filter(p => p.playlist?.is_public)
      .map(post => ({
        ...post,
        playlist: post.playlist
          ? {
              ...post.playlist,
              songs: (post.playlist.songs || []).sort((a, b) => a.order_index - b.order_index)
            }
          : null
      }));
  },

  /**
   * Get suggested players based on shared branches.
   * Returns user profiles that share the current user's main_branch or preferred_branches.
   */
  async getSuggestedPlayers(userId, mainBranch, preferredBranches, limit = 20) {
    if (!userId) return [];

    // Build user branch set for scoring
    const userPreferredBranches = (preferredBranches || []).map(String);
    const allUserBranches = [
      ...(mainBranch ? [String(mainBranch)] : []),
      ...userPreferredBranches
    ].filter(Boolean);

    // Fetch a larger pool of public users to ensure variety and provide random suggestions
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        id, display_name, slug, display_photo_url, dx_display_photo_url,
        main_branch, preferred_branches, is_public,
        user_roles(queue_name)
      `)
      .neq('id', userId)
      .eq('is_public', true)
      .not('slug', 'is', null)
      .limit(150); // Fetch a substantial pool for client-side scoring/randomization

    if (error) throw error;

    // Score and filter by branch overlap
    const scored = (data || []).map(profile => {
      let score = 0;
      const profileMainBranch = profile.main_branch ? String(profile.main_branch) : null;
      const profilePreferredBranches = (profile.preferred_branches || []).map(String);

      // 1. People with the same home branch as the user (Highest Priority)
      if (mainBranch && profileMainBranch === String(mainBranch)) {
        score += 100;
      }

      // 2. People with the same preferred branch as the user (Medium Priority)
      const hasPreferredOverlap = profilePreferredBranches.some(b => userPreferredBranches.includes(b)) ||
                                 (profileMainBranch && userPreferredBranches.includes(profileMainBranch));
      
      if (hasPreferredOverlap) {
        score += 50;
      }

      // Return all users, but include their score for sorting
      // Users with no overlap stay at score 0 (Lowest Priority / Random)
      return { profile, score };
    });

    // Sort by score descending, then random within same score bracket
    return scored
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return Math.random() - 0.5;
      })
      .slice(0, limit)
      .map(item => item.profile);
  },

  /**
   * Get activity notifications for a user (votes on comments, new followers).
   */
  async getActivityNotifications(userId, limit = 30) {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('user_activity_notifications')
      .select(`
        id, type, entity_id, entity_type, song_id, post_id, read, created_at,
        actor:user_profiles!actor_id(id, display_name, slug, display_photo_url, dx_display_photo_url)
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Mark a single activity notification as read.
   */
  async markActivityNotificationRead(notificationId, userId) {
    const { error } = await supabase
      .from('user_activity_notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('recipient_id', userId);

    if (error) throw error;
  },

  /**
   * Mark all activity notifications as read for a user.
   */
  async markAllActivityNotificationsRead(userId) {
    const { error } = await supabase
      .from('user_activity_notifications')
      .update({ read: true })
      .eq('recipient_id', userId)
      .eq('read', false);

    if (error) throw error;
  },

  /**
   * Create an activity notification easily.
   */
  async createActivityNotification({ recipientId, actorId, type, entityId = null, entityType = null, songId = null, postId = null }) {
    if (!recipientId || !actorId || recipientId === actorId) return null;
    
    // Check for recent duplicate to avoid spam
    const { data: existing } = await supabase
      .from('user_activity_notifications')
      .select('id')
      .eq('recipient_id', recipientId)
      .eq('actor_id', actorId)
      .eq('type', type)
      .eq('entity_id', entityId)
      .gt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Within 5 minutes
      .maybeSingle();

    if (existing) return null;

    const { data, error } = await supabase
      .from('user_activity_notifications')
      .insert({
        recipient_id: recipientId,
        actor_id: actorId,
        type,
        entity_id: entityId,
        entity_type: entityType,
        song_id: songId,
        post_id: postId,
        read: false
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
    return data;
  }
};
