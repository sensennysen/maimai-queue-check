import { Paper, Group, Avatar, Stack, Text, ActionIcon } from '@mantine/core';
import { Link } from 'react-router-dom';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import IconThumbUpFilled from '@tabler/icons-react/dist/esm/icons/IconThumbUpFilled.mjs';
import IconThumbUp from '@tabler/icons-react/dist/esm/icons/IconThumbUp.mjs';
import IconThumbDownFilled from '@tabler/icons-react/dist/esm/icons/IconThumbDownFilled.mjs';
import IconThumbDown from '@tabler/icons-react/dist/esm/icons/IconThumbDown.mjs';
import { getProfileImageUrl } from '../../../utils/formatters';

/**
 * CommentCard component for individual comments
 */
export function CommentCard({ 
  comment, 
  user, 
  getRelativeTimeCb, 
  onDelete, 
  onVote, 
  onShowVoters 
}) {
  const upvotes = comment.song_comment_votes?.filter(v => v.vote_type === 1) || [];
  const downvotes = comment.song_comment_votes?.filter(v => v.vote_type === -1) || [];
  const myVote = comment.song_comment_votes?.find(v => v.user_id === user?.id)?.vote_type || 0;

  return (
    <Paper p="sm" radius="md" withBorder bg="var(--mantine-color-default-hover)">
      <Group justify="space-between" align="flex-start" mb="xs">
        <Group gap="xs">
          <Avatar
            src={getProfileImageUrl(comment.user_profiles)}
            size={40}
            radius="xl"
            component={Link}
            to={`/p/${comment.user_profiles?.slug || comment.user_id}`}
            style={{ cursor: 'pointer' }}
          />
          <Stack gap={0}>
            <Text
              fw={500}
              size="sm"
              component={Link}
              to={`/p/${comment.user_profiles?.slug || comment.user_id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              {comment.user_profiles?.display_name || 'Unknown User'}
            </Text>
            <Text c="dimmed" size="sm" title={new Date(comment.created_at).toLocaleString()}>
              {getRelativeTimeCb(comment.created_at)}
            </Text>
          </Stack>
        </Group>
        {user && user.id === comment.user_id && (
          <ActionIcon
            color="red"
            variant="subtle"
            size="sm"
            title="Delete comment"
            onClick={() => onDelete(comment.id)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        )}
      </Group>
      <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {comment.content}
      </Text>

      <Group gap={8} mt="sm">
        <Group gap={4}>
          <ActionIcon
            variant={myVote === 1 ? 'light' : 'subtle'}
            color={myVote === 1 ? 'blue' : 'gray'}
            size="md"
            disabled={!user}
            onClick={() => onVote(comment.id, myVote === 1 ? 0 : 1)}
          >
            {myVote === 1 ? <IconThumbUpFilled size={20} /> : <IconThumbUp size={20} />}
          </ActionIcon>
          {upvotes.length > 0 && (
            <Text
              size="sm"
              c="dimmed"
              fw={myVote === 1 ? 700 : 400}
              onClick={() => onShowVoters(comment.id, 'likes')}
              style={{ cursor: 'pointer' }}
            >
              {upvotes.length}
            </Text>
          )}
        </Group>

        <Group gap={4}>
          <ActionIcon
            variant={myVote === -1 ? 'light' : 'subtle'}
            color={myVote === -1 ? 'red' : 'gray'}
            size="md"
            disabled={!user}
            onClick={() => onVote(comment.id, myVote === -1 ? 0 : -1)}
          >
            {myVote === -1 ? <IconThumbDownFilled size={20} /> : <IconThumbDown size={20} />}
          </ActionIcon>
          {downvotes.length > 0 && (
            <Text
              size="sm"
              c="dimmed"
              fw={myVote === -1 ? 700 : 400}
              onClick={() => onShowVoters(comment.id, 'dislikes')}
              style={{ cursor: 'pointer' }}
            >
              {downvotes.length}
            </Text>
          )}
        </Group>
      </Group>
    </Paper>
  );
}
