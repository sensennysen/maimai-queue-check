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
  },

  /**
   * Retrieves profiles of all users who have voted on a specific playlist comment.
   * @param {string} commentId - The ID of the comment to audit.
   * @returns {Promise<Array<Object>>} A promise resolving to a list of voter profiles.
   */
  async getPlaylistCommentVoters(commentId) {
    const { data, error } = await supabase
      .from(TABLES.PLAYLIST_COMMENT_VOTES)
      .select(`
        vote_type,
        user:user_profiles!user_id(id, display_name, slug, display_photo_url, dx_display_photo_url)
      `)
      .eq('comment_id', commentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Aliases to match PlaylistComments.jsx component expectations
  async addPostComment(postId, userId, content) {
    return this.postComment(userId, postId, content);
  },

  async deletePostComment(commentId, userId) {
    // Note: service deleteComment didn't originally use userId, but we use it for safety if needed
    // The component passed it, so we accept it but the current implementation doesn't use it.
    return this.deleteComment(commentId);
  },

  async votePostComment(commentId, userId, voteType) {
    return this.voteComment(userId, commentId, voteType);
  }
};
