import { supabase } from './client';
import { TABLES } from '../../constants/database';

/**
 * Service for playlist comments and voting
 */
export const playlistCommentService = {
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
