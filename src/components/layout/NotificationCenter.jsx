import { useState, useEffect, useCallback } from 'react';
import {
  Popover, ActionIcon, Indicator, Stack, Text, Group, ThemeIcon,
  ScrollArea, Button, Tabs, Avatar, Badge
} from '@mantine/core';
import IconBell from '@tabler/icons-react/dist/esm/icons/IconBell.mjs';
import IconUserPlus from '@tabler/icons-react/dist/esm/icons/IconUserPlus.mjs';
import IconInfoCircle from '@tabler/icons-react/dist/esm/icons/IconInfoCircle.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconChevronRight from '@tabler/icons-react/dist/esm/icons/IconChevronRight.mjs';
import IconThumbUp from '@tabler/icons-react/dist/esm/icons/IconThumbUp.mjs';
import IconThumbDown from '@tabler/icons-react/dist/esm/icons/IconThumbDown.mjs';
import IconHeart from '@tabler/icons-react/dist/esm/icons/IconHeart.mjs';
import IconMusic from '@tabler/icons-react/dist/esm/icons/IconMusic.mjs';
import IconPlaylist from '@tabler/icons-react/dist/esm/icons/IconPlaylist.mjs';
import IconMessageCircle from '@tabler/icons-react/dist/esm/icons/IconMessageCircle.mjs';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { requestService, notificationService, feedService, followService, supabase } from '../../services/supabase';
import { getRelativeTime, getProfileImageUrl } from '../../utils/formatters';

// Render a single activity notification row
function ActivityItem({ item, onMarkRead, onNavigate, isFollowingActor, onFollowBack, followLoading }) {
  const typeConfig = {
    comment_upvote: {
      icon: <IconThumbUp size={14} />,
      color: 'green',
      message: (actor) => `${actor} upvoted your song comment`,
    },
    playlist_comment_upvote: {
      icon: <IconThumbUp size={14} />,
      color: 'green',
      message: (actor) => `${actor} upvoted your playlist comment`,
    },
    thread_activity: {
      icon: <IconMessageCircle size={14} />,
      color: 'blue',
      message: (actor) => `${actor} also commented on a thread you're in`,
    },
    comment_downvote: {
      icon: <IconThumbDown size={14} />,
      color: 'red',
      message: (actor) => `${actor} downvoted your song comment`,
    },
    playlist_comment_downvote: {
      icon: <IconThumbDown size={14} />,
      color: 'orange',
      message: (actor) => `${actor} downvoted your playlist comment`,
    },
    new_follower: {
      icon: <IconUserPlus size={14} />,
      color: 'blue',
      message: (actor) => `${actor} started following you`,
    },
  };

  const config = typeConfig[item.type] || { icon: <IconInfoCircle size={14} />, color: 'gray', message: (a) => `${a} interacted with you` };
  const actorName = item.actor?.display_name || 'Someone';

  return (
    <Group
      wrap="nowrap"
      align="flex-start"
      p="xs"
      style={{
        cursor: 'pointer',
        backgroundColor: item.read ? 'transparent' : 'var(--mantine-color-default-hover)',
        borderRadius: 'var(--mantine-radius-sm)',
        transition: 'background 0.15s ease',
      }}
      onClick={() => onNavigate(item)}
    >
      <ThemeIcon color={config.color} variant="light" size="md" radius="xl" mt={2}>
        {config.icon}
      </ThemeIcon>

      <Group gap="xs" style={{ flex: 1, overflow: 'hidden' }} align="flex-start">
        <Avatar
          src={getProfileImageUrl(item.actor)}
          size={24}
          radius="xl"
          color={config.color}
          style={{ flexShrink: 0, marginTop: 1 }}
        >
          {actorName.charAt(0).toUpperCase()}
        </Avatar>
        <Stack gap={0} style={{ flex: 1 }}>
          <Text size="xs" lineClamp={2}>
            {config.message(actorName)}
          </Text>
          <Group gap="xs" mt={2}>
            <Text size="xs" c="dimmed">
              {getRelativeTime(item.created_at)}
            </Text>
            {item.type === 'new_follower' && !isFollowingActor && (
              <Button
                variant="subtle"
                size="compact-xs"
                color="blue"
                loading={followLoading}
                onClick={(e) => { e.stopPropagation(); onFollowBack(item.actor_id); }}
              >
                Follow Back
              </Button>
            )}
            {item.type === 'new_follower' && isFollowingActor && (
              <Badge size="xs" variant="light" color="gray">Following</Badge>
            )}
          </Group>
        </Stack>
      </Group>

      {!item.read && (
        <ActionIcon
          size="sm"
          variant="subtle"
          color="blue"
          onClick={(e) => { e.stopPropagation(); onMarkRead(item.id); }}
          title="Mark as read"
        >
          <IconCheck size={12} />
        </ActionIcon>
      )}
    </Group>
  );
}

