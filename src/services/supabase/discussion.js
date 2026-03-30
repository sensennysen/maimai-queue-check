import { supabase } from './client';
import { feedService } from './feed';
import { TABLES } from '../../constants/database';

export const discussionService = {
  /**
   * Retrieves all discussion-related data for a specific song (ratings, comments, tags).
   * Executes multiple queries in parallel for efficiency.
   * @param {string} songId - The unique identifier of the song.
   * @returns {Promise<Object>} A promise resolving to an object containing {ratings, comments, tags}.
   */
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

  /**
   * Retrieves the list of available tags from the song tags dictionary.
   * Filters for approved tags unless the viewer has administrative privileges.
   * @param {boolean} [isAdmin=false] - Flag to include pending/internal tags.
   * @returns {Promise<Array<Object>>} A promise resolving to an array of tag objects.
   */
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

  /**
   * Retrieves all tags in the dictionary regardless of status, including creator info.
   * Intended for administrative audit and management.
   * @returns {Promise<Array<Object>>} A promise resolving to a list of fully populated tag objects.
   */
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

  /**
   * Permanently deletes a tag definition from the global dictionary.
   * @param {string} tagId - The identifier of the tag to delete.
   * @returns {Promise<boolean>} A promise resolving to true on successful deletion.
   */
  async deleteTag(tagId) {
    const { error } = await supabase
      .from(TABLES.SONG_TAGS_DICTIONARY)
      .delete()
      .eq('id', tagId);
    if (error) throw error;
    return true;
  },

  /**
   * Adds a new user-suggested tag to the dictionary with a pending status.
   * @param {string} name - The display name of the tag.
   * @param {string} [description=null] - Optional context or rules for tag usage.
   * @param {string} [status='pending'] - Initial moderation status.
   * @returns {Promise<Object>} A promise resolving to the created dictionary entry.
   */
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

  /**
   * Retrieves tags currently awaiting moderator review.
   * @returns {Promise<Array<Object>>} A promise resolving to a list of pending tags.
   */
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

  /**
   * Updates the moderation status of a tag (e.g., approving or rejecting it).
   * @param {string} tagId - The ID of the tag.
   * @param {string} status - The new status ('approved', 'rejected', etc.).
   * @param {string} [description=null] - Optional updated description or rejection reason.
   * @returns {Promise<Object>} A promise resolving to the updated tag entry.
   */
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

  /**
   * Associates a tag with a specific song in the database.
   * @param {string} songId - The ID of the song.
   * @param {string} tagId - The ID of the tag to associate.
   * @param {string} userId - The ID of the user performing the tagging.
   * @returns {Promise<Object>} A promise resolving to the mapping record.
   */
  async addSongTag(songId, tagId, userId) {
    const { data, error } = await supabase
      .from(TABLES.SONG_TAGS)
      .insert({ song_id: songId, tag_id: tagId, user_id: userId })
      .select();
      
    if (error) throw error;
    return data;
  },

  /**
   * Removes a specific tag association from a song.
   * @param {string} songId - The ID of the song.
   * @param {string} tagId - The ID of the tag mapping to remove.
   * @param {string} userId - The ID of the user (for ownership verification).
   * @returns {Promise<boolean>} A promise resolving to true when successful.
   */
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

  /**
   * Registers or updates a user's 1-5 numerical rating for a song.
   * @param {string} songId - The ID of the song.
   * @param {string} userId - The ID of the rater.
   * @param {number} rating - The score value (1-5).
   * @returns {Promise<Object>} A promise resolving to the upserted rating record.
   */
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
  
  /**
   * Deletes a user's existing rating for a specific song.
   * @param {string} songId - The ID of the song.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<boolean>} A promise resolving to true when successful.
   */
  async removeSongRating(songId, userId) {
    const { error } = await supabase
      .from(TABLES.SONG_RATINGS)
      .delete()
      .eq('song_id', songId)
      .eq('user_id', userId);
      
    if (error) throw error;
    return true;
  },

  /**
   * Adds a new discussion comment to a song's thread.
   * Automatically triggers thread activity notifications to recent participants.
   * @param {string} songId - The ID of the song.
   * @param {string} userId - The ID of the author.
   * @param {string} content - The text content of the comment.
   * @returns {Promise<Object>} A promise resolving to the created comment with author profile.
   */
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

  /**
   * Registers, updates, or removes a vote on a song discussion comment.
   * Automatically triggers a notification to the author on new upvotes.
   * @param {string} commentId - The unique identifier of the comment.
   * @param {string} userId - The ID of the voter.
   * @param {number} voteType - The type of vote (1: up, -1: down, 0: remove).
   * @returns {Promise<Object>} A promise resolving to the final vote state.
   */
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

  /**
   * Retrieves user profiles for anyone who has voted on a specific song comment.
   * @param {string} commentId - The ID of the comment to audit.
   * @returns {Promise<Array<Object>>} A promise resolving to a list of voter profiles.
   */
  async getSongCommentVoters(commentId) {
    const { data, error } = await supabase
      .from(TABLES.SONG_COMMENT_VOTES)
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
   * Permanently deletes a user's own comment from a song discussion.
   * @param {string} commentId - The ID of the comment to delete.
   * @param {string} userId - The ID of the user (for ownership verification).
   * @returns {Promise<boolean>} A promise resolving to true when successful.
   */
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
