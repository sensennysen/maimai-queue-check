import { useState, useEffect, useCallback } from 'react';
import {
  Stack, Group, Avatar, Text, Box, Textarea,
  ActionIcon, Divider, Skeleton
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import IconSend from '@tabler/icons-react/dist/esm/icons/IconSend.mjs';
import IconThumbUp from '@tabler/icons-react/dist/esm/icons/IconThumbUp.mjs';
import IconThumbDown from '@tabler/icons-react/dist/esm/icons/IconThumbDown.mjs';
import IconThumbUpFilled from '@tabler/icons-react/dist/esm/icons/IconThumbUpFilled.mjs';
import IconThumbDownFilled from '@tabler/icons-react/dist/esm/icons/IconThumbDownFilled.mjs';
import { getRelativeTime, getProfileImageUrl } from '../../utils/formatters';
import { VoterListModal } from '../common/VoterListModal';
import { feedService } from '../../services/supabase';

/**
 * Inline comment thread for a FeedPostCard.
 * Loads on first open, supports add + delete (own) comments.
 */
export function FeedPostComments({ postId, currentUser, profileData, onCountChange }) {
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [votingId, setVotingId] = useState(null);
  const [votersOpened, setVotersOpened] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [initialVoterTab, setInitialVoterTab] = useState('likes');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await feedService.getFeedPostComments(postId, currentUser?.id);
      setComments(data);
      onCountChange?.(data.length);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, [postId, currentUser?.id, onCountChange]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || submitting || !currentUser) return;
    setSubmitting(true);
    try {
      const added = await feedService.addFeedPostComment(postId, currentUser.id, trimmed);
      setComments(prev => [...prev, added]);
      onCountChange?.(c => c + 1);
      setNewComment('');
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to post comment.', color: 'red' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await feedService.deleteFeedPostComment(commentId, currentUser.id);
      setComments(prev => prev.filter(c => c.id !== commentId));
      onCountChange?.(cnt => Math.max(0, cnt - 1));
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to delete comment.', color: 'red' });
    }
  };

  const handleVote = async (commentId, type) => {
    if (!currentUser) {
      notifications.show({ title: 'Login required', message: 'Please log in to vote on comments.', color: 'blue' });
      return;
    }
    if (votingId) return;

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const oldVote = comment.user_vote;
    const newVote = oldVote === type ? 0 : type;

    // Optimistic UI update
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      const updated = { ...c, user_vote: newVote };
      if (oldVote === 1) updated.like_count--;
      if (oldVote === -1) updated.dislike_count--;
      if (newVote === 1) updated.like_count++;
      if (newVote === -1) updated.dislike_count++;
      return updated;
    }));

    setVotingId(commentId);
    try {
      await feedService.voteFeedPostComment(commentId, currentUser.id, newVote);
    } catch {
      // Rollback
      setComments(prev => prev.map(c => {
        if (c.id !== commentId) return c;
        const rolledBack = { ...c, user_vote: oldVote };
        if (oldVote === 1) rolledBack.like_count++;
        if (oldVote === -1) rolledBack.dislike_count++;
        if (newVote === 1) rolledBack.like_count--;
        if (newVote === -1) rolledBack.dislike_count--;
        return rolledBack;
      }));
      notifications.show({ title: 'Error', message: 'Failed to update vote.', color: 'red' });
    } finally {
      setVotingId(null);
    }
  };

  return (
    <Stack gap="xs">
      {loading ? (
        <Stack gap={6}>
          <Skeleton height={40} radius="md" />
          <Skeleton height={40} radius="md" />
        </Stack>
      ) : comments.length === 0 ? (
        <Text size="xs" c="dimmed" ta="center" py={4}>
          No comments yet. Be the first!
        </Text>
      ) : (
        comments.map(c => (
          <Box key={c.id}>
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
                          onClick={() => { setSelectedCommentId(c.id); setInitialVoterTab('likes'); setVotersOpened(true); }}
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
                          onClick={() => { setSelectedCommentId(c.id); setInitialVoterTab('dislikes'); setVotersOpened(true); }}
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
        ))
      )}

      {currentUser ? (
        <>
          <Divider variant="dotted" />
          <Group gap="xs" wrap="nowrap" align="flex-end">
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
              styles={{ input: { fontSize: '0.8rem' } }}
            />
            <ActionIcon
              variant="filled"
              color="primary"
              size="md"
              onClick={handleSubmit}
              loading={submitting}
              disabled={!newComment.trim()}
              style={{ flexShrink: 0 }}
            >
              <IconSend size={14} />
            </ActionIcon>
          </Group>
        </>
      ) : (
        <Text size="xs" c="dimmed" ta="center">Log in to comment.</Text>
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
