import { Box, Group, Avatar, Text, ActionIcon, Tooltip, UnstyledButton } from '@mantine/core';
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
    <Box component="article" className="song-comment">
      <Avatar
        src={getProfileImageUrl(comment.user_profiles)}
        size={30}
        radius="md"
        component={Link}
        to={`/p/${comment.user_profiles?.slug || comment.user_id}`}
        className="song-comment__avatar"
      />
      <Box className="song-comment__content">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Group gap={6} align="center" wrap="nowrap" className="song-comment__header">
            <Text
              fw={650}
              size="sm"
              component={Link}
              to={`/p/${comment.user_profiles?.slug || comment.user_id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              {comment.user_profiles?.display_name || 'Unknown User'}
            </Text>
            <Text c="dimmed" size="xs" title={new Date(comment.created_at).toLocaleString()}>
              {getRelativeTimeCb(comment.created_at)}
            </Text>
          </Group>
          {user && user.id === comment.user_id && (
            <Tooltip label="Delete your comment">
              <ActionIcon
                color="red"
                variant="subtle"
                size="xs"
                aria-label="Delete your comment"
                onClick={() => onDelete(comment.id)}
              >
                <IconTrash size={13} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>

        <Text size="sm" className="song-comment__body">{comment.content}</Text>

        <Group gap="md" mt={6}>
          <UnstyledButton
            type="button"
            className="song-comment__reaction"
            disabled={!user}
            onClick={() => onVote(comment.id, myVote === 1 ? 0 : 1)}
            aria-pressed={myVote === 1}
            aria-label={`Like comment, ${upvotes.length} likes`}
          >
            {myVote === 1 ? <IconThumbUpFilled size={14} /> : <IconThumbUp size={14} />}
            <span>{myVote === 1 ? 'Liked' : 'Like'}{upvotes.length > 0 ? ` · ${upvotes.length}` : ''}</span>
          </UnstyledButton>

          <UnstyledButton
            type="button"
            className="song-comment__reaction song-comment__reaction--dislike"
            disabled={!user}
            onClick={() => onVote(comment.id, myVote === -1 ? 0 : -1)}
            aria-pressed={myVote === -1}
            aria-label={`Dislike comment, ${downvotes.length} dislikes`}
          >
            {myVote === -1 ? <IconThumbDownFilled size={14} /> : <IconThumbDown size={14} />}
            <span>{myVote === -1 ? 'Disliked' : 'Dislike'}{downvotes.length > 0 ? ` · ${downvotes.length}` : ''}</span>
          </UnstyledButton>

          {(upvotes.length > 0 || downvotes.length > 0) && (
            <UnstyledButton
              className="song-comment__voters"
              onClick={() => onShowVoters(comment.id, 'likes')}
              aria-label="View comment voters"
            >
              View voters
            </UnstyledButton>
          )}
        </Group>
      </Box>
    </Box>
  );
}
