import { supabase } from './client';
import { TABLES } from '../../constants/database';
import { LIMITS } from '../../constants/limits';

/**
 * Service for playlist management
 */
export const playlistService = {
  // Fetch all playlists for a user
  async getPlaylists(userId) {
    const { data, error } = await supabase
      .from(TABLES.USER_PLAYLISTS)
      .select(`
        *,
        songs:${TABLES.PLAYLIST_SONGS}(
          song_id,
          level,
          order_index
        )
      `)
      .eq('user_id', userId)
      .eq('deleted', false)
      .eq('is_draft', false)
      .order('order_index', { ascending: true });

    if (error) throw error;

    return data.map(playlist => ({
      ...playlist,
      songs: playlist.songs ? playlist.songs.sort((a, b) => a.order_index - b.order_index) : []
    }));
  },

  // Update or create a playlist
  async upsertPlaylist(userId, playlistId, { title, comment, is_public, is_draft = false, songIds, songs }) {
    let finalPlaylistId = playlistId;

    if (!finalPlaylistId) {
      const { data, error } = await supabase
        .from(TABLES.USER_PLAYLISTS)
        .insert({
          user_id: userId,
          title: title || 'New Playlist',
          comment,
          is_public: is_public || false,
          is_draft,
          order_index: 0
        })
        .select()
        .single();

      if (error) throw error;
      finalPlaylistId = data.id;
    } else {
      const updates = { title, comment, is_draft };
      if (is_public !== undefined) updates.is_public = is_public;
      
      const { error } = await supabase
        .from(TABLES.USER_PLAYLISTS)
        .update(updates)
        .eq('id', finalPlaylistId);

      if (error) throw error;
    }

    await supabase.from(TABLES.PLAYLIST_SONGS).delete().eq('playlist_id', finalPlaylistId);

    if (songs && songs.length > 0) {
      const songEntries = songs.map((song, index) => ({
        playlist_id: finalPlaylistId,
        song_id: song.id,
        level: song.level || null,
        order_index: index
      }));
      await supabase.from(TABLES.PLAYLIST_SONGS).insert(songEntries);
    } else if (songIds && songIds.length > 0) {
      const songEntries = songIds.map((songId, index) => ({
        playlist_id: finalPlaylistId,
        song_id: songId,
        level: null,
        order_index: index
      }));
      await supabase.from(TABLES.PLAYLIST_SONGS).insert(songEntries);
    }

    const playlists = await this.getPlaylists(userId);
    return playlists.find(p => p.id === finalPlaylistId);
  },

  // Draft methods
  async getDraft(userId) {
    if (!userId) return null;
    const { data, error } = await supabase
      .from(TABLES.USER_PLAYLISTS)
      .select(`*, songs:${TABLES.PLAYLIST_SONGS}(song_id, level, order_index)`)
      .eq('user_id', userId)
      .eq('is_draft', true)
      .eq('deleted', false)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return {
      ...data,
      songs: (data.songs || []).sort((a, b) => a.order_index - b.order_index)
    };
  },

  async saveDraft(userId, draftId, payload) {
    return this.upsertPlaylist(userId, draftId || null, { ...payload, is_draft: true });
  },

  async discardDraft(draftId) {
    if (!draftId) return;
    await supabase.from(TABLES.USER_PLAYLISTS).update({ deleted: true }).eq('id', draftId);
  },

  // Deletion methods
  async deletePlaylist(playlistId) {
    await supabase.from(TABLES.USER_PLAYLISTS).update({ deleted: true }).eq('id', playlistId);
    await this.softDeletePostsByPlaylist(playlistId);
    return true;
  },

  async softDeletePostsByPlaylist(playlistId) {
    await supabase.from(TABLES.PLAYLIST_POSTS).update({ deleted: true }).eq('playlist_id', playlistId);
  },

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
  async getSharedPlaylists() {
    const { data, error } = await supabase
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

  // Comment methods
  async getPostComments(postId) {
    const { data, error } = await supabase
      .from(TABLES.PLAYLIST_COMMENTS)
      .select(`
        id, content, created_at, user_id,
        user_profiles:user_id(display_name, display_photo_url, dx_display_photo_url, slug),
        ${TABLES.PLAYLIST_COMMENT_VOTES}(vote_type, user_id, user_profiles(display_name, display_photo_url, dx_display_photo_url))
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async postComment(userId, postId, content) {
    const { data, error } = await supabase
      .from(TABLES.PLAYLIST_COMMENTS)
      .insert({ user_id: userId, post_id: postId, content: content.trim() })
      .select(`
        id, content, created_at, user_id,
        user_profiles:user_id(display_name, display_photo_url, dx_display_photo_url, slug)
      `)
      .single();

    if (error) throw error;
    return { ...data, playlist_comment_votes: [] };
  },

  async deleteComment(commentId) {
    const { error } = await supabase.from(TABLES.PLAYLIST_COMMENTS).delete().eq('id', commentId);
    if (error) throw error;
  },

  async voteComment(userId, commentId, voteType) {
    const { data, error } = await supabase
      .from(TABLES.PLAYLIST_COMMENT_VOTES)
      .upsert({ user_id: userId, comment_id: commentId, vote_type: voteType }, { onConflict: 'user_id,comment_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
