import { Avatar, Box, Stack, Title, Textarea, Group, Button, Text, Loader } from '@mantine/core';
import { useState } from 'react';
import DeleteConfirmDialog from '../../../components/modals/DeleteConfirmDialog';
import { getProfileImageUrl } from '../../../utils/formatters';
import { CommentCard } from './CommentCard';

/**
 * CommentSection component to manage song comments
 */
export function CommentSection({ 
  comments, 
  loading, 
  user, 
  userRoles,
  isSubmittingComment,
  onAddComment,
  onDeleteComment,
  onVoteComment,
  onShowVoters,
  getRelativeTimeCb,
  isMobile = false,
}) {
  const [newCommentValue, setNewCommentValue] = useState('');
  const [commentToDelete, setCommentToDelete] = useState(null);

  const handlePostComment = async () => {
    const success = await onAddComment(newCommentValue);
    if (success) {
      setNewCommentValue('');
    }
  };

  return (
    <>
    <Box className="song-community-comments">
      <Stack gap="md">
        <Title order={4}>Comments</Title>

        {user ? (
          <Group align="flex-end" wrap="nowrap" className="song-comment-composer">
            <Avatar
              src={getProfileImageUrl(userRoles || user)}
              size={34}
              radius="md"
              color="primary"
            >
              {(userRoles?.display_name || user?.display_name || '?').charAt(0)}
            </Avatar>
            <Textarea
              placeholder="Leave a comment..."
              aria-label="Leave a comment"
              value={newCommentValue}
              onChange={(e) => setNewCommentValue(e.currentTarget.value)}
              disabled={isSubmittingComment}
              minRows={2}
              autosize
              className="song-comment-composer__input"
            />
            <Button
              size="sm"
              loading={isSubmittingComment}
              disabled={!newCommentValue.trim()}
              onClick={handlePostComment}
              className="song-comment-composer__button"
            >
              {isMobile ? 'Post' : 'Post comment'}
            </Button>
          </Group>
        ) : (
          <Text size="sm" c="dimmed" fs="italic">Log in to post a comment.</Text>
        )}

        {loading ? <Loader size="sm" /> : (
          <Stack gap={0} mt="xs" className="song-comment-list">
            {comments.length > 0 ? comments.map(comment => (
              <CommentCard
                key={comment.id}
                comment={comment}
                user={user}
                userRoles={userRoles}
                getRelativeTimeCb={getRelativeTimeCb}
                onDelete={setCommentToDelete}
                onVote={onVoteComment}
                onShowVoters={onShowVoters}
              />
            )) : (
              <Text size="sm" c="dimmed" fs="italic" ta="center" py="xl">
                No comments yet — be the first to share your thoughts.
              </Text>
            )}
          </Stack>
        )}
      </Stack>
    </Box>

    <DeleteConfirmDialog
      opened={!!commentToDelete}
      onClose={() => setCommentToDelete(null)}
      onConfirm={async () => {
        await onDeleteComment(commentToDelete);
        setCommentToDelete(null);
      }}
      title="Delete comment?"
      message="This comment will be permanently removed."
      confirmLabel="Delete comment"
    />
    </>
  );
}
