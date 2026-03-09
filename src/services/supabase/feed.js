import { supabase } from './client';

export const feedService = {
  /**
   * Get recent public activity from users the current user follows.
   * Includes:
   * - new public playlist posts
   * - new song comments
   * - new playlist comments on public posts
   */
  async getFollowingActivity(userId, limit = 12) {
    if (!userId) return [];

    const { data: followingRows, error: followingError } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId)
      .limit(200);

    if (followingError) throw followingError;

    const followingIds = (followingRows || []).map((row) => row.following_id).filter(Boolean);
    if (followingIds.length === 0) return [];

    const fetchLimit = Math.max(limit * 3, 20);

    const [playlistPostsResult, songCommentsResult, playlistCommentsResult] = await Promise.all([
      supabase
        .from('playlist_posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          author:user_profiles!user_id(id, slug, display_name, display_photo_url, dx_display_photo_url),
          playlist:user_playlists!playlist_id(
            id, title, comment, is_public,
            songs:playlist_songs(song_id, level, order_index)
          )
        `)
        .eq('deleted', false)
        .in('user_id', followingIds)
        .filter('playlist.is_public', 'eq', true)
        .order('created_at', { ascending: false })
        .limit(fetchLimit),
      supabase
        .from('song_comments')
        .select(`
          id,
          song_id,
          content,
          created_at,
          user_id,
          author:user_profiles!song_comments_user_id_fkey(id, slug, display_name, display_photo_url, dx_display_photo_url)
        `)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(fetchLimit),
      supabase
        .from('playlist_comments')
        .select(`
          id,
          post_id,
          content,
          created_at,
          user_id,
          author:user_profiles!playlist_comments_user_id_fkey(id, slug, display_name, display_photo_url, dx_display_photo_url),
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
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(fetchLimit),
    ]);

    if (playlistPostsResult.error) throw playlistPostsResult.error;
    if (songCommentsResult.error) throw songCommentsResult.error;
    if (playlistCommentsResult.error) throw playlistCommentsResult.error;

    const activity = [];

    for (const post of (playlistPostsResult.data || [])) {
      if (!post.playlist?.is_public) continue;
      activity.push({
        id: `post-${post.id}`,
        type: 'playlist_post',
        created_at: post.created_at,
        actor: post.author,
        playlist_post_id: post.id,
        playlist_id: post.playlist?.id,
        playlist_title: post.playlist?.title || 'Untitled Playlist',
        content: post.content || null,
        post: {
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          author: post.author,
          playlist: post.playlist
            ? {
              ...post.playlist,
              songs: (post.playlist.songs || []).sort((a, b) => a.order_index - b.order_index),
            }
            : null,
        },
      });
    }

    for (const comment of (songCommentsResult.data || [])) {
      activity.push({
        id: `song-comment-${comment.id}`,
        type: 'song_comment',
        created_at: comment.created_at,
        actor: comment.author,
        song_id: comment.song_id,
        content: comment.content || null,
        comment: {
          content: comment.content || null,
          author: comment.author,
          createdAt: comment.created_at,
        },
      });
    }

    for (const comment of (playlistCommentsResult.data || [])) {
      if (!comment.post?.playlist?.is_public) continue;
      activity.push({
        id: `playlist-comment-${comment.id}`,
        type: 'playlist_comment',
        created_at: comment.created_at,
        actor: comment.author,
        playlist_post_id: comment.post_id,
        playlist_id: comment.post?.playlist?.id,
        playlist_title: comment.post?.playlist?.title || 'Untitled Playlist',
        content: comment.content || null,
        post: comment.post
          ? {
            ...comment.post,
            playlist: comment.post.playlist
              ? {
                ...comment.post.playlist,
                songs: (comment.post.playlist.songs || []).sort((a, b) => a.order_index - b.order_index),
              }
              : null,
          }
          : null,
        comment: {
          content: comment.content || null,
          author: comment.author,
          createdAt: comment.created_at,
        },
      });
    }

    return activity
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  },

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
