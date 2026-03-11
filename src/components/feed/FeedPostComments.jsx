import { useState, useEffect, useCallback } from 'react';
import {
  Stack, Group, Avatar, Text, Box, Textarea,
  ActionIcon, Divider, Skeleton
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import IconSend from '@tabler/icons-react/dist/esm/icons/IconSend.mjs';
import { getRelativeTime, getProfileImageUrl } from '../../utils/formatters';
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await feedService.getFeedPostComments(postId);
      setComments(data);
      onCountChange?.(data.length);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, [postId, onCountChange]);

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
    </Stack>
  );
}
