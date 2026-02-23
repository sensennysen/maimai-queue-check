import { useState, useEffect } from 'react';
import { Popover, ActionIcon, Indicator, Stack, Text, Group, ThemeIcon, ScrollArea, Button, Box } from '@mantine/core';
import IconBell from '@tabler/icons-react/dist/esm/icons/IconBell.mjs';
import IconUserPlus from '@tabler/icons-react/dist/esm/icons/IconUserPlus.mjs';
import IconInfoCircle from '@tabler/icons-react/dist/esm/icons/IconInfoCircle.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconChevronRight from '@tabler/icons-react/dist/esm/icons/IconChevronRight.mjs';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { requestService, notificationService, supabase } from '../../services/supabase';

const NotificationCenter = () => {
  const { user, userRoles } = useAuth();
  const navigate = useNavigate();
  const [opened, setOpened] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [generalNotifications, setGeneralNotifications] = useState([]);

  // Derived state: Admin branch (if regular admin)
  const adminBranch = userRoles?.admin_branch;
  const isSuperAdmin = userRoles?.is_super_admin;
  const isAdmin = userRoles?.is_admin || isSuperAdmin;
  const userId = user?.id;

  // Fetch Admin Requests
  useEffect(() => {
    if (isAdmin) {
      const fetchRequests = async () => {
        try {
          // We'll keep loading state purely local or combined? 
          // Let's just use it when initialized? 
          // For now, we won't block UI with global loading.
          const data = await requestService.getPendingRequests(isSuperAdmin ? null : adminBranch);
          setPendingRequests(data);
        } catch (error) {
          console.error('Failed to fetch requests:', error);
        }
      };

      fetchRequests();

      // Real-time subscription for new requests
      // Note: RLS handles security natively. The client-side filter here ensures this admin only sees
      // requests relevant to their branch (unless they are super admin).
      const channel = supabase
        .channel('admin-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'access_requests'
          },
          (payload) => {
            if (isSuperAdmin || payload.new.branch_id === adminBranch) {
              fetchRequests();

              if (payload.eventType === 'INSERT') {
                notifications.show({
                  title: 'New Access Request',
                  message: 'A user has requested access.',
                  color: 'blue',
                  icon: <IconUserPlus size={16} />
                });
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin, adminBranch, isSuperAdmin]);

  useEffect(() => {
    const fetchGeneralNotifications = async () => {
      if (!userId) return;
      try {
        const data = await notificationService.getAllNotifications(userId);
        setGeneralNotifications(data);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    if (userId) {
      fetchGeneralNotifications();
    }

    const channel = supabase
      .channel('general_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchGeneralNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleMarkAsRead = async (e, notification) => {
    e.stopPropagation();
    if (notification.read) return;

    try {
      // Optimistic update
      setGeneralNotifications(prev => prev.map(n =>
        n.id === notification.id ? { ...n, read: true } : n
      ));

      await notificationService.markAsRead(userId, notification.id);
    } catch (error) {
      console.error("Failed to mark as read", error);
      // Revert if failed. We need to re-fetch or use a more robust strategy.
      // Since fetchGeneralNotifications isn't available here anymore, we'll inline a fetch logic or let it be.
      // For simplicity/robustness, let's just re-fetch using service directly if error.
      try {
        const data = await notificationService.getAllNotifications(userId);
        setGeneralNotifications(data);
      } catch (retryError) {
        console.error("Failed to retry fetch", retryError);
      }
    }
  };

  // Combine items
  // Structure: { type: 'request' | 'general', data: ..., date: ... }
  const allItems = [
    ...pendingRequests.map(r => ({
      type: 'request',
      id: `req-${r.id}`,
      originalId: r.id,
      data: r,
      date: new Date(r.created_at),
      read: false // requests are always "unread" until handled
    })),
    ...generalNotifications.map(n => ({
      type: 'general',
      id: `notif-${n.id}`,
      originalId: n.id,
      data: n,
      date: new Date(n.created_at),
      read: n.read
    }))
  ].sort((a, b) => b.date - a.date);

  const unreadCount = pendingRequests.length + generalNotifications.filter(n => !n.read).length;

  return (
    <Popover opened={opened} onChange={setOpened} width={350} position="bottom-end" shadow="md">
      <Popover.Target>
        <Indicator disabled={unreadCount === 0} color="red" size={16} offset={4} label={unreadCount}>
          <ActionIcon variant="subtle" size="lg" onClick={() => setOpened((o) => !o)}>
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>

      <Popover.Dropdown p="sm">
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" fw={600} c="secondary">
              Notifications
            </Text>
            {unreadCount > 0 && generalNotifications.some(n => !n.read) && (
              <Button variant="subtle" size="xs" compact onClick={() => {
                // Mark all generic as read?
                // Not implemented in service yet, but we can iterate or add bulk API.
                // For now, let's skip "Mark all read" button or implement it later.
              }}>

              </Button>
            )}
          </Group>

          <ScrollArea.Autosize mah="60vh" type="scroll">
            {allItems.length === 0 ? (
              <Text size="sm" c="secondary" ta="center" py="md">
                No new notifications
              </Text>
            ) : (
              <Stack gap="xs">
                {allItems.map((item) => (
                  <Group
                    key={item.id}
                    wrap="nowrap"
                    align="start"
                    p="xs"
                    style={{
                      cursor: item.type === 'request' ? 'pointer' : 'default',
                      backgroundColor: item.read ? 'transparent' : 'var(--mantine-color-default-hover)',
                      borderRadius: 'var(--mantine-radius-sm)'
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
                      <Text size="xs" c="secondary" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
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
                        onClick={(e) => handleMarkAsRead(e, item.data)}
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
      </Popover.Dropdown>
    </Popover>
  );
};

export default NotificationCenter;
