import { supabase } from './client';
import { TABLES, BUCKETS } from '../../constants/database';
import { LIMITS } from '../../constants/limits';
import { APP_CONFIG } from '../../constants/config';
import { activityNotificationService } from './notifications';

/**
 * Service for community feed posts
 */
export const postsService = {
  // Create a new feed post
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

  // Get latest posts
  async getFeedPosts(userId = null, limit = LIMITS.FEED_POSTS) {
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

    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
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

  // Get posts for a user
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

  async updateFeedPost(postId, userId, content) {
    const { data, error } = await supabase.from(TABLES.FEED_POSTS).update({ content: content.trim(), updated_at: new Date().toISOString() }).eq('id', postId).eq('user_id', userId).select('id, content, updated_at').single();
    if (error) throw error;
    return data;
  },

  async deleteFeedPost(postId, userId) {
    const { error } = await supabase.from(TABLES.FEED_POSTS).update({ deleted: true }).eq('id', postId).eq('user_id', userId);
    if (error) throw error;
  },

  // Comments logic
  async getFeedPostComments(postId, userId = null, limit = LIMITS.COMMENT_POOL) {
    const { data, error } = await supabase
      .from(TABLES.FEED_POST_COMMENTS)
      .select(`
        id, content, created_at,
        author:${TABLES.USER_PROFILES}!feed_post_comments_user_id_fkey(id, slug, display_name, display_photo_url, dx_display_photo_url),
        votes:${TABLES.FEED_POST_COMMENT_VOTES}(vote_type, user_id)
      `)
      .eq('post_id', postId).order('created_at', { ascending: true }).limit(limit);

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

  async addFeedPostComment(postId, userId, content) {
    const { data, error } = await supabase
      .from(TABLES.FEED_POST_COMMENTS)
      .insert({ post_id: postId, user_id: userId, content: content.trim() })
      .select(`id, content, created_at, author:${TABLES.USER_PROFILES}!feed_post_comments_user_id_fkey(id, slug, display_name, display_photo_url, dx_display_photo_url)`)
      .single();
    if (error) throw error;
    return data;
  },

  async deleteFeedPostComment(commentId, userId) {
    const { error } = await supabase.from(TABLES.FEED_POST_COMMENTS).delete().eq('id', commentId).eq('user_id', userId);
    if (error) throw error;
  },

  // Voting logic
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
        } catch (e) { console.error(e); }
      }
      return data;
    }
  },

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
        } catch (e) { console.error(e); }
      }
      return data;
    }
  },

  // Image upload
  async uploadPostImage(userId, file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from(BUCKETS.POST_IMAGES).upload(fileName, file, { cacheControl: '3600', upsert: true });
    if (error) throw error;
    return supabase.storage.from(BUCKETS.POST_IMAGES).getPublicUrl(fileName).data.publicUrl;
  }
};
