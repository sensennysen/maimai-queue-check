import { useState, useEffect } from 'react';
import { Popover, ActionIcon, Indicator, Stack, Text, Group, ThemeIcon, ScrollArea, Button } from '@mantine/core';
import { IconBell, IconUserPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../hooks/useAuth';
import { requestService, supabase } from '../services/supabase';

const NotificationCenter = ({ onOpenAdminPanel }) => {
  const { userRoles } = useAuth();
  const [opened, setOpened] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Derived state: Admin branch (if regular admin)
  const adminBranch = userRoles?.admin_branch;
  const isSuperAdmin = userRoles?.is_super_admin;
  const isAdmin = userRoles?.is_admin || isSuperAdmin;

  useEffect(() => {
    if (isAdmin) {
      const fetchRequests = async () => {
        try {
          // Only show loading on initial fetch if empty? Or just silently update?
          // To avoid flickering, maybe don't set global loading state here if we want to run it in background
          // But we have local loading state.
          setLoading(true);
          const data = await requestService.getPendingRequests(isSuperAdmin ? null : adminBranch);
          setPendingRequests(data);
        } catch (error) {
          console.error('Failed to fetch notifications:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchRequests();

      // Real-time subscription for new requests
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
  }, [isAdmin, adminBranch, isSuperAdmin]); // Dependencies are now correct

  if (!isAdmin) return null;

  return (
    <Popover opened={opened} onChange={setOpened} width={300} position="bottom-end" shadow="md">
      <Popover.Target>
        <Indicator disabled={pendingRequests.length === 0} color="red" size={16} offset={4} label={pendingRequests.length}>
          <ActionIcon variant="subtle" size="lg" onClick={() => setOpened((o) => !o)}>
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>

      <Popover.Dropdown p="sm">
        <Stack gap="xs">
          <Text size="sm" fw={600} c="dimmed">
            Notifications
          </Text>

          <ScrollArea.Autosize maxHeight={300}>
            {loading && pendingRequests.length === 0 ? (
              <Text size="xs" c="dimmed" ta="center">Loading...</Text>
            ) : pendingRequests.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="md">
                No new notifications
              </Text>
            ) : (
              <Stack gap="xs">
                {pendingRequests.map((request) => (
                  <Group key={request.id} wrap="nowrap" align="start" style={{ cursor: 'pointer' }} onClick={() => {
                    setOpened(false);
                    if (onOpenAdminPanel) onOpenAdminPanel();
                  }}>
                    <ThemeIcon color="blue" variant="light" size="md" radius="xl" mt={4}>
                      <IconUserPlus size={16} />
                    </ThemeIcon>
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={500}>
                        Access Request
                      </Text>
                      <Text size="xs" c="dimmed">
                        {request.user_roles?.email || 'Unknown User'} requested access to {request.allowed_places?.arcade_name || 'Branch'}
                      </Text>
                      <Text size="xs" c="dimmed" mt={4}>
                        {new Date(request.created_at).toLocaleDateString()}
                      </Text>
                    </div>
                  </Group>
                ))}
              </Stack>
            )}
          </ScrollArea.Autosize>

          {pendingRequests.length > 0 && (
            <Button variant="light" size="xs" fullWidth mt="xs" onClick={() => {
              setOpened(false);
              if (onOpenAdminPanel) onOpenAdminPanel();
            }}>
              Manage Requests
            </Button>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};

export default NotificationCenter;
