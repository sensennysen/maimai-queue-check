import { supabase } from './client';
import { TABLES } from '../../constants/database';

/**
 * Service for user most played songs management
 */
export const mostPlayedService = {
  // Get most played songs for a user
  async getMostPlayed(userId) {
    const { data, error } = await supabase
      .from(TABLES.USER_MOST_PLAYED_SONGS)
      .select('data')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) throw error;
    return data?.data || [];
  },

  // Update most played songs (Upsert)
  async upsertMostPlayed(userId, mostPlayedData) {
    const { data, error } = await supabase
      .from(TABLES.USER_MOST_PLAYED_SONGS)
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