const NotificationCenter = () => {
  const { user, userRoles } = useAuth();
  const navigate = useNavigate();
  const [opened, setOpened] = useState(false);
  const [activeTab, setActiveTab] = useState('activity');
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
  useEffect(() => {
    if (!isAdmin) return;
    const fetchRequests = async () => {
      try {
        const data = await requestService.getPendingRequests(isSuperAdmin ? null : adminBranch);
        setPendingRequests(data);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      }
    };
    fetchRequests();
    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'access_requests' }, (payload) => {
        if (isSuperAdmin || payload.new.branch_id === adminBranch) {
          fetchRequests();
          if (payload.eventType === 'INSERT') {
            notifications.show({ title: 'New Access Request', message: 'A user has requested access.', color: 'blue', icon: <IconUserPlus size={16} /> });
          }
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [isAdmin, adminBranch, isSuperAdmin, supabase]);

  // ── General Notifications ──
  const fetchGeneralNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await notificationService.getAllNotifications(userId);
      setGeneralNotifications(data);
    } catch {
      // console.error silent
    }
  }, [userId, notificationService]);

  // ── Activity Notifications ──
  const fetchActivityNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await feedService.getActivityNotifications(userId, 30);
      setActivityNotifications(data);

      // Fetch follow status for all actors
      const actorIds = [...new Set(data.map(n => n.actor_id).filter(Boolean))];
      if (actorIds.length > 0) {
        const followed = await followService.getBulkFollowStatus(userId, actorIds);
        setFollowedIds(followed);
      }
    } catch {
      // console.error silent
    }
  }, [userId, feedService, followService]);

  useEffect(() => {
    if (!userId) return;
    fetchGeneralNotifications();
    fetchActivityNotifications();
  }, [userId, fetchGeneralNotifications, fetchActivityNotifications]);

  // Real-time subscription for general notifications
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('general_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchGeneralNotifications();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId, fetchGeneralNotifications, supabase]);

  // Real-time subscription for activity notifications
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
  }, [userId, fetchActivityNotifications, supabase]);

  const handleMarkGeneralRead = async (e, notification) => {
    e.stopPropagation();
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
    } catch (error) {
      fetchActivityNotifications();
    }
  };

  const handleMarkAllActivityRead = async () => {
    setActivityNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await feedService.markAllActivityNotificationsRead(userId);
    } catch (error) {
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

  const handleNavigateActivity = (item) => {
    setOpened(false);
    if (item.type === 'new_follower' && item.actor?.slug) {
      navigate(`/p/${item.actor.slug}`);
    } else if ((item.type === 'comment_upvote' || item.type === 'comment_downvote') && item.song_id) {
      navigate(`/songs/${item.song_id}`);
    } else if ((item.type === 'playlist_comment_upvote' || item.type === 'playlist_comment_downvote')) {
      navigate('/shared-playlists');
    }
    handleMarkActivityRead(item.id);
  };

  // Combine admin + general items
  const systemItems = [
    ...pendingRequests.map(r => ({ type: 'request', id: `req-${r.id}`, originalId: r.id, data: r, date: new Date(r.created_at), read: false })),
    ...generalNotifications.map(n => ({ type: 'general', id: `notif-${n.id}`, originalId: n.id, data: n, date: new Date(n.created_at), read: n.read }))
  ].sort((a, b) => b.date - a.date);

  const unreadActivity = activityNotifications.filter(n => !n.read).length;
  const unreadSystem = pendingRequests.length + generalNotifications.filter(n => !n.read).length;
  const totalUnread = unreadActivity + unreadSystem;

  return (
    <Popover opened={opened} onChange={setOpened} width={370} position="bottom-end" shadow="md">
      <Popover.Target>
        <Indicator disabled={totalUnread === 0} color="red" size={16} offset={4} label={totalUnread > 9 ? '9+' : totalUnread}>
          <ActionIcon variant="subtle" size="lg" onClick={() => setOpened((o) => !o)}>
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>

      <Popover.Dropdown p={0}>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List grow>
            <Tabs.Tab
              value="activity"
              leftSection={<IconHeart size={14} />}
              rightSection={unreadActivity > 0 ? <Badge size="xs" color="red" circle>{unreadActivity > 9 ? '9+' : unreadActivity}</Badge> : null}
            >
              Activity
            </Tabs.Tab>
            <Tabs.Tab
              value="system"
              leftSection={<IconInfoCircle size={14} />}
              rightSection={unreadSystem > 0 ? <Badge size="xs" color="blue" circle>{unreadSystem}</Badge> : null}
            >
              System
            </Tabs.Tab>
          </Tabs.List>

          {/* ── Activity Tab ── */}
          <Tabs.Panel value="activity">
            <Stack gap={0} p="sm">
              <Group justify="space-between" mb="xs">
                <Text size="xs" fw={600} c="dimmed">Recent Activity</Text>
                {unreadActivity > 0 && (
                  <Button variant="subtle" size="xs" onClick={handleMarkAllActivityRead}>
                    Mark all read
                  </Button>
                )}
              </Group>

              <ScrollArea.Autosize mah="55vh" type="scroll">
                {activityNotifications.length === 0 ? (
                  <Stack align="center" gap="xs" py="lg">
                    <IconHeart size={28} opacity={0.2} />
                    <Text size="sm" c="dimmed" ta="center">
                      No activity yet. Get commenting and following!
                    </Text>
                  </Stack>
                ) : (
                  <Stack gap={2}>
                    {activityNotifications.map(item => (
                      <ActivityItem
                        key={item.id}
                        item={item}
                        onMarkRead={handleMarkActivityRead}
                        onNavigate={handleNavigateActivity}
                        isFollowingActor={followedIds.has(item.actor_id)}
                        onFollowBack={handleFollowBack}
                        followLoading={followLoadingMap[item.actor_id]}
                      />
                    ))}
                  </Stack>
                )}
              </ScrollArea.Autosize>
            </Stack>
          </Tabs.Panel>

          {/* ── System Tab ── */}
          <Tabs.Panel value="system">
            <Stack gap={0} p="sm">
              <Text size="xs" fw={600} c="dimmed" mb="xs">System Notifications</Text>
              <ScrollArea.Autosize mah="55vh" type="scroll">
                {systemItems.length === 0 ? (
                  <Text size="sm" c="dimmed" ta="center" py="lg">
                    No new notifications
                  </Text>
                ) : (
                  <Stack gap={2}>
                    {systemItems.map((item) => (
                      <Group
                        key={item.id}
                        wrap="nowrap"
                        align="start"
                        p="xs"
                        style={{
                          cursor: item.type === 'request' ? 'pointer' : 'default',
                          backgroundColor: item.read ? 'transparent' : 'var(--mantine-color-default-hover)',
                          borderRadius: 'var(--mantine-radius-sm)',
                        }}
                        onClick={() => {
                          if (item.type === 'request') {
                            setOpened(false);
                            navigate('/admin?tab=requests');
                          }
                        }}
                      >
                        {item.type === 'request' ? (
                          <ThemeIcon color="blue" variant="light" size="md" radius="xl" mt={4}>
                            <IconUserPlus size={16} />
                          </ThemeIcon>
                        ) : (
                          <ThemeIcon color={item.data.type === 'success' ? 'green' : 'blue'} variant="light" size="md" radius="xl" mt={4}>
                            <IconInfoCircle size={16} />
                          </ThemeIcon>
                        )}

                        <div style={{ flex: 1 }}>
                          <Text size="sm" fw={500}>
                            {item.type === 'request' ? 'Access Request' : item.data.title}
                          </Text>
                          <Text size="xs" c="secondary" style={{ marginTop: '0.25rem', marginBottom: '0.25rem' }}>
                            {item.type === 'request' ? (
                              `${item.data.user_roles?.email || 'Unknown User'} requested access to ${item.data.allowed_places?.short_name || 'Branch'}`
                            ) : (
                              item.data.message
                            )}
                          </Text>
                          <Text size="xs" c="secondary" mt={4}>
                            {item.date.toLocaleString()}
                          </Text>
                        </div>

                        {item.type === 'general' && !item.read && (
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="blue"
                            onClick={(e) => handleMarkGeneralRead(e, item.data)}
                            title="Mark as read"
                          >
                            <IconCheck size={14} />
                          </ActionIcon>
                        )}
                        {item.type === 'request' && (
                          <IconChevronRight size={14} style={{ opacity: 0.5 }} />
                        )}
                      </Group>
                    ))}
                  </Stack>
                )}
              </ScrollArea.Autosize>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Popover.Dropdown>
    </Popover>
  );
};

export default NotificationCenter;
