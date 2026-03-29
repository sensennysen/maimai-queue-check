import { useState } from 'react';
import {
  Popover, ActionIcon, Indicator, Stack, Text, Group, ThemeIcon,
  ScrollArea, Button, Tabs, Badge
} from '@mantine/core';
import IconBell from '@tabler/icons-react/dist/esm/icons/IconBell.mjs';
import IconUserPlus from '@tabler/icons-react/dist/esm/icons/IconUserPlus.mjs';
import IconInfoCircle from '@tabler/icons-react/dist/esm/icons/IconInfoCircle.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconChevronRight from '@tabler/icons-react/dist/esm/icons/IconChevronRight.mjs';
import IconHeart from '@tabler/icons-react/dist/esm/icons/IconHeart.mjs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { ActivityItem } from './ActivityItem';

const NotificationCenter = () => {
  const { user, userRoles } = useAuth();
  const navigate = useNavigate();
  const [opened, setOpened] = useState(false);
  const [activeTab, setActiveTab] = useState('activity');

  const {
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
  } = useNotifications(user, userRoles);

  const handleNavigateActivity = (item) => {
    setOpened(false);
    if (item.type === 'new_follower' && item.actor?.slug) {
      navigate(`/p/${item.actor.slug}`);
    } else if ((item.type === 'comment_upvote' || item.type === 'comment_downvote') && item.song_id) {
      navigate(`/songs/${item.song_id}`);
    } else if ((item.type === 'playlist_comment_upvote' || item.type === 'playlist_comment_downvote')) {
      navigate('/shared-playlists');
    } else if (item.type === 'post_like' || item.type === 'comment_like') {
      navigate('/feed');
    }
    handleMarkActivityRead(item.id);
  };


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
              rightSection={unreadActivity > 0 ? <Badge size="sm" color="red" circle>{unreadActivity > 9 ? '9+' : unreadActivity}</Badge> : null}
            >
              Activity
            </Tabs.Tab>
            <Tabs.Tab
              value="system"
              leftSection={<IconInfoCircle size={14} />}
              rightSection={unreadSystem > 0 ? <Badge size="sm" color="blue" circle>{unreadSystem}</Badge> : null}
            >
              System
            </Tabs.Tab>
          </Tabs.List>

          {/* ── Activity Tab ── */}
          <Tabs.Panel value="activity">
            <Stack gap={0} p="sm">
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={600} c="dimmed">Recent Activity</Text>
                {unreadActivity > 0 && (
                  <Button variant="subtle" size="sm" onClick={handleMarkAllActivityRead}>
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
              <Text size="sm" fw={600} c="dimmed" mb="xs">System Notifications</Text>
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
                          <Text size="sm" c="secondary" style={{ marginTop: '0.25rem', marginBottom: '0.25rem' }}>
                            {item.type === 'request' ? (
                              `${item.data.user_roles?.email || 'Unknown User'} requested access to ${item.data.allowed_places?.short_name || 'Branch'}`
                            ) : (
                              item.data.message
                            )}
                          </Text>
                          <Text size="sm" c="secondary" mt={4}>
                            {item.date.toLocaleString()}
                          </Text>
                        </div>

                        {item.type === 'general' && !item.read && (
                          <ActionIcon
                            size="md"
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
