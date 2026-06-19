import { Avatar, Text, Button, Badge } from '@mantine/core';
import { getCompactRelativeTime, getProfileImageUrl } from '../../utils/formatters';

const typeConfig = {
  comment_upvote: {
    color: 'green',
    action: 'upvoted your song comment',
  },
  playlist_comment_upvote: {
    color: 'green',
    action: 'upvoted your playlist comment',
  },
  thread_activity: {
    color: 'blue',
    action: "also commented on a thread you're in",
  },
  comment_downvote: {
    color: 'red',
    action: 'downvoted your song comment',
  },
  playlist_comment_downvote: {
    color: 'orange',
    action: 'downvoted your playlist comment',
  },
  new_follower: {
    color: 'blue',
    action: 'started following you',
  },
  post_like: {
    color: 'green',
    action: 'liked your post',
  },
  comment_like: {
    color: 'green',
    action: 'liked your comment',
  },
};

export function ActivityItem({ item, isFollowingActor, onFollowBack, followLoading }) {
  const config = typeConfig[item.type] || { color: 'gray', action: 'interacted with you' };
  const actorName = item.actor?.display_name || 'Someone';
  const isFollow = item.type === 'new_follower';

  return (
    <div
      role="listitem"
      className={`notification-feed-item notification-feed-item-activity tone-${config.color} ${item.read ? '' : 'is-unread'}`}
      aria-label={`${actorName} ${config.action}${item.read ? '' : ', unread'}`}
    >
      <div className="notification-feed-item-leading">
        <Avatar
          src={getProfileImageUrl(item.actor)}
          alt={actorName}
          size={32}
          radius="xl"
          color={config.color}
        >
          {actorName.charAt(0).toUpperCase()}
        </Avatar>
        {!item.read && <span className="notification-feed-item-dot" aria-hidden="true" />}
      </div>

      <div className="notification-feed-item-body">
        <Text className="notification-feed-item-title" lineClamp={1}>
          <span className="notification-feed-item-actor">{actorName}</span>{' '}
          <span className="notification-feed-item-action">{config.action}</span>
        </Text>
        <Text className="notification-feed-item-meta">
          {item.actor?.slug ? `@${item.actor.slug}` : 'Recent activity'}
        </Text>
      </div>

      <div className="notification-feed-item-trailing">
        {isFollow && !isFollowingActor ? (
          <Button
            variant="subtle"
            size="compact-sm"
            loading={followLoading}
            onClick={() => onFollowBack(item.actor_id)}
            className="notification-follow-back"
          >
            Follow back
          </Button>
        ) : isFollow && isFollowingActor ? (
          <Badge size="sm" variant="light" color="gray" className="notification-following">
            Following
          </Badge>
        ) : (
          <Text className="notification-feed-item-time">
            {getCompactRelativeTime(item.created_at)}
          </Text>
        )}
      </div>
    </div>
  );
}
