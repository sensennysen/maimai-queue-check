import { useState, useEffect, useCallback, createElement } from 'react';
import IconUserPlus from '@tabler/icons-react/dist/esm/icons/IconUserPlus.mjs';
import { notifications } from '@mantine/notifications';
import { requestService, notificationService, feedService, followService, supabase } from '../services/supabase';

/**
 * Hook for managing user notifications, including admin access requests, general system alerts, and social activity.
 * Sets up real-time subscriptions and provides handlers for marking items as read and social actions.
 * @param {Object} user - The current authenticated user object.
 * @param {Object} userRoles - The current user's role and permission object.
 * @returns {Object} A comprehensive notification state and action interface.
 */
export function useNotifications(user, userRoles) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [generalNotifications, setGeneralNotifications] = useState([]);
  const [activityNotifications, setActivityNotifications] = useState([]);
  const [followedIds, setFollowedIds] = useState(new Set());
  const [followLoadingMap, setFollowLoadingMap] = useState({});

  const adminBranch = userRoles?.admin_branch;
  const isSuperAdmin = userRoles?.is_super_admin;
  const isAdmin = userRoles?.is_admin || isSuperAdmin;
  const userId = user?.id;

  // ── Admin Requests ──
  const fetchRequests = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const data = await requestService.getPendingRequests(isSuperAdmin ? null : adminBranch);
      setPendingRequests(data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
  }, [isAdmin, isSuperAdmin, adminBranch]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchRequests();
    
    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'access_requests' }, (payload) => {
        if (isSuperAdmin || payload.new.branch_id === adminBranch) {
          fetchRequests();
          if (payload.eventType === 'INSERT') {
            notifications.show({ 
              title: 'New Access Request', 
              message: 'A user has requested access.', 
              color: 'blue', 
              icon: createElement(IconUserPlus, { size: 16 }) 
            });
          }
        }
      })
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [isAdmin, adminBranch, isSuperAdmin, fetchRequests]);

  // ── General Notifications ──
  const fetchGeneralNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await notificationService.getAllNotifications(userId);
      setGeneralNotifications(data);
    } catch {
      // silent
    }
  }, [userId]);

  // ── Activity Notifications ──
  const fetchActivityNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await feedService.getActivityNotifications(userId, 30);
      setActivityNotifications(data);

      const actorIds = [...new Set(data.map(n => n.actor_id).filter(Boolean))];
      if (actorIds.length > 0) {
        const followed = await followService.getBulkFollowStatus(userId, actorIds);
        setFollowedIds(followed);
      }
    } catch {
      // silent
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchGeneralNotifications();
    fetchActivityNotifications();
  }, [userId, fetchGeneralNotifications, fetchActivityNotifications]);

  // Real-time subscriptions
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('general_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchGeneralNotifications();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId, fetchGeneralNotifications]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`activity-notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_activity_notifications',
        filter: `recipient_id=eq.${userId}`,
      }, () => {
        fetchActivityNotifications();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId, fetchActivityNotifications]);

  const handleMarkGeneralRead = async (e, notification) => {
    if (e) e.stopPropagation();
    if (notification.read) return;
    setGeneralNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    try {
      await notificationService.markAsRead(userId, notification.id);
    } catch (error) {
      console.error('Failed to mark as read', error);
      fetchGeneralNotifications();
    }
  };

  const handleMarkActivityRead = async (notifId) => {
    setActivityNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    try {
      await feedService.markActivityNotificationRead(notifId, userId);
    } catch (err) {
      console.error('Failed to mark activity notification as read', err);
      fetchActivityNotifications();
    }
  };

  const handleMarkAllActivityRead = async () => {
    setActivityNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await feedService.markAllActivityNotificationsRead(userId);
    } catch (err) {
      console.error('Failed to mark all activity notifications as read', err);
      fetchActivityNotifications();
    }
  };

  const handleFollowBack = async (actorId) => {
    setFollowLoadingMap(prev => ({ ...prev, [actorId]: true }));
    try {
      await followService.follow(userId, actorId);
      setFollowedIds(prev => {
        const next = new Set(prev);
        next.add(actorId);
        return next;
      });
      notifications.show({ title: 'Followed!', message: 'You are now following back.', color: 'green', autoClose: 2000 });
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to follow back.', color: 'red' });
    } finally {
      setFollowLoadingMap(prev => ({ ...prev, [actorId]: false }));
    }
  };

  const systemItems = [
    ...pendingRequests.map(r => ({ type: 'request', id: `req-${r.id}`, originalId: r.id, data: r, date: new Date(r.created_at), read: false })),
    ...generalNotifications.map(n => ({ type: 'general', id: `notif-${n.id}`, originalId: n.id, data: n, date: new Date(n.created_at), read: n.read }))
  ].sort((a, b) => b.date - a.date);

  const unreadActivity = activityNotifications.filter(n => !n.read).length;
  const unreadSystem = pendingRequests.length + generalNotifications.filter(n => !n.read).length;
  const totalUnread = unreadActivity + unreadSystem;

  return {
    pendingRequests,
    generalNotifications,
    activityNotifications,
    followedIds,
    followLoadingMap,
    systemItems,
    unreadActivity,
    unreadSystem,
    totalUnread,
    handleMarkGeneralRead,
    handleMarkActivityRead,
    handleMarkAllActivityRead,
    handleFollowBack,
    refreshNotifications: () => {
      fetchGeneralNotifications();
      fetchActivityNotifications();
    },
  };
}
