import { supabase } from './client';
import { feedService } from './feed';
import { TABLES } from '../../constants/database';

export const discussionService = {
  // Get all discussion data for a song
  async getSongDiscussionData(songId) {
    try {
      // Run queries in parallel
      const [ratingsResult, commentsResult, tagsResult] = await Promise.all([
        supabase
          .from(TABLES.SONG_RATINGS)
          .select(`user_id, rating, created_at, ${TABLES.USER_PROFILES}(display_name, display_photo_url, dx_display_photo_url)`)
          .eq('song_id', songId),
        supabase
          .from(TABLES.SONG_COMMENTS)
          .select(`
            id, user_id, content, created_at, updated_at,
            user_profiles: ${TABLES.USER_PROFILES}!song_comments_user_id_fkey(display_name, display_photo_url, dx_display_photo_url),
            ${TABLES.SONG_COMMENT_VOTES}(vote_type, user_id, user_profiles:user_id(display_name, display_photo_url, dx_display_photo_url))
          `)
          .eq('song_id', songId)
          .order('created_at', { ascending: false }),
        supabase
          .from(TABLES.SONG_TAGS)
          .select(`
            tag_id, user_id, created_at,
            ${TABLES.USER_PROFILES}(display_name, display_photo_url, dx_display_photo_url),
            ${TABLES.SONG_TAGS_DICTIONARY}(tag_name:name, is_predefined, description)
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
  async getAvailableTags(isAdmin = false) {
    let query = supabase
      .from(TABLES.SONG_TAGS_DICTIONARY)
      .select('id, tag_name:name, is_predefined, status, description');
    
    // Regular users only see approved tags
    if (!isAdmin) {
      query = query.eq('status', 'approved');
    }
      
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get all tags for administration
  async getAllTags() {
    const { data, error } = await supabase
      .from(TABLES.SONG_TAGS_DICTIONARY)
      .select(`*, user_profiles:${TABLES.USER_PROFILES}!created_by(display_name)`)
      .order('name');
    if (error) throw error;
    return data.map(tag => ({
      ...tag,
      tag_name: tag.name,
      creator_name: tag.user_profiles?.display_name || 'System'
    }));
  },

  // Delete a tag (Super Admin only)
  async deleteTag(tagId) {
    const { error } = await supabase
      .from(TABLES.SONG_TAGS_DICTIONARY)
      .delete()
      .eq('id', tagId);
    if (error) throw error;
    return true;
  },

  // Add a new custom tag to dictionary
  async addCustomTag(name, description = null, status = 'pending') {
    const { data, error } = await supabase
      .from(TABLES.SONG_TAGS_DICTIONARY)
      .insert({ 
        name, 
        is_predefined: false, 
        status, 
        description 
      })
      .select('id, tag_name:name, is_predefined, status, description')
      .single();
      
    if (error) throw error;
    return data;
  },

  // Admin: Get all pending tags
  async getPendingTags() {
    const { data, error } = await supabase
      .from(TABLES.SONG_TAGS_DICTIONARY)
      .select(`
        *,
        tag_name:name,
        created_by_profile: ${TABLES.USER_PROFILES}!created_by(display_name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Admin: Update tag status (approve/reject)
  async updateTagStatus(tagId, status, description = null) {
    const updates = { status };
    if (description !== null) updates.description = description;

    const { data, error } = await supabase
      .from(TABLES.SONG_TAGS_DICTIONARY)
      .update(updates)
      .eq('id', tagId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Add a tag to a song
  async addSongTag(songId, tagId, userId) {
    const { data, error } = await supabase
      .from(TABLES.SONG_TAGS)
      .insert({ song_id: songId, tag_id: tagId, user_id: userId })
      .select();
      
    if (error) throw error;
    return data;
  },

  // Remove a tag from a song
  async removeSongTag(songId, tagId, userId) {
    const { error } = await supabase
      .from(TABLES.SONG_TAGS)
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
      .from(TABLES.SONG_RATINGS)
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
      .from(TABLES.SONG_RATINGS)
      .delete()
      .eq('song_id', songId)
      .eq('user_id', userId);
      
    if (error) throw error;
    return true;
  },

  // Add a comment
  async addComment(songId, userId, content) {
    const { data, error } = await supabase
      .from(TABLES.SONG_COMMENTS)
      .insert({ song_id: songId, user_id: userId, content })
      .select(`
        id, user_id, content, created_at, updated_at,
        user_profiles: ${TABLES.USER_PROFILES}!song_comments_user_id_fkey(display_name, display_photo_url, dx_display_photo_url)
      `)
      .single();
      
    if (error) throw error;

    // Notify other commenters on this song (thread activity)
    try {
      const { data: others } = await supabase
        .from(TABLES.SONG_COMMENTS)
        .select('user_id')
        .eq('song_id', songId)
        .neq('user_id', userId)
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(10);
      
      const uniqueOthers = [...new Set(others?.map(o => o.user_id) || [])];
      await Promise.all(uniqueOthers.map(recipientId => 
        feedService.createActivityNotification({
          recipientId,
          actorId: userId,
          type: 'thread_activity',
          entityId: data.id,
          entityType: 'song_comment',
          songId: songId
        })
      ));
    } catch (notifErr) {
      console.error('Thread notification failed:', notifErr);
    }

    return data;
  },

  // Vote on a comment
  async voteComment(commentId, userId, voteType) {
    if (voteType === 0) {
      // Remove vote
      const { data, error } = await supabase
        .from(TABLES.SONG_COMMENT_VOTES)
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);
        
      if (error) throw error;
      return data;
    } else {
      // Upsert vote
      const { data, error } = await supabase
        .from(TABLES.SONG_COMMENT_VOTES)
        .upsert(
          { comment_id: commentId, user_id: userId, vote_type: voteType },
          { onConflict: 'comment_id,user_id' }
        )
        .select();
        
      if (error) throw error;

      // Notify owner of upvote
      if (voteType === 1) {
        try {
          const { data: comment } = await supabase
            .from(TABLES.SONG_COMMENTS)
            .select('user_id, song_id')
            .eq('id', commentId)
            .single();

          if (comment && comment.user_id !== userId) {
            await feedService.createActivityNotification({
              recipientId: comment.user_id,
              actorId: userId,
              type: 'comment_upvote',
              entityId: commentId,
              entityType: 'song_comment',
              songId: comment.song_id
            });
          }
        } catch (notifErr) {
          console.error('Upvote notification failed:', notifErr);
        }
      }

      return data;
    }
  },
  
  // Delete user's comment
  async deleteComment(commentId, userId) {
    const { error } = await supabase
      .from(TABLES.SONG_COMMENTS)
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);
      
    if (error) throw error;
    return true;
  }
};
