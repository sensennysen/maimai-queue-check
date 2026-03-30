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

export function ActivityItem({ item, onMarkRead, onNavigate, isFollowingActor, onFollowBack, followLoading }) {
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
          <Text size="sm" lineClamp={2}>
            {config.message(actorName)}
          </Text>
          <Group gap="xs" mt={2}>
            <Text size="sm" c="dimmed">
              {getRelativeTime(item.created_at)}
            </Text>
            {item.type === 'new_follower' && !isFollowingActor && (
              <Button
                variant="subtle"
                size="compact-sm"
                color="blue"
                loading={followLoading}
                onClick={(e) => { e.stopPropagation(); onFollowBack(item.actor_id); }}
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
          onClick={(e) => { e.stopPropagation(); onMarkRead(item.id); }}
          title="Mark as read"
        >
          <IconCheck size={12} />
        </ActionIcon>
      )}
    </Group>
  );
}
