import { supabase } from './client';

export const discussionService = {
  // Get all discussion data for a song
  async getSongDiscussionData(songId) {
    try {
      // Run queries in parallel
      const [ratingsResult, commentsResult, tagsResult] = await Promise.all([
        supabase
          .from('song_ratings')
          .select('user_id, rating, created_at, user_profiles(display_name)')
          .eq('song_id', songId),
        supabase
          .from('song_comments')
          .select(`
            id, user_id, content, created_at, updated_at,
            user_profiles:user_profiles!song_comments_user_id_fkey(display_name),
            song_comment_votes(vote_type, user_id)
          `)
          .eq('song_id', songId)
          .order('created_at', { ascending: false }),
        supabase
          .from('song_tags')
          .select(`
            tag_id, user_id, created_at,
            user_profiles(display_name),
            song_tags_dictionary(tag_name:name, is_predefined)
          `)
          .eq('song_id', songId)
      ]);

      if (ratingsResult.error) throw ratingsResult.error;
      if (commentsResult.error) throw commentsResult.error;
      if (tagsResult.error) throw tagsResult.error;

      return {
        ratings: ratingsResult.data,
        comments: commentsResult.data,
        tags: tagsResult.data
      };
    } catch (err) {
      console.error('Error fetching song discussion data:', err);
      throw err;
    }
  },

  // Get available tags from dictionary
  async getAvailableTags() {
    const { data, error } = await supabase
      .from('song_tags_dictionary')
      .select('id, tag_name:name, is_predefined');
      
    if (error) throw error;
    return data;
  },

  // Add a new custom tag to dictionary
  async addCustomTag(name) {
    const { data, error } = await supabase
      .from('song_tags_dictionary')
      .insert({ name, is_predefined: false })
      .select('id, tag_name:name, is_predefined')
      .single();
      
    if (error) throw error;
    return data;
  },

  // Add a tag to a song
  async addSongTag(songId, tagId, userId) {
    const { data, error } = await supabase
      .from('song_tags')
      .insert({ song_id: songId, tag_id: tagId, user_id: userId })
      .select();
      
    if (error) throw error;
    return data;
  },

  // Remove a tag from a song
  async removeSongTag(songId, tagId, userId) {
    const { error } = await supabase
      .from('song_tags')
      .delete()
      .eq('song_id', songId)
      .eq('tag_id', tagId)
      .eq('user_id', userId);
      
    if (error) throw error;
    return true;
  },

  // Upsert a 1-5 rating
  async upsertSongRating(songId, userId, rating) {
    const { data, error } = await supabase
      .from('song_ratings')
      .upsert(
        { song_id: songId, user_id: userId, rating },
        { onConflict: 'song_id,user_id' }
      )
      .select();
      
    if (error) throw error;
    return data;
  },
  
  // Remove user's rating
  async removeSongRating(songId, userId) {
    const { error } = await supabase
      .from('song_ratings')
      .delete()
      .eq('song_id', songId)
      .eq('user_id', userId);
      
    if (error) throw error;
    return true;
  },

  // Add a comment
  async addComment(songId, userId, content) {
    const { data, error } = await supabase
      .from('song_comments')
      .insert({ song_id: songId, user_id: userId, content })
      .select(`
        id, user_id, content, created_at, updated_at,
        user_profiles:user_profiles!song_comments_user_id_fkey(display_name)
      `)
      .single();
      
    if (error) throw error;
    return data;
  },

  // Vote on a comment
  async voteComment(commentId, userId, voteType) {
    if (voteType === 0) {
      // Remove vote
      const { data, error } = await supabase
        .from('song_comment_votes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);
        
      if (error) throw error;
      return data;
    } else {
      // Upsert vote
      const { data, error } = await supabase
        .from('song_comment_votes')
        .upsert(
          { comment_id: commentId, user_id: userId, vote_type: voteType },
          { onConflict: 'comment_id,user_id' }
        )
        .select();
        
      if (error) throw error;
      return data;
    }
  },
  
  // Delete user's comment
  async deleteComment(commentId, userId) {
    const { error } = await supabase
      .from('song_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);
      
    if (error) throw error;
    return true;
  }
};
