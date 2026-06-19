import { useState } from 'react';
import {
  Popover, ActionIcon, Indicator, Stack, Text, Group, ThemeIcon,
  ScrollArea, Button, Badge, Box
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import IconBell from '@tabler/icons-react/dist/esm/icons/IconBell.mjs';
import IconUserPlus from '@tabler/icons-react/dist/esm/icons/IconUserPlus.mjs';
import IconInfoCircle from '@tabler/icons-react/dist/esm/icons/IconInfoCircle.mjs';
import IconChevronRight from '@tabler/icons-react/dist/esm/icons/IconChevronRight.mjs';
import IconHeart from '@tabler/icons-react/dist/esm/icons/IconHeart.mjs';
import IconInbox from '@tabler/icons-react/dist/esm/icons/IconInbox.mjs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { ActivityItem } from './ActivityItem';
import { getCompactRelativeTime } from '../../utils/formatters';
import './NotificationCenter.css';

const inboxViews = [
  { value: 'activity', label: 'Activity', icon: IconHeart },
  { value: 'system', label: 'System', icon: IconInbox },
];

const getSystemTone = (item) => {
  if (item.type === 'request') return 'admin';
  if (item.data.type === 'success') return 'success';
  if (item.data.type === 'warning') return 'warning';
  if (item.data.type === 'error') return 'danger';
  return 'info';
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

export function NotificationPanel({ notificationState, onNavigate }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('activity');
  const {
    activityNotifications,
    followedIds,
    followLoadingMap,
    systemItems,
    unreadActivity,
    unreadSystem,
    handleMarkSystemRead,
    handleMarkAllActivityRead,
    handleFollowBack,
  } = notificationState;

  const activeItems = activeTab === 'activity' ? activityNotifications : systemItems;
  const unreadCount = activeTab === 'activity' ? unreadActivity : unreadSystem;
  const activeLabel = activeTab === 'activity' ? 'Activity' : 'System';

  const handleOpenSystemItem = (item) => {
    handleMarkSystemRead(item);
    onNavigate?.();
    navigate(item.type === 'request' ? '/admin?tab=requests' : '/feed');
  };

  return (
    <div className="notification-center-shell">
      <div className="notification-center-view-grid" role="tablist" aria-label="Notification categories">
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
              role="tab"
              aria-selected={isActive}
              id={`notifications-${view.value}-tab`}
              aria-controls={`notifications-${view.value}-panel`}
            >
              <Group justify="space-between" align="center" wrap="nowrap" gap={8}>
                <Group align="center" wrap="nowrap" gap={8}>
                  <ThemeIcon variant="light" radius="xl" size={26} className="notification-center-view-icon">
                    <Icon size={16} />
                  </ThemeIcon>
                  <Text className="notification-center-view-label">{view.label}</Text>
                </Group>
                <Badge variant="light" radius="xl" className="notification-center-view-badge">
                  {unread}
                </Badge>
              </Group>
            </button>
          );
        })}
      </div>

      <Group justify="space-between" align="center" wrap="nowrap" className="notification-center-section-head">
        <Text className="notification-center-section-meta">
          {activeLabel} · {activeItems.length} item{activeItems.length === 1 ? '' : 's'}, {' '}
          {unreadCount > 0 ? `${unreadCount} unread` : 'all read'}
        </Text>
        {activeTab === 'activity' && unreadActivity > 0 && (
          <Button variant="subtle" size="compact-sm" onClick={handleMarkAllActivityRead} className="notification-center-section-action">
            Mark all read
          </Button>
        )}
      </Group>

      <ScrollArea.Autosize
        mah="min(26rem, 56vh)"
        type="scroll"
        offsetScrollbars
        role="tabpanel"
        id={`notifications-${activeTab}-panel`}
        aria-labelledby={`notifications-${activeTab}-tab`}
      >
        {activeTab === 'activity' ? (
          activityNotifications.length === 0 ? (
            <Stack align="center" gap="xs" py="xl" className="notification-center-empty">
              <ThemeIcon variant="light" radius="xl" size={44}>
                <IconHeart size={20} />
              </ThemeIcon>
              <Text className="notification-center-empty-title">No activity yet</Text>
              <Text className="notification-center-empty-copy" ta="center">
                Follows, likes, and thread replies will appear here.
              </Text>
            </Stack>
          ) : (
            <Stack gap={0} className="notification-center-list" role="list">
              {activityNotifications.map((item) => (
                <ActivityItem
                  key={item.id}
                  item={item}
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
            <Text className="notification-center-empty-title">No system notifications</Text>
            <Text className="notification-center-empty-copy" ta="center">
              Branch requests and app-wide updates will appear here.
            </Text>
          </Stack>
        ) : (
          <Stack gap={0} className="notification-center-list" role="list">
            {systemItems.map((item) => {
              const meta = getSystemMeta(item);
              const Icon = meta.icon;
              const tone = getSystemTone(item);

              return (
                <Box
                  key={item.id}
                  component="button"
                  type="button"
                  className={`notification-feed-item notification-feed-item-system tone-${tone} ${item.read ? '' : 'is-unread'} is-clickable`}
                  onClick={() => handleOpenSystemItem(item)}
                  aria-label={`${meta.title}: ${meta.summary}${item.read ? '' : ', unread'}`}
                >
                  <div className="notification-feed-item-leading">
                    <ThemeIcon variant="light" radius="xl" size={32} className="notification-feed-item-icon">
                      <Icon size={16} />
                    </ThemeIcon>
                    {!item.read && <span className="notification-feed-item-dot" aria-hidden="true" />}
                  </div>

                  <div className="notification-feed-item-body">
                    <Group gap={6} align="center" wrap="nowrap">
                      <Text className="notification-feed-item-title">{meta.title}</Text>
                      {meta.tag && (
                        <Badge
                          variant="light"
                          radius="xl"
                          className={`notification-feed-item-tag ${meta.tag === 'Admin' ? 'is-admin' : ''}`}
                        >
                          {meta.tag}
                        </Badge>
                      )}
                    </Group>
                    <Text className="notification-feed-item-summary" lineClamp={2}>{meta.summary}</Text>
                    <Text className="notification-feed-item-meta">{item.date.toLocaleString()}</Text>
                  </div>

                  <div className="notification-system-trailing" aria-hidden="true">
                    <Text className="notification-feed-item-time">
                      {getCompactRelativeTime(item.date.toISOString())}
                    </Text>
                    <IconChevronRight size={14} />
                  </div>
                </Box>
              );
            })}
          </Stack>
        )}
      </ScrollArea.Autosize>
    </div>
  );
}

export function NotificationCenterView({ position = 'bottom-end', notificationState }) {
  const [opened, setOpened] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      width={isMobile ? 'calc(100vw - 1rem)' : 360}
      position={position}
      shadow="md"
      offset={10}
      trapFocus
      returnFocus
    >
      <Popover.Target>
        <Indicator
          disabled={notificationState.totalUnread === 0}
          color="red"
          size={16}
          offset={4}
          label={notificationState.totalUnread > 9 ? '9+' : notificationState.totalUnread}
        >
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={() => setOpened((value) => !value)}
            className={`notification-bell-trigger ${opened ? 'is-open' : ''}`}
            aria-label={notificationState.totalUnread > 0
              ? `${notificationState.totalUnread} unread notification${notificationState.totalUnread === 1 ? '' : 's'}`
              : 'Open notifications'}
          >
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>

      <Popover.Dropdown p={0} className="notification-center-dropdown">
        <NotificationPanel notificationState={notificationState} onNavigate={() => setOpened(false)} />
      </Popover.Dropdown>
    </Popover>
  );
}

const NotificationCenter = ({ position = 'bottom-end' }) => {
  const { user, userRoles } = useAuth();
  const notificationState = useNotifications(user, userRoles);
  return <NotificationCenterView position={position} notificationState={notificationState} />;
};

export default NotificationCenter;
