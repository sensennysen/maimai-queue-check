import { Group, Avatar, Box, Text, ActionIcon, UnstyledButton } from '@mantine/core';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import { getRelativeTime, getProfileImageUrl } from '../../utils/formatters';
import { UserAttributionBadges } from '../common/UserAttributionBadges';

export function CommentRow({
  comment: c,
  currentUser,
  navigate,
  handleVote,
  handleDelete,
  votingId,
  onVotersClick
}) {
  return (
    <Box
      component="article"
      className="community-post-comment-preview community-thread-comment"
      aria-label={`Comment from ${c.author?.display_name || 'Unknown'}`}
    >
      <Avatar
        src={getProfileImageUrl(c.author)}
        size={30}
        radius="md"
        color="primary"
        className="community-post-comment-avatar"
        style={{ cursor: c.author?.slug ? 'pointer' : 'default' }}
        onClick={() => c.author?.slug && navigate(`/p/${c.author.slug}`)}
      >
        {(c.author?.display_name || '?').charAt(0)}
      </Avatar>

      <Box className="community-post-comment-content">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap={6} align="center" wrap="nowrap" className="community-post-comment-header">
            <Text
              size="sm"
              fw={650}
              lineClamp={1}
              style={{ cursor: c.author?.slug ? 'pointer' : 'default' }}
              onClick={() => c.author?.slug && navigate(`/p/${c.author.slug}`)}
            >
              {c.author?.display_name || 'Unknown'}
            </Text>
            <UserAttributionBadges
              attributions={c.author?.user_attributions?.attributions}
              size="xs"
              gap={4}
            />
            <Text size="xs" c="dimmed">{getRelativeTime(c.created_at)}</Text>
          </Group>

          {currentUser && c.author?.id === currentUser.id && (
            <ActionIcon
              variant="subtle"
              color="red"
              size="xs"
              aria-label="Delete comment"
              onClick={() => handleDelete(c.id)}
            >
              <IconTrash size={12} />
            </ActionIcon>
          )}
        </Group>

        <Text size="sm" className="community-post-comment-body">{c.content}</Text>

        <Group gap="md" mt={6} wrap="wrap">
          <Group gap={4} wrap="nowrap">
            <UnstyledButton
              type="button"
              className="community-post-comment-like"
              onClick={() => handleVote(c.id, 1)}
              disabled={votingId === c.id}
              aria-pressed={c.user_vote === 1}
              aria-label={`Like comment, ${c.like_count || 0} likes`}
            >
              {c.user_vote === 1 ? 'Liked' : 'Like'}
            </UnstyledButton>
            {c.like_count > 0 && (
              <UnstyledButton
                type="button"
                className="community-post-comment-count"
                onClick={() => onVotersClick(c.id, 'likes')}
                aria-label={`View ${c.like_count} comment likes`}
              >
                {c.like_count}
              </UnstyledButton>
            )}
          </Group>
        </Group>
      </Box>
    </Box>
  );
}
