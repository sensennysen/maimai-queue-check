import { supabase } from './client';
import { TABLES, BUCKETS } from '../../constants/database';
import { LIMITS } from '../../constants/limits';
import { APP_CONFIG } from '../../constants/config';
import { activityNotificationService } from './notifications';
import { validateImageUpload, getNormalizedFileExtension } from '../../utils/uploadValidation';

/**
 * Service for community feed posts
 */
export const postsService = {
  /**
   * Creates a new community feed post in the database.
   * Handles optional attachments for songs, playlists, and images.
   * @param {string} userId - The unique identifier of the posting user.
   * @param {string} content - The text content of the post.
   * @param {string} [visibility=APP_CONFIG.DEFAULT_VISIBILITY] - Post visibility level ('public', etc.).
   * @param {string} [songId=null] - Optional ID of a song to attach.
   * @param {string} [playlistId=null] - Optional ID of a playlist to attach.
   * @param {string} [imageUrl=null] - Optional URL of an image to attach.
   * @returns {Promise<Object>} A promise resolving to the created post with normalized counts.
   */
  async createFeedPost(userId, content, visibility = APP_CONFIG.DEFAULT_VISIBILITY, songId = null, playlistId = null, imageUrl = null) {
    const { data, error } = await supabase
      .from(TABLES.FEED_POSTS)
      .insert({ 
        user_id: userId, 
        content: content.trim(),
        visibility: visibility,
        attached_song_id: songId,
        attached_playlist_id: playlistId,
        image_url: imageUrl
      })
      .select(`
        id, content, visibility, attached_song_id, attached_playlist_id, image_url, created_at, updated_at,
        author:${TABLES.USER_PROFILES}!feed_posts_user_id_fkey(id, slug, display_name, display_photo_url, dx_display_photo_url),
        votes:${TABLES.FEED_POST_VOTES}(vote_type, user_id),
        attached_playlist:${TABLES.USER_PLAYLISTS}!attached_playlist_id(
          id, title, comment, is_public,
          songs:${TABLES.PLAYLIST_SONGS}(song_id, level, order_index)
        )
      `)
      .single();

    if (error) throw error;
    
    const votes = data.votes || [];
    const like_count = votes.filter(v => v.vote_type === 1).length;
    const dislike_count = votes.filter(v => v.vote_type === -1).length;
    const user_vote = votes.find(v => v.user_id === userId)?.vote_type || 0;

    return { ...data, like_count, dislike_count, user_vote, votes: undefined };
  },

  /**
   * Retrieves a list of the latest feed posts with user-specific voting context.
   * @param {string} [userId=null] - The ID of the user viewing the feed (to determine visibility and votes).
   * @param {number} [limit=LIMITS.FEED_POSTS] - The maximum number of posts to return.
   * @returns {Promise<Array<Object>>} A promise resolving to an array of post objects.
   */
  async getFeedPostsPage(userId = null, limit = LIMITS.FEED_POSTS, offset = 0) {
    let query = supabase
      .from(TABLES.FEED_POSTS)
      .select(`
        id, content, visibility, attached_song_id, attached_playlist_id, image_url, created_at, updated_at,
        author:${TABLES.USER_PROFILES}!feed_posts_user_id_fkey(id, slug, display_name, display_photo_url, dx_display_photo_url),
        votes:${TABLES.FEED_POST_VOTES}(vote_type, user_id),
        comments:${TABLES.FEED_POST_COMMENTS}(id),
        attached_playlist:${TABLES.USER_PLAYLISTS}!attached_playlist_id(
          id, title, comment, is_public,
          songs:${TABLES.PLAYLIST_SONGS}(song_id, level, order_index)
        )
      `)
      .eq('deleted', false);

    if (userId) query = query.or(`visibility.eq.public,user_id.eq.${userId}`);
    else query = query.eq('visibility', 'public');

    const rangeStart = Math.max(0, Number(offset) || 0);
    const rangeEnd = rangeStart + Math.max(1, Number(limit) || LIMITS.FEED_POSTS) - 1;
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(rangeStart, rangeEnd);
    if (error) throw error;

    return (data || []).map(p => {
      const votes = p.votes || [];
      return { 
        ...p, 
        comment_count: p.comments?.length ?? 0, 
        like_count: votes.filter(v => v.vote_type === 1).length,
        dislike_count: votes.filter(v => v.vote_type === -1).length,
        user_vote: userId ? (votes.find(v => v.user_id === userId)?.vote_type || 0) : 0,
        comments: undefined, votes: undefined
      };
    });
  },

  async getFeedPosts(userId = null, limit = LIMITS.FEED_POSTS) {
    return this.getFeedPostsPage(userId, limit, 0);
  },

  /**
   * Retrieves all feed posts authored by a specific user.
   * @param {string} userId - The author's unique identifier.
   * @param {number} [limit=LIMITS.PROFILE_POSTS] - The maximum number of posts to return.
   * @returns {Promise<Array<Object>>} A promise resolving to an array of the user's posts.
   */
  async getUserFeedPosts(userId, limit = LIMITS.PROFILE_POSTS) {
    const { data, error } = await supabase
      .from(TABLES.FEED_POSTS)
      .select(`
        id, content, visibility, attached_song_id, attached_playlist_id, image_url, created_at, updated_at,
        author:${TABLES.USER_PROFILES}!feed_posts_user_id_fkey(id, slug, display_name, display_photo_url, dx_display_photo_url),
        votes:${TABLES.FEED_POST_VOTES}(vote_type, user_id),
        comments:${TABLES.FEED_POST_COMMENTS}(id),
        attached_playlist:${TABLES.USER_PLAYLISTS}!attached_playlist_id(
          id, title, comment, is_public,
          songs:${TABLES.PLAYLIST_SONGS}(song_id, level, order_index)
        )
      `)
      .eq('user_id', userId).eq('deleted', false).order('created_at', { ascending: false }).limit(limit);

    if (error) throw error;
    return (data || []).map(p => {
      const votes = p.votes || [];
      return { 
        ...p, 
        comment_count: p.comments?.length ?? 0, 
        like_count: votes.filter(v => v.vote_type === 1).length,
        dislike_count: votes.filter(v => v.vote_type === -1).length,
        user_vote: userId ? (votes.find(v => v.user_id === userId)?.vote_type || 0) : 0,
        comments: undefined, votes: undefined
      };
    });
  },

  /**
   * Updates the text content of an existing feed post.
   * @param {string} postId - The ID of the post to update.
   * @param {string} userId - The ID of the user (for ownership verification).
   * @param {string} content - The new text content.
   * @returns {Promise<Object>} A promise resolving to the updated post fragment.
   */
  async updateFeedPost(postId, userId, content) {
    const { data, error } = await supabase.from(TABLES.FEED_POSTS).update({ content: content.trim(), updated_at: new Date().toISOString() }).eq('id', postId).eq('user_id', userId).select('id, content, updated_at').single();
    if (error) throw error;
    return data;
  },

  /**
   * Performs a soft delete on a feed post by setting its 'deleted' flag to true.
   * @param {string} postId - The ID of the post to delete.
   * @param {string} userId - The ID of the user (for ownership verification).
   * @returns {Promise<void>} A promise that resolves when the post is deleted.
   */
  async deleteFeedPost(postId, userId) {
    const { error } = await supabase.from(TABLES.FEED_POSTS).update({ deleted: true }).eq('id', postId).eq('user_id', userId);
    if (error) throw error;
  },

  /**
   * Retrieves all comments associated with a specific feed post.
   * @param {string} postId - The ID of the parent post.
   * @param {string} [userId=null] - The ID of the user viewing (to determine votes).
   * @param {number} [limit=LIMITS.COMMENT_POOL] - The maximum number of comments to return.
   * @returns {Promise<Array<Object>>} A promise resolving to an array of comment objects.
   */
  async getFeedPostComments(postId, userId = null, limit = LIMITS.COMMENT_POOL, ascending = true) {
    const { data, error } = await supabase
      .from(TABLES.FEED_POST_COMMENTS)
      .select(`
        id, content, created_at,
        author:${TABLES.USER_PROFILES}!feed_post_comments_user_id_fkey(id, slug, display_name, display_photo_url, dx_display_photo_url),
        votes:${TABLES.FEED_POST_COMMENT_VOTES}(vote_type, user_id)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(c => {
      const votes = c.votes || [];
      return {
        ...c,
        like_count: votes.filter(v => v.vote_type === 1).length,
        dislike_count: votes.filter(v => v.vote_type === -1).length,
        user_vote: userId ? (votes.find(v => v.user_id === userId)?.vote_type || 0) : 0,
        votes: undefined
      };
    });
  },

  /**
   * Adds a new comment to a feed post.
   * @param {string} postId - The ID of the post being commented on.
   * @param {string} userId - The ID of the comment author.
   * @param {string} content - The text content of the comment.
   * @returns {Promise<Object>} A promise resolving to the newly created comment object.
   */
  async addFeedPostComment(postId, userId, content) {
    const { data, error } = await supabase
      .from(TABLES.FEED_POST_COMMENTS)
      .insert({ post_id: postId, user_id: userId, content: content.trim() })
      .select(`id, content, created_at, author:${TABLES.USER_PROFILES}!feed_post_comments_user_id_fkey(id, slug, display_name, display_photo_url, dx_display_photo_url)`)
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Deletes a specific comment from a feed post.
   * @param {string} commentId - The ID of the comment to delete.
   * @param {string} userId - The ID of the user (for ownership verification).
   * @returns {Promise<void>} A promise that resolves when the comment is deleted.
   */
  async deleteFeedPostComment(commentId, userId) {
    const { error } = await supabase.from(TABLES.FEED_POST_COMMENTS).delete().eq('id', commentId).eq('user_id', userId);
    if (error) throw error;
  },

  /**
   * Registers or removes a vote (like/dislike) on a feed post.
   * Automatically triggers a notification for the post author if it's a new like.
```
   * @param {string} postId - The ID of the post being voted on.
   * @param {string} userId - The ID of the voting user.
   * @param {number} voteType - The type of vote (1: like, -1: dislike, 0: remove).
   * @returns {Promise<Object>} A promise resolving to the final vote state.
   */
  async voteFeedPost(postId, userId, voteType) {
    if (voteType === 0) {
      const { error } = await supabase.from(TABLES.FEED_POST_VOTES).delete().eq('post_id', postId).eq('user_id', userId);
      if (error) throw error;
      return { vote_type: 0 };
    } else {
      const { data, error } = await supabase.from(TABLES.FEED_POST_VOTES).upsert({ post_id: postId, user_id: userId, vote_type: voteType }, { onConflict: 'post_id,user_id' }).select('vote_type').single();
      if (error) throw error;
      if (voteType === 1) {
        try {
          const { data: post } = await supabase.from(TABLES.FEED_POSTS).select('user_id').eq('id', postId).single();
          if (post && post.user_id !== userId) {
            await activityNotificationService.createActivityNotification({ recipientId: post.user_id, actorId: userId, type: 'post_like', entityId: postId, entityType: 'feed_post', postId: postId });
          }
        } catch (e) { console.error('Failed to send post like notification:', e); }
      }
      return data;
    }
  },

  /**
   * Registers or removes a vote on a feed post comment.
   * @param {string} commentId - The ID of the comment.
   * @param {string} userId - The ID of the voter.
   * @param {number} voteType - The type of vote (1: like, -1: dislike, 0: remove).
   * @returns {Promise<Object>} A promise resolving to the final vote state.
   */
  async voteFeedPostComment(commentId, userId, voteType) {
    if (voteType === 0) {
      const { error } = await supabase.from(TABLES.FEED_POST_COMMENT_VOTES).delete().eq('comment_id', commentId).eq('user_id', userId);
      if (error) throw error;
      return { vote_type: 0 };
    } else {
      const { data, error } = await supabase.from(TABLES.FEED_POST_COMMENT_VOTES).upsert({ comment_id: commentId, user_id: userId, vote_type: voteType }, { onConflict: 'comment_id,user_id' }).select('vote_type').single();
      if (error) throw error;
      if (voteType === 1) {
        try {
          const { data: comment } = await supabase.from(TABLES.FEED_POST_COMMENTS).select('user_id, post_id').eq('id', commentId).single();
          if (comment && comment.user_id !== userId) {
            await activityNotificationService.createActivityNotification({ recipientId: comment.user_id, actorId: userId, type: 'comment_like', entityId: commentId, entityType: 'feed_post_comment', postId: comment.post_id });
          }
        } catch (e) { console.error('Failed to send comment like notification:', e); }
      }
      return data;
    }
  },

  /**
   * Retrieves profiles of all users who have voted on a specific comment.
   * @param {string} commentId - The ID of the comment to audit.
   * @returns {Promise<Array<Object>>} A promise resolving to a list of voter profiles and types.
   */
  async getFeedPostCommentVoters(commentId) {
    const { data, error } = await supabase
      .from(TABLES.FEED_POST_COMMENT_VOTES)
      .select(`
        vote_type,
        user:${TABLES.USER_PROFILES}!user_id(id, display_name, slug, display_photo_url, dx_display_photo_url)
      `)
      .eq('comment_id', commentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Uploads an image file to the post images storage bucket.
   * @param {string} userId - The ID of the user uploading the image.
   * @param {File} file - The file object to upload.
   * @returns {Promise<string>} A promise resolving to the public URL of the uploaded image.
   */
  async uploadPostImage(userId, file) {
    validateImageUpload(file);

    const fileExt = getNormalizedFileExtension(file.type);
    if (!fileExt) throw new Error('Unsupported image extension');
    
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage.from(BUCKETS.POST_IMAGES).upload(fileName, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: true,
    });
    if (error) throw error;
    return supabase.storage.from(BUCKETS.POST_IMAGES).getPublicUrl(fileName).data.publicUrl;
  },

  /**
   * Retrieves user profiles for anyone who has voted on a specific feed post.
   * @param {string} postId - The ID of the post.
   * @returns {Promise<Array<Object>>} A promise resolving to a list of voter profiles.
   */
  async getFeedPostVoters(postId) {
    const { data, error } = await supabase
      .from(TABLES.FEED_POST_VOTES)
      .select(`
        vote_type,
        user:${TABLES.USER_PROFILES}!user_id(id, display_name, slug, display_photo_url, dx_display_photo_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
