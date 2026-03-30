import { supabase } from './client';
import { TABLES } from '../../constants/database';

/**
 * Service for user favorite songs management
 */
export const favoritesService = {
  // Get all favorite songs for a user
  async getFavorites(userId) {
    const { data, error } = await supabase
      .from(TABLES.USER_FAVORITE_SONGS)
      .select('song_id, created_at, comment')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Add a favorite song
  async addFavorite(userId, songId, comment = null) {
    const { data, error } = await supabase
      .from(TABLES.USER_FAVORITE_SONGS)
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
      .from(TABLES.USER_FAVORITE_SONGS)
      .delete()
      .eq('user_id', userId)
      .eq('song_id', songId);
    
    if (error) throw error;
  },

  // Update a favorite song comment
  async updateFavoriteComment(userId, songId, comment) {
    const { data, error } = await supabase
      .from(TABLES.USER_FAVORITE_SONGS)
      .update({ comment })
      .eq('user_id', userId)
      .eq('song_id', songId)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }
};
