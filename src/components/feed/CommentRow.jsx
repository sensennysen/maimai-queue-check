import { Group, Avatar, Box, Text, ActionIcon } from '@mantine/core';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import IconThumbUp from '@tabler/icons-react/dist/esm/icons/IconThumbUp.mjs';
import IconThumbDown from '@tabler/icons-react/dist/esm/icons/IconThumbDown.mjs';
import IconThumbUpFilled from '@tabler/icons-react/dist/esm/icons/IconThumbUpFilled.mjs';
import IconThumbDownFilled from '@tabler/icons-react/dist/esm/icons/IconThumbDownFilled.mjs';
import { getRelativeTime, getProfileImageUrl } from '../../utils/formatters';

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
    <Box>
      <Group gap="xs" wrap="nowrap" align="flex-start">
        <Avatar
          src={getProfileImageUrl(c.author)}
          size={28}
          radius="xl"
          color="primary"
          style={{ flexShrink: 0, cursor: 'pointer', marginTop: 2 }}
          onClick={() => c.author?.slug && navigate(`/p/${c.author.slug}`)}
        >
          {(c.author?.display_name || '?').charAt(0)}
        </Avatar>
        <Box style={{ flex: 1 }}>
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Group gap={6} align="baseline">
              <Text
                size="xs"
                fw={700}
                style={{ cursor: 'pointer' }}
                onClick={() => c.author?.slug && navigate(`/p/${c.author.slug}`)}
              >
                {c.author?.display_name || 'Unknown'}
              </Text>
              <Text size="xs" c="dimmed">{getRelativeTime(c.created_at)}</Text>
            </Group>
            {currentUser && c.author?.id === currentUser.id && (
              <ActionIcon
                variant="subtle"
                color="red"
                size="xs"
                onClick={() => handleDelete(c.id)}
              >
                <IconTrash size={12} />
              </ActionIcon>
            )}
          </Group>
          <Text size="md" style={{ wordBreak: 'break-word', marginTop: 4 }}>{c.content}</Text>

          <Group
            justify="space-between"
            align="center"
            wrap="wrap"
            gap="sm"
            mt="xs"
            className="community-comment-engagement-bar"
          >
            <Box style={{ flex: '1 1 auto', minWidth: 0 }}>
              {(c.like_count > 0 || c.dislike_count > 0) && (
                <div className="community-post-engagement-stats community-comment-engagement-stats" style={{ display: 'flex', alignItems: 'center', gap: 0, lineHeight: 1 }}>
                  {c.like_count > 0 && (
                    <button
                      type="button"
                      className="community-post-engagement-stat"
                      onClick={() => onVotersClick(c.id, 'likes')}
                      style={{ padding: 0, margin: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', minWidth: 0 }}
                    >
                      <span style={{ fontSize: 'var(--mantine-font-size-sm)', color: 'var(--mantine-color-dimmed)', whiteSpace: 'nowrap' }}>
                        {c.like_count} {c.like_count === 1 ? 'like' : 'likes'}
                      </span>
                    </button>
                  )}{c.like_count > 0 && c.dislike_count > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1rem', color: 'var(--mantine-color-dimmed)', fontSize: 'var(--mantine-font-size-xs)', userSelect: 'none' }} aria-hidden>·</span>
                  )}{c.dislike_count > 0 && (
                    <button
                      type="button"
                      className="community-post-engagement-stat"
                      onClick={() => onVotersClick(c.id, 'dislikes')}
                      style={{ padding: 0, margin: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', minWidth: 0 }}
                    >
                      <span style={{ fontSize: 'var(--mantine-font-size-sm)', color: 'var(--mantine-color-dimmed)', whiteSpace: 'nowrap' }}>
                        {c.dislike_count} {c.dislike_count === 1 ? 'dislike' : 'dislikes'}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </Box>

            <Group gap="sm" wrap="nowrap" className="community-comment-engagement-actions" style={{ flexShrink: 0 }}>
              <Group
                gap={6}
                wrap="nowrap"
                className="community-engagement-cluster"
                style={{ cursor: 'pointer' }}
                onClick={() => handleVote(c.id, 1)}
              >
                <ActionIcon
                  variant={c.user_vote === 1 ? 'light' : 'subtle'}
                  color={c.user_vote === 1 ? 'blue' : 'gray'}
                  size="lg"
                  aria-label="Like"
                  loading={votingId === c.id}
                >
                  {c.user_vote === 1 ? <IconThumbUpFilled size={18} /> : <IconThumbUp size={18} />}
                </ActionIcon>
                <Text size="sm" fw={500}>
                  Like
                </Text>
              </Group>

              <Group
                gap={6}
                wrap="nowrap"
                className="community-engagement-cluster"
                style={{ cursor: 'pointer' }}
                onClick={() => handleVote(c.id, -1)}
              >
                <ActionIcon
                  variant={c.user_vote === -1 ? 'light' : 'subtle'}
                  color={c.user_vote === -1 ? 'red' : 'gray'}
                  size="lg"
                  aria-label="Dislike"
                  loading={votingId === c.id}
                >
                  {c.user_vote === -1 ? <IconThumbDownFilled size={18} /> : <IconThumbDown size={18} />}
                </ActionIcon>
                <Text size="sm" fw={500}>
                  Dislike
                </Text>
              </Group>
            </Group>
          </Group>
        </Box>
      </Group>
    </Box>
  );
}
