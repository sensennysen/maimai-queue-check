import { supabase } from './client';
import { TABLES } from '../../constants/database';
import { LIMITS } from '../../constants/limits';

/**
 * Service for activity feed and discovery
 */
export const activityService = {
  // Get recent public activity from followed users
  async getFollowingActivity(userId, limit = LIMITS.FEED_ACTIVITY) {
    if (!userId) return [];

    const { data: followingRows, error: followingError } = await supabase
      .from(TABLES.USER_FOLLOWS)
      .select('following_id')
      .eq('follower_id', userId)
      .limit(200);

    if (followingError) throw followingError;

    const followingIds = (followingRows || []).map((row) => row.following_id).filter(Boolean);
    if (followingIds.length === 0) return [];

    const fetchLimit = Math.max(limit * 3, 20);

    const [playlistPostsResult, songCommentsResult, playlistCommentsResult, feedPostsResult] = await Promise.all([
      supabase
        .from(TABLES.PLAYLIST_POSTS)
        .select(`
          id, content, created_at, user_id,
          author:${TABLES.USER_PROFILES}!user_id(id, slug, display_name, display_photo_url, dx_display_photo_url),
          playlist:${TABLES.USER_PLAYLISTS}!playlist_id(
            id, title, comment, is_public,
            songs:${TABLES.PLAYLIST_SONGS}(song_id, level, order_index)
          )
        `)
        .eq('deleted', false)
        .in('user_id', followingIds)
        .filter('playlist.is_public', 'eq', true)
        .order('created_at', { ascending: false })
        .limit(fetchLimit),
      supabase
        .from(TABLES.SONG_COMMENTS)
        .select(`
          id, song_id, content, created_at, user_id,
          author:${TABLES.USER_PROFILES}!song_comments_user_id_fkey(id, slug, display_name, display_photo_url, dx_display_photo_url)
        `)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(fetchLimit),
      supabase
        .from(TABLES.PLAYLIST_COMMENTS)
        .select(`
          id, post_id, content, created_at, user_id,
          author:${TABLES.USER_PROFILES}!playlist_comments_user_id_fkey(id, slug, display_name, display_photo_url, dx_display_photo_url),
          post:${TABLES.PLAYLIST_POSTS}!post_id(
            id, content, created_at,
            author:${TABLES.USER_PROFILES}!user_id(id, slug, display_name, display_photo_url, dx_display_photo_url),
            playlist:${TABLES.USER_PLAYLISTS}!playlist_id(
              id, title, comment, is_public,
              songs:${TABLES.PLAYLIST_SONGS}(song_id, level, order_index)
            )
          )
        `)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(fetchLimit),
      supabase
        .from(TABLES.FEED_POSTS)
        .select(`
          id, content, created_at, user_id, visibility, attached_song_id, attached_playlist_id, image_url,
          author:${TABLES.USER_PROFILES}!feed_posts_user_id_fkey(id, slug, display_name, display_photo_url, dx_display_photo_url),
          attached_playlist:${TABLES.USER_PLAYLISTS}!attached_playlist_id(
            id, title, comment, is_public,
            songs:${TABLES.PLAYLIST_SONGS}(song_id, level, order_index)
          )
        `)
        .eq('deleted', false)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(fetchLimit),
    ]);

    if (feedPostsResult.error) throw feedPostsResult.error;
    if (playlistPostsResult.error) throw playlistPostsResult.error;
    if (songCommentsResult.error) throw songCommentsResult.error;
    if (playlistCommentsResult.error) throw playlistCommentsResult.error;

    const activity = [];

    (playlistPostsResult.data || []).forEach(post => {
      if (post.playlist?.is_public) {
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
            ...post,
            playlist: post.playlist ? {
              ...post.playlist,
              songs: (post.playlist.songs || []).sort((a,b) => a.order_index - b.order_index)
            } : null
          }
        });
      }
    });

    (songCommentsResult.data || []).forEach(comment => {
      activity.push({
        id: `song-comment-${comment.id}`,
        type: 'song_comment',
        created_at: comment.created_at,
        actor: comment.author,
        song_id: comment.song_id,
        content: comment.content || null,
        comment: { content: comment.content, author: comment.author, createdAt: comment.created_at }
      });
    });

    (playlistCommentsResult.data || []).forEach(comment => {
      if (comment.post?.playlist?.is_public) {
        activity.push({
          id: `playlist-comment-${comment.id}`,
          type: 'playlist_comment',
          created_at: comment.created_at,
          actor: comment.author,
          playlist_post_id: comment.post_id,
          playlist_id: comment.post?.playlist?.id,
          playlist_title: comment.post?.playlist?.title || 'Untitled Playlist',
          content: comment.content || null,
          post: comment.post ? {
            ...comment.post,
            playlist: comment.post.playlist ? {
              ...comment.post.playlist,
              songs: (comment.post.playlist.songs || []).sort((a,b) => a.order_index - b.order_index)
            } : null
          } : null,
          comment: { content: comment.content, author: comment.author, createdAt: comment.created_at }
        });
      }
    });

    (feedPostsResult.data || []).forEach(fp => {
      activity.push({
        id: `feed-post-${fp.id}`,
        type: 'feed_post',
        created_at: fp.created_at,
        actor: fp.author,
        feed_post_id: fp.id,
        content: fp.content,
        visibility: fp.visibility,
        attached_song_id: fp.attached_song_id,
        attached_playlist: fp.attached_playlist,
        feed_post: { ...fp }
      });
    });

    return activity
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  },

  // Get songs with recent discussions
  async getSongsWithRecentDiscussions(limit = LIMITS.RECENT_DISCUSSIONS) {
    const { data, error } = await supabase
      .from(TABLES.SONG_COMMENTS)
      .select(`song_id, created_at, user_profiles:${TABLES.USER_PROFILES}!song_comments_user_id_fkey(display_name, display_photo_url, dx_display_photo_url, slug), content`)
      .order('created_at', { ascending: false })
      .limit(limit * 3);

    if (error) throw error;

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

  // Get playlist posts with recent discussions
  async getPlaylistsWithRecentDiscussions(limit = LIMITS.RECENT_DISCUSSIONS) {
    const { data, error } = await supabase
      .from(TABLES.PLAYLIST_COMMENTS)
      .select(`
        post_id, created_at, user_profiles:${TABLES.USER_PROFILES}!playlist_comments_user_id_fkey(display_name, display_photo_url, dx_display_photo_url, slug),
        post:${TABLES.PLAYLIST_POSTS}!post_id(
          id, content, created_at,
          author:${TABLES.USER_PROFILES}!user_id(id, slug, display_name, display_photo_url, dx_display_photo_url),
          playlist:${TABLES.USER_PLAYLISTS}!playlist_id(
            id, title, comment, is_public,
            songs:${TABLES.PLAYLIST_SONGS}(song_id, level, order_index)
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit * 3);

    if (error) throw error;

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

  // Suggested players logic
  async getSuggestedPlayers(userId, mainBranch, preferredBranches, limit = LIMITS.SUGGESTED_PLAYERS) {
    if (!userId) return [];
    const userPreferredBranches = (preferredBranches || []).map(String);

    const { data, error } = await supabase
      .from(TABLES.USER_PROFILES)
      .select(`id, display_name, slug, display_photo_url, dx_display_photo_url, main_branch, preferred_branches, is_public, user_roles:${TABLES.USER_ROLES}(queue_name)`)
      .neq('id', userId)
      .eq('is_public', true)
      .not('slug', 'is', null)
      .limit(Math.max(LIMITS.PLAYER_POOL_SIZE, limit * 5));

    if (error) throw error;

    const scored = (data || []).map(profile => {
      let score = 0;
      const profileMainBranch = profile.main_branch ? String(profile.main_branch) : null;
      const profilePreferredBranches = (profile.preferred_branches || []).map(String);

      if (mainBranch && profileMainBranch === String(mainBranch)) score += 100;
      if (profilePreferredBranches.some(b => userPreferredBranches.includes(b)) || (profileMainBranch && userPreferredBranches.includes(profileMainBranch))) {
        score += 50;
      }
      return { profile, score };
    });

    return scored
      .sort((a, b) => (b.score !== a.score) ? b.score - a.score : Math.random() - 0.5)
      .map(item => item.profile);
  }
};
