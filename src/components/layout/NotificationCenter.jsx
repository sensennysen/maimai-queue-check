import { useState } from 'react';
import {
  Popover, ActionIcon, Indicator, Stack, Text, Group, ThemeIcon,
  ScrollArea, Button, Badge, Box
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import IconBell from '@tabler/icons-react/dist/esm/icons/IconBell.mjs';
import IconUserPlus from '@tabler/icons-react/dist/esm/icons/IconUserPlus.mjs';
import IconInfoCircle from '@tabler/icons-react/dist/esm/icons/IconInfoCircle.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconChevronRight from '@tabler/icons-react/dist/esm/icons/IconChevronRight.mjs';
import IconHeart from '@tabler/icons-react/dist/esm/icons/IconHeart.mjs';
import IconInbox from '@tabler/icons-react/dist/esm/icons/IconInbox.mjs';
import IconSparkles from '@tabler/icons-react/dist/esm/icons/IconSparkles.mjs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { ActivityItem } from './ActivityItem';
import { getRelativeTime } from '../../utils/formatters';
import './NotificationCenter.css';

const inboxViews = [
  {
    value: 'activity',
    label: 'Activity',
    icon: IconHeart,
  },
  {
    value: 'system',
    label: 'System',
    icon: IconInbox,
  },
];

const getSystemTone = (item) => {
  if (item.type === 'request') return 'admin';

  switch (item.data.type) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'danger';
    default:
      return 'info';
  }
};

const getSystemMeta = (item) => {
  if (item.type === 'request') {
    return {
      icon: IconUserPlus,
      title: 'Access Request',
      summary: `${item.data.user_roles?.email || 'Unknown user'} wants access to ${item.data.allowed_places?.short_name || 'a branch'}`,
      tag: 'Admin',
    };
  }

  return {
    icon: IconInfoCircle,
    title: item.data.title,
    summary: item.data.message,
    tag: item.data.type === 'success' ? 'Update' : 'Notice',
  };
};

const handleItemKeyDown = (event, onActivate) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onActivate();
  }
};

