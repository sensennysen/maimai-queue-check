import { supabase } from './client';
import { TABLES } from '../../constants/database';
import { LIMITS } from '../../constants/limits';

/**
 * Service for activity notifications
 */
export const activityNotificationService = {
  // Create a new notification
  async createActivityNotification({ recipientId, actorId, type, entityId, entityType, songId = null, postId = null }) {
    if (recipientId === actorId) return null;
    
    const { data, error } = await supabase
      .from(TABLES.USER_ACTIVITY_NOTIFICATIONS)
      .insert({
        recipient_id: recipientId,
        actor_id: actorId,
        type,
        entity_id: entityId,
        entity_type: entityType,
        song_id: songId,
        post_id: postId
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Get notifications for a user
  async getActivityNotifications(userId, limit = LIMITS.NOTIFICATION_POOL) {
    if (!userId) return [];

    const { data, error } = await supabase
      .from(TABLES.USER_ACTIVITY_NOTIFICATIONS)
      .select(`
        id, type, actor_id, entity_id, entity_type, song_id, post_id, read, created_at,
        actor:${TABLES.USER_PROFILES}!actor_id(id, display_name, slug, display_photo_url, dx_display_photo_url)
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Mark single read
  async markActivityNotificationRead(notificationId, userId) {
    const { error } = await supabase
      .from(TABLES.USER_ACTIVITY_NOTIFICATIONS)
      .update({ read: true })
      .eq('id', notificationId)
      .eq('recipient_id', userId);

    if (error) throw error;
  },

  // Mark all read
  async markAllActivityNotificationsRead(userId) {
    const { error } = await supabase
      .from(TABLES.USER_ACTIVITY_NOTIFICATIONS)
      .update({ read: true })
      .eq('recipient_id', userId)
      .eq('read', false);

    if (error) throw error;
  }
};
