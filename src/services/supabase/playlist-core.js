import { supabase } from './client';
import { TABLES } from '../../constants/database';

/**
 * Service for core playlist management (CRUD, Drafts)
 */
export const playlistCoreService = {
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
  }
};