const NotificationCenter = () => {
  const { user, userRoles } = useAuth();
  const navigate = useNavigate();
  const [opened, setOpened] = useState(false);
  const [activeTab, setActiveTab] = useState('activity');
  const isMobile = useMediaQuery('(max-width: 768px)');

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
    } else if (item.type === 'playlist_comment_upvote' || item.type === 'playlist_comment_downvote') {
      navigate('/shared-playlists');
    } else if (item.type === 'post_like' || item.type === 'comment_like') {
      navigate('/feed');
    }
    handleMarkActivityRead(item.id);
  };

  const activeItems = activeTab === 'activity' ? activityNotifications : systemItems;
  const unreadCount = activeTab === 'activity' ? unreadActivity : unreadSystem;
  const activeView = inboxViews.find((view) => view.value === activeTab);

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      width={isMobile ? 'calc(100vw - 1rem)' : 420}
      position="bottom-end"
      shadow="md"
      offset={isMobile ? 10 : 14}
    >
      <Popover.Target>
        <Indicator
          disabled={totalUnread === 0}
          color="red"
          size={16}
          offset={4}
          label={totalUnread > 9 ? '9+' : totalUnread}
        >
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={() => setOpened((o) => !o)}
            className={`notification-bell-trigger ${opened ? 'is-open' : ''}`}
            aria-label="Open notifications"
          >
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>

      <Popover.Dropdown p={0} className="notification-center-dropdown">
        <div className="notification-center-shell">
          <Group justify="space-between" align="flex-start" wrap="nowrap" className="notification-center-header">
            <div>
              <Text className="notification-center-kicker">Signal Board</Text>
              <Group gap="xs" align="center">
                <Text className="notification-center-title">Notifications</Text>
                {totalUnread > 0 && (
                  <Badge size="lg" radius="xl" className="notification-center-total-badge">
                    {totalUnread > 99 ? '99+' : totalUnread} new
                  </Badge>
                )}
              </Group>
              <Text className="notification-center-subtitle">
                {totalUnread > 0
                  ? `${unreadActivity} activity and ${unreadSystem} system items waiting`
                  : 'Everything is caught up for now'}
              </Text>
            </div>
            <ThemeIcon variant="light" radius="xl" size={34} className="notification-center-header-icon">
              <IconSparkles size={18} />
            </ThemeIcon>
          </Group>

          <div className="notification-center-view-grid">
            {inboxViews.map((view) => {
              const Icon = view.icon;
              const unread = view.value === 'activity' ? unreadActivity : unreadSystem;
              const isActive = activeTab === view.value;

              return (
                <button
                  key={view.value}
                  type="button"
                  className={`notification-center-view-card ${isActive ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(view.value)}
                >
                  <Group justify="space-between" align="center" wrap="nowrap" gap={8}>
                    <Group align="center" wrap="nowrap" gap={8}>
                      <ThemeIcon variant={isActive ? 'filled' : 'light'} radius="xl" size={32} className="notification-center-view-icon">
                        <Icon size={16} />
                      </ThemeIcon>
                      <Text className="notification-center-view-label">{view.label}</Text>
                    </Group>
                    <Badge variant={unread > 0 ? 'filled' : 'light'} radius="xl" className="notification-center-view-badge">
                      {unread}
                    </Badge>
                  </Group>
                </button>
              );
            })}
          </div>

          <Group justify="space-between" align="center" className="notification-center-section-head">
            <div>
              <Text className="notification-center-section-label">{activeView?.label}</Text>
              <Text className="notification-center-section-meta">
                {activeItems.length} item{activeItems.length === 1 ? '' : 's'}
                {unreadCount > 0 ? ` - ${unreadCount} unread` : ' - All read'}
              </Text>
            </div>
            {activeTab === 'activity' && unreadActivity > 0 && (
              <Button variant="subtle" size="sm" onClick={handleMarkAllActivityRead} className="notification-center-section-action">
                Mark all read
              </Button>
            )}
          </Group>

          <ScrollArea.Autosize mah="56vh" type="scroll" offsetScrollbars>
            {activeTab === 'activity' ? (
              activityNotifications.length === 0 ? (
                <Stack align="center" gap="xs" py="xl" className="notification-center-empty">
                  <ThemeIcon variant="light" radius="xl" size={44}>
                    <IconHeart size={20} />
                  </ThemeIcon>
                  <Text className="notification-center-empty-title">No fresh activity</Text>
                  <Text className="notification-center-empty-copy" ta="center">
                    Follows, likes, and thread replies will light up here.
                  </Text>
                </Stack>
              ) : (
                <Stack gap="xs" className="notification-center-list">
                  {activityNotifications.map((item) => (
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
              )
            ) : systemItems.length === 0 ? (
              <Stack align="center" gap="xs" py="xl" className="notification-center-empty">
                <ThemeIcon variant="light" radius="xl" size={44}>
                  <IconInbox size={20} />
                </ThemeIcon>
                <Text className="notification-center-empty-title">No system alerts</Text>
                <Text className="notification-center-empty-copy" ta="center">
                  Branch requests and app-wide updates will land here.
                </Text>
              </Stack>
            ) : (
              <Stack gap="xs" className="notification-center-list">
                {systemItems.map((item) => {
                  const meta = getSystemMeta(item);
                  const Icon = meta.icon;
                  const tone = getSystemTone(item);
                  const openRequestInbox = () => {
                    setOpened(false);
                    navigate('/admin?tab=requests');
                  };

                  return (
                    <Box
                      key={item.id}
                      component="div"
                      role={item.type === 'request' ? 'button' : undefined}
                      tabIndex={item.type === 'request' ? 0 : undefined}
                      className={`notification-feed-item notification-feed-item-system tone-${tone} ${item.read ? '' : 'is-unread'} ${item.type === 'request' ? 'is-clickable' : ''}`}
                      onClick={() => {
                        if (item.type === 'request') {
                          openRequestInbox();
                        }
                      }}
                      onKeyDown={(event) => {
                        if (item.type === 'request') {
                          handleItemKeyDown(event, openRequestInbox);
                        }
                      }}
                    >
                      <div className="notification-feed-item-leading">
                        <ThemeIcon variant="light" radius="xl" size={36} className="notification-feed-item-icon">
                          <Icon size={18} />
                        </ThemeIcon>
                        {!item.read && <span className="notification-feed-item-dot" aria-hidden="true" />}
                      </div>

                      <div className="notification-feed-item-body">
                        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
                          <div>
                            <Group gap={8} align="center">
                              <Text className="notification-feed-item-title">{meta.title}</Text>
                              <Badge variant="light" radius="xl" className="notification-feed-item-tag">
                                {meta.tag}
                              </Badge>
                            </Group>
                            <Text className="notification-feed-item-summary">{meta.summary}</Text>
                          </div>
                          <Text className="notification-feed-item-time">{getRelativeTime(item.date.toISOString())}</Text>
                        </Group>

                        <Group justify="space-between" align="center" className="notification-feed-item-footer">
                          <Text className="notification-feed-item-meta">{item.date.toLocaleString()}</Text>
                          <Group gap={6} wrap="nowrap">
                            {item.type === 'general' && !item.read && (
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="blue"
                                onClick={(event) => handleMarkGeneralRead(event, item.data)}
                                title="Mark as read"
                              >
                                <IconCheck size={14} />
                              </ActionIcon>
                            )}
                            {item.type === 'request' && (
                              <ThemeIcon variant="light" radius="xl" size={28} className="notification-feed-item-chevron">
                                <IconChevronRight size={14} />
                              </ThemeIcon>
                            )}
                          </Group>
                        </Group>
                      </div>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </ScrollArea.Autosize>
        </div>
      </Popover.Dropdown>
    </Popover>
  );
};

export default NotificationCenter;
