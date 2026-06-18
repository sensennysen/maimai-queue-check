import { useState } from 'react';
import {
  Stack, Group, Avatar, Text, Textarea,
  ActionIcon, Divider, Skeleton
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import IconSend from '@tabler/icons-react/dist/esm/icons/IconSend.mjs';
import { getProfileImageUrl } from '../../utils/formatters';
import { usePostComments } from '../../features/feed/hooks/usePostComments';
import { CommentRow } from './CommentRow';
import { VoterListModal } from '../common/VoterListModal';
import { feedService } from '../../services/supabase';

/**
 * Inline comment thread for a FeedPostCard.
 * Loads on first open, supports add + delete (own) comments.
 */
export function FeedPostComments({ postId, currentUser, profileData, onCountChange }) {
  const navigate = useNavigate();
  const {
    comments,
    loading,
    submitting,
    votingId,
    addComment,
    deleteComment,
    voteComment
  } = usePostComments(postId, currentUser, onCountChange);

  const [newComment, setNewComment] = useState('');
  const [votersOpened, setVotersOpened] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [initialVoterTab, setInitialVoterTab] = useState('likes');

  const handleSubmit = async () => {
    const success = await addComment(newComment);
    if (success) {
      setNewComment('');
    }
  };

  const onVotersClick = (commentId, tab) => {
    setSelectedCommentId(commentId);
    setInitialVoterTab(tab);
    setVotersOpened(true);
  };

  return (
    <Stack gap="sm" className="community-feed-post-comments-stack">
      {loading ? (
        <Stack gap={6}>
          <Skeleton height={40} radius="md" />
          <Skeleton height={40} radius="md" />
        </Stack>
      ) : comments.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py={4}>
          No comments yet. Be the first!
        </Text>
      ) : (
        comments.map(c => (
          <CommentRow
            key={c.id}
            comment={c}
            currentUser={currentUser}
            navigate={navigate}
            handleVote={voteComment}
            handleDelete={deleteComment}
            votingId={votingId}
            onVotersClick={onVotersClick}
          />
        ))
      )}

      {currentUser ? (
        <>
          <Divider variant="dotted" my="md" className="community-feed-comments-input-divider" />
          <Group gap="xs" wrap="nowrap" align="flex-end" className="community-comment-composer">
            <Avatar src={getProfileImageUrl(profileData || currentUser)} size={28} radius="xl" color="primary" style={{ flexShrink: 0 }}>
              {(profileData?.display_name || currentUser?.display_name || '?').charAt(0)}
            </Avatar>
            <Textarea
              placeholder="Write a comment…"
              value={newComment}
              onChange={(e) => setNewComment(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              minRows={1}
              autosize
              maxRows={4}
              maxLength={300}
              disabled={submitting}
              style={{ flex: 1 }}
              radius="md"
              styles={{ input: { fontSize: '0.9rem' } }}
            />
            <ActionIcon
              aria-label="Post comment"
              variant="filled"
              color="primary"
              size="md"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!newComment.trim()}
              style={{ flexShrink: 0 }}
            >
              <IconSend size={16} />
            </ActionIcon>
          </Group>
        </>
      ) : (
        <Text size="sm" c="dimmed" ta="center">Log in to comment.</Text>
      )}

      <VoterListModal
        opened={votersOpened}
        onClose={() => setVotersOpened(false)}
        title="Comment Voters"
        fetchVoters={() => feedService.getFeedPostCommentVoters(selectedCommentId)}
        initialTab={initialVoterTab}
      />
    </Stack>
  );
}
