import { Paper, Stack, Title, Textarea, Group, Button, Text, Loader } from '@mantine/core';
import { useState } from 'react';
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

  const handlePostComment = async () => {
    const success = await onAddComment(newCommentValue);
    if (success) {
      setNewCommentValue('');
    }
  };

  return (
    <Paper p="md" radius="md" withBorder className="comments-column">
      <Stack gap="md">
        <Title order={4}>Comments</Title>

        {user ? (
          <Stack gap="xs">
            <Textarea
              placeholder="Leave a comment..."
              value={newCommentValue}
              onChange={(e) => setNewCommentValue(e.currentTarget.value)}
              disabled={isSubmittingComment}
              minRows={2}
              autosize
            />
            <Group justify="flex-end">
              <Button
                size="sm"
                fullWidth={isMobile}
                loading={isSubmittingComment}
                disabled={!newCommentValue.trim()}
                onClick={handlePostComment}
              >
                Post Comment
              </Button>
            </Group>
          </Stack>
        ) : (
          <Text size="sm" c="dimmed" fs="italic">Log in to post a comment.</Text>
        )}

        {loading ? <Loader size="sm" /> : (
          <Stack gap="md" mt="sm">
            {comments.length > 0 ? comments.map(comment => (
              <CommentCard
                key={comment.id}
                comment={comment}
                user={user}
                userRoles={userRoles}
                getRelativeTimeCb={getRelativeTimeCb}
                onDelete={onDeleteComment}
                onVote={onVoteComment}
                onShowVoters={onShowVoters}
              />
            )) : (
              <Text size="sm" c="dimmed" ta="center" py="xl">No comments yet. Share your thoughts!</Text>
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
