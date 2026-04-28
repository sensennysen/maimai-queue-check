import { Group, ThemeIcon, Avatar, Stack, Text, Button, Badge, ActionIcon } from '@mantine/core';
import IconThumbUp from '@tabler/icons-react/dist/esm/icons/IconThumbUp.mjs';
import IconThumbDown from '@tabler/icons-react/dist/esm/icons/IconThumbDown.mjs';
import IconMessageCircle from '@tabler/icons-react/dist/esm/icons/IconMessageCircle.mjs';
import IconUserPlus from '@tabler/icons-react/dist/esm/icons/IconUserPlus.mjs';
import IconInfoCircle from '@tabler/icons-react/dist/esm/icons/IconInfoCircle.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import { getRelativeTime, getProfileImageUrl } from '../../utils/formatters';

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
  post_like: {
    icon: <IconThumbUp size={14} />,
    color: 'green',
    message: (actor) => `${actor} liked your post`,
  },
  comment_like: {
    icon: <IconThumbUp size={14} />,
    color: 'green',
    message: (actor) => `${actor} liked your comment`,
  },
};

const handleItemKeyDown = (event, onActivate) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onActivate();
  }
};

export function ActivityItem({ item, onMarkRead, onNavigate, isFollowingActor, onFollowBack, followLoading }) {
  const config = typeConfig[item.type] || { icon: <IconInfoCircle size={14} />, color: 'gray', message: (actor) => `${actor} interacted with you` };
  const actorName = item.actor?.display_name || 'Someone';

  return (
    <div
      role="button"
      tabIndex={0}
      className={`notification-feed-item notification-feed-item-activity tone-${config.color} ${item.read ? '' : 'is-unread'}`}
      onClick={() => onNavigate(item)}
      onKeyDown={(event) => handleItemKeyDown(event, () => onNavigate(item))}
    >
      <div className="notification-feed-item-leading">
        <ThemeIcon color={config.color} variant="light" size="lg" radius="xl" className="notification-feed-item-icon">
          {config.icon}
        </ThemeIcon>
        {!item.read && <span className="notification-feed-item-dot" aria-hidden="true" />}
      </div>

      <Group gap="xs" className="notification-feed-item-body" align="flex-start" wrap="nowrap">
        <Avatar
          src={getProfileImageUrl(item.actor)}
          size={34}
          radius="xl"
          color={config.color}
          style={{ flexShrink: 0 }}
        >
          {actorName.charAt(0).toUpperCase()}
        </Avatar>
        <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
            <Text className="notification-feed-item-title" lineClamp={2}>
              {config.message(actorName)}
            </Text>
            <Text className="notification-feed-item-time">
              {getRelativeTime(item.created_at)}
            </Text>
          </Group>
          <Group gap="xs" mt={8} className="notification-feed-item-footer">
            <Text className="notification-feed-item-meta">
              {item.actor?.slug ? `@${item.actor.slug}` : 'Recent activity'}
            </Text>
            {item.type === 'new_follower' && !isFollowingActor && (
              <Button
                variant="subtle"
                size="compact-sm"
                color="blue"
                loading={followLoading}
                onClick={(event) => {
                  event.stopPropagation();
                  onFollowBack(item.actor_id);
                }}
              >
                Follow Back
              </Button>
            )}
            {item.type === 'new_follower' && isFollowingActor && (
              <Badge size="sm" variant="light" color="gray">Following</Badge>
            )}
          </Group>
        </Stack>
      </Group>

      {!item.read && (
        <ActionIcon
          size="sm"
          variant="subtle"
          color="blue"
          onClick={(event) => {
            event.stopPropagation();
            onMarkRead(item.id);
          }}
          title="Mark as read"
        >
          <IconCheck size={12} />
        </ActionIcon>
      )}
    </div>
  );
}
