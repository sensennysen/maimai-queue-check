import { useState, useEffect, useCallback } from 'react';
import { Stack, Text, Button, Textarea, Group, Box, Paper, Avatar, ActionIcon, Loader, Center, Divider } from '@mantine/core';
import { IconTrash, IconMessageCircle, IconAlertCircle, IconThumbUp, IconThumbDown } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../hooks/useAuth';
import { playlistService } from '../../services/supabase';
import { getRelativeTime, getProfileImageUrl } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { VoterListModal } from '../common/VoterListModal';

export function PlaylistComments({ postId, ownerId, commentsEnabled }) {
  const { user, userRoles } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [votersOpened, setVotersOpened] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [initialVoterTab, setInitialVoterTab] = useState('likes');

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    try {
      setLoading(true);
      const data = await playlistService.getPostComments(postId);
      setComments(data || []);
    } catch (err) {
      console.error('Failed to fetch post comments:', err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (commentsEnabled && postId) {
      fetchComments();
    }
  }, [fetchComments, commentsEnabled, postId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !postId) return;
    setSubmitting(true);
    try {
      const added = await playlistService.addPostComment(postId, user.id, newComment);
      setComments(prev => [added, ...prev]);
      setNewComment('');
      notifications.show({ title: 'Success', message: 'Comment posted!', color: 'green' });
    } catch (err) {
      console.error('Failed to add comment:', err);
      notifications.show({ title: 'Error', message: 'Failed to post comment', color: 'red' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await playlistService.deletePostComment(commentId, user.id);
      setComments(prev => prev.filter(c => c.id !== commentId));
      notifications.show({ title: 'Success', message: 'Comment deleted', color: 'blue' });
    } catch (err) {
      console.error('Failed to delete comment:', err);
      notifications.show({ title: 'Error', message: 'Failed to delete comment', color: 'red' });
    }
  };

  if (!commentsEnabled) {
    return (
      <Paper p="md" radius="md" withBorder bg="var(--mantine-color-default-hover)" style={{ borderStyle: 'dashed' }}>
        <Center>
          <Group gap="xs">
            <IconAlertCircle size={18} opacity={0.5} />
            <Text size="sm" c="dimmed">Comments are disabled for this playlist.</Text>
          </Group>
        </Center>
      </Paper>
    );
  }

  return (
    <Stack gap="xs">
      <Divider
        label={
          <Group gap={4}>
            <IconMessageCircle size={14} />
            <Text size="xs" fw={700}>Comments ({comments.length})</Text>
          </Group>
        }
        labelPosition="left"
        variant="dotted"
      />

      {loading ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : comments.length > 0 ? (
        <Stack gap="xs">
          {comments.map((comment) => {
            const upvotes = comment.playlist_comment_votes?.filter(v => v.vote_type === 1) || [];
            const downvotes = comment.playlist_comment_votes?.filter(v => v.vote_type === -1) || [];
            const myVote = comment.playlist_comment_votes?.find(v => v.user_id === user?.id)?.vote_type || 0;

            return (
              <Box key={comment.id} p="xs" radius="sm" bg="var(--mantine-color-default-hover)" style={{ borderLeft: '3px solid var(--mantine-color-blue-filled)', borderRadius: '4px' }}>
                <Stack gap={4}>
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Group gap="xs"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/p/${comment.user_profiles?.slug || comment.user_id}`)}>
                      <Avatar src={getProfileImageUrl(comment.user_profiles)} size={32} radius="xl" />
                      <Stack gap={0}>
                        <Group gap={6} align="baseline">
                          <Text size="xs" fw={700}>{comment.user_profiles?.display_name || 'Anonymous'}</Text>
                          <Text size="xs" c="dimmed">{getRelativeTime(comment.created_at)}</Text>
                        </Group>
                      </Stack>
                    </Group>

                    {(user?.id === comment.user_id || user?.id === ownerId) && (
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="xs"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    )}
                  </Group>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', paddingLeft: '2px' }}>
                    {comment.content}
                  </Text>

                  <Group gap={8} mt={4}>
                    <Group gap={4}>
                      <ActionIcon
                        variant={myVote === 1 ? 'light' : 'subtle'}
                        color={myVote === 1 ? 'blue' : 'gray'}
                        size="sm"
                        disabled={!user}
                        onClick={async () => {
                          try {
                            const nextVote = myVote === 1 ? 0 : 1;
                            await playlistService.votePostComment(comment.id, user.id, nextVote);
                            setComments(prev => prev.map(c => {
                              if (c.id !== comment.id) return c;
                              const filteredVotes = (c.playlist_comment_votes || []).filter(v => v.user_id !== user.id);
                              if (nextVote !== 0) {
                                filteredVotes.push({ user_id: user.id, vote_type: nextVote, user_profiles: { display_name: userRoles?.display_name || 'You', display_photo_url: userRoles?.display_photo_url, dx_display_photo_url: userRoles?.dx_display_photo_url } });
                              }
                              return { ...c, playlist_comment_votes: filteredVotes };
                            }));
                          } catch (err) {
                            console.error('Failed to vote', err);
                          }
                        }}
                      >
                        <IconThumbUp size={16} />
                      </ActionIcon>
                      {upvotes.length > 0 && (
                        <Text
                          size="sm"
                          c="dimmed"
                          fw={myVote === 1 ? 700 : 400}
                          onClick={() => {
                            setSelectedCommentId(comment.id);
                            setInitialVoterTab('likes');
                            setVotersOpened(true);
                          }}
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
                        size="sm"
                        disabled={!user}
                        onClick={async () => {
                          try {
                            const nextVote = myVote === -1 ? 0 : -1;
                            await playlistService.votePostComment(comment.id, user.id, nextVote);
                            setComments(prev => prev.map(c => {
                              if (c.id !== comment.id) return c;
                              const filteredVotes = (c.playlist_comment_votes || []).filter(v => v.user_id !== user.id);
                              if (nextVote !== 0) {
                                filteredVotes.push({ user_id: user.id, vote_type: nextVote, user_profiles: { display_name: userRoles?.display_name || 'You', display_photo_url: userRoles?.display_photo_url, dx_display_photo_url: userRoles?.dx_display_photo_url } });
                              }
                              return { ...c, playlist_comment_votes: filteredVotes };
                            }));
                          } catch (err) {
                            console.error('Failed to vote', err);
                          }
                        }}
                      >
                        <IconThumbDown size={16} />
                      </ActionIcon>
                      {downvotes.length > 0 && (
                        <Text
                          size="sm"
                          c="dimmed"
                          fw={myVote === -1 ? 700 : 400}
                          onClick={() => {
                            setSelectedCommentId(comment.id);
                            setInitialVoterTab('dislikes');
                            setVotersOpened(true);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {downvotes.length}
                        </Text>
                      )}
                    </Group>
                  </Group>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      ) : (
        <Center py="sm">
          <Text size="xs" c="dimmed" fs="italic">No comments yet. Start the conversation!</Text>
        </Center>
      )}

      {user ? (
        <Stack gap="xs" mt="xs">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.currentTarget.value)}
            disabled={submitting}
            minRows={2}
            autosize
            maxLength={500}
          />
          <Group justify="flex-end">
            <Button
              size="sm"
              onClick={handleAddComment}
              loading={submitting}
              disabled={!newComment.trim()}
            >
              Post Comment
            </Button>
          </Group>
        </Stack>
      ) : (
        <Paper p="sm" radius="md" bg="var(--mantine-color-default-hover)" withBorder mt="xs">
          <Text size="sm" ta="center" c="dimmed">Log in to leave a comment.</Text>
        </Paper>
      )}
      <VoterListModal
        opened={votersOpened}
        onClose={() => setVotersOpened(false)}
        title="Comment Voters"
        fetchVoters={() => playlistService.getPlaylistCommentVoters(selectedCommentId)}
        initialTab={initialVoterTab}
      />
    </Stack >
  );
}
