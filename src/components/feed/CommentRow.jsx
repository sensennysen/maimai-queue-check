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
          <Text size="xs" style={{ wordBreak: 'break-word' }}>{c.content}</Text>
          
          <Group gap={8} mt={4}>
            <Group gap={4}>
              <ActionIcon 
                variant={c.user_vote === 1 ? 'light' : 'subtle'} 
                color={c.user_vote === 1 ? 'blue' : 'gray'} 
                size="sm"
                onClick={() => handleVote(c.id, 1)}
                loading={votingId === c.id && c.user_vote === 1}
              >
                {c.user_vote === 1 ? <IconThumbUpFilled size={16} /> : <IconThumbUp size={16} />}
              </ActionIcon>
              {c.like_count > 0 && (
                <Text 
                  size="sm" 
                  c="dimmed" 
                  fw={c.user_vote === 1 ? 700 : 400}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onVotersClick(c.id, 'likes')}
                >
                  {c.like_count}
                </Text>
              )}
            </Group>

            <Group gap={4}>
              <ActionIcon 
                variant={c.user_vote === -1 ? 'light' : 'subtle'} 
                color={c.user_vote === -1 ? 'red' : 'gray'} 
                size="sm"
                onClick={() => handleVote(c.id, -1)}
                loading={votingId === c.id && c.user_vote === -1}
              >
                {c.user_vote === -1 ? <IconThumbDownFilled size={16} /> : <IconThumbDown size={16} />}
              </ActionIcon>
              {c.dislike_count > 0 && (
                <Text 
                  size="sm" 
                  c="dimmed" 
                  fw={c.user_vote === -1 ? 700 : 400}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onVotersClick(c.id, 'dislikes')}
                >
                  {c.dislike_count}
                </Text>
              )}
            </Group>
          </Group>
        </Box>
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
    </Box>
  );
}
