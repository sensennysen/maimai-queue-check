import { supabase } from './client';
import { TABLES } from '../../constants/database';
import { LIMITS } from '../../constants/limits';

/**
 * Service for playlist feed and sharing functionality
 */
export const playlistFeedService = {
  // Sharing methods
  async sharePlaylist(userId, playlistId, content, commentsEnabled = true) {
    const { data, error } = await supabase
      .from(TABLES.PLAYLIST_POSTS)
      .insert({
        user_id: userId,
        playlist_id: playlistId,
        content: content?.trim() || null,
        comments_enabled: commentsEnabled
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Feed methods
  async getSharedPlaylists(limit = 20) {
    let query = supabase
      .from(TABLES.PLAYLIST_POSTS)
      .select(`
        id, content, created_at, comments_enabled,
        author:${TABLES.USER_PROFILES}!user_id(id, slug, display_name, display_photo_url, dx_display_photo_url),
        playlist:${TABLES.USER_PLAYLISTS}!playlist_id(
          id, title, comment, is_public, updated_at,
          songs:${TABLES.PLAYLIST_SONGS}(song_id, level, order_index)
        )
      `)
      .eq('deleted', false)
      .filter('playlist.deleted', 'eq', false)
      .filter('playlist.is_public', 'eq', true)
      .order('created_at', { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;

    if (error) throw error;
    
    return data.map(post => {
      if (post.playlist?.songs) {
        post.playlist.songs = post.playlist.songs.sort((a, b) => a.order_index - b.order_index);
      }
      return post;
    });
  },

  async getPublicPlaylistsBySongIds(songIds, limit = LIMITS.FEED_ACTIVITY) {
    if (!Array.isArray(songIds) || songIds.length === 0) return [];

    const { data: idData, error: idError } = await supabase
      .from(TABLES.PLAYLIST_SONGS)
      .select(`playlist_id, ${TABLES.USER_PLAYLISTS}!inner(is_public, deleted, is_draft)`)
      .in('song_id', songIds)
      .eq(`${TABLES.USER_PLAYLISTS}.is_public`, true)
      .eq(`${TABLES.USER_PLAYLISTS}.deleted`, false)
      .eq(`${TABLES.USER_PLAYLISTS}.is_draft`, false);

    if (idError) throw idError;

    const uniqueIds = Array.from(new Set((idData || []).map(d => d.playlist_id))).slice(0, limit);
    if (uniqueIds.length === 0) return [];

    const { data, error } = await supabase
      .from(TABLES.USER_PLAYLISTS)
      .select(`
        id, title, comment, is_public, updated_at, user_id,
        songs:${TABLES.PLAYLIST_SONGS}(song_id, level, order_index),
        author:${TABLES.USER_PROFILES}!user_id(id, display_name, slug, display_photo_url, dx_display_photo_url)
      `)
      .in('id', uniqueIds)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return data.map((playlist) => ({
      ...playlist,
      songs: (playlist.songs || []).sort((a, b) => a.order_index - b.order_index)
    }));
  },

  // Post Management methods
  async deletePost(postId) {
    const { error } = await supabase
      .from(TABLES.PLAYLIST_POSTS)
      .update({ deleted: true })
      .eq('id', postId);

    if (error) throw error;
    return true;
  },

  async updatePostContent(postId, content) {
    const { data, error } = await supabase
      .from(TABLES.PLAYLIST_POSTS)
      .update({ content: content?.trim() || null })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async togglePostComments(postId, enabled) {
    const { data, error } = await supabase
      .from(TABLES.PLAYLIST_POSTS)
      .update({ comments_enabled: enabled })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Alias for backward compatibility
  async getNewPlaylistPosts(limit) {
    return this.getSharedPlaylists(limit);
  }
};
