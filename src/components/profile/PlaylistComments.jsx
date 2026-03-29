import { useState, useEffect, useCallback } from 'react';
import { Stack, Text, Textarea, Group, Box, Paper, Avatar, ActionIcon, Loader, Center, Divider } from '@mantine/core';
import { IconTrash, IconAlertCircle, IconThumbUp, IconThumbDown, IconSend, IconThumbUpFilled, IconThumbDownFilled } from '@tabler/icons-react';
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
              <Box key={comment.id} className="community-comment-row">
                <Group gap="xs" wrap="nowrap" align="flex-start">
                  <Avatar
                    src={getProfileImageUrl(comment.user_profiles)}
                    size={28}
                    radius="xl"
                    color="primary"
                    style={{ flexShrink: 0, cursor: 'pointer', marginTop: 2 }}
                    onClick={() => navigate(`/p/${comment.user_profiles?.slug || comment.user_id}`)}
                  >
                    {(comment.user_profiles?.display_name || '?').charAt(0)}
                  </Avatar>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <Group gap={6} align="baseline">
                        <Text
                          size="sm"
                          fw={700}
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/p/${comment.user_profiles?.slug || comment.user_id}`)}
                        >
                          {comment.user_profiles?.display_name || 'Anonymous'}
                        </Text>
                        <Text size="sm" c="dimmed">{getRelativeTime(comment.created_at)}</Text>
                      </Group>
                      {(user?.id === comment.user_id || user?.id === ownerId) && (
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="md"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <IconTrash size={12} />
                        </ActionIcon>
                      )}
                    </Group>
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.4, marginTop: 4 }}>
                      {comment.content}
                    </Text>

                    <Group
                      justify="space-between"
                      align="center"
                      wrap="wrap"
                      gap="sm"
                      mt="xs"
                      className="community-comment-engagement-bar"
                    >
                      <Box style={{ flex: '1 1 auto', minWidth: 0 }}>
                        {(upvotes.length > 0 || downvotes.length > 0) && (
                          <div className="community-post-engagement-stats community-comment-engagement-stats" style={{ display: 'flex', alignItems: 'center', gap: 0, lineHeight: 1 }}>
                            {upvotes.length > 0 && (
                              <button
                                type="button"
                                className="community-post-engagement-stat"
                                onClick={() => {
                                  setSelectedCommentId(comment.id);
                                  setInitialVoterTab('likes');
                                  setVotersOpened(true);
                                }}
                                style={{ padding: 0, margin: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', minWidth: 0 }}
                              >
                                <span style={{ fontSize: 'var(--mantine-font-size-sm)', color: 'var(--mantine-color-dimmed)', whiteSpace: 'nowrap' }}>
                                  {upvotes.length} {upvotes.length === 1 ? 'like' : 'likes'}
                               </span>
                              </button>
                            )}
                            {upvotes.length > 0 && downvotes.length > 0 && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1rem', color: 'var(--mantine-color-dimmed)', fontSize: 'var(--mantine-font-size-xs)', userSelect: 'none' }} aria-hidden>·</span>
                            )}
                            {downvotes.length > 0 && (
                              <button
                                type="button"
                                className="community-post-engagement-stat"
                                onClick={() => {
                                  setSelectedCommentId(comment.id);
                                  setInitialVoterTab('dislikes');
                                  setVotersOpened(true);
                                }}
                                style={{ padding: 0, margin: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', minWidth: 0 }}
                              >
                                <span style={{ fontSize: 'var(--mantine-font-size-sm)', color: 'var(--mantine-color-dimmed)', whiteSpace: 'nowrap' }}>
                                  {downvotes.length} {downvotes.length === 1 ? 'dislike' : 'dislikes'}
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
                          style={{ cursor: user ? 'pointer' : 'default', opacity: user ? 1 : 0.6 }}
                          onClick={async () => {
                            if (!user) return;
                            try {
                              const nextVote = myVote === 1 ? 0 : 1;
                              await playlistService.votePostComment(comment.id, user.id, nextVote);
                              setComments(prev => prev.map(c => {
                                if (c.id !== comment.id) return c;
                                const filteredVotes = (c.playlist_comment_votes || []).filter(v => v.user_id !== user.id);
                                if (nextVote !== 0) {
                                  filteredVotes.push({ 
                                    user_id: user.id, 
                                    vote_type: nextVote, 
                                    user_profiles: { 
                                      display_name: userRoles?.display_name || 'You', 
                                      display_photo_url: userRoles?.display_photo_url,
                                      dx_display_photo_url: userRoles?.dx_display_photo_url
                                    } 
                                  });
                                }
                                return { ...c, playlist_comment_votes: filteredVotes };
                              }));
                            } catch (err) {
                              console.error('Failed to vote', err);
                            }
                          }}
                        >
                          <ActionIcon
                            variant={myVote === 1 ? 'light' : 'subtle'}
                            color={myVote === 1 ? 'blue' : 'gray'}
                            size="lg"
                            aria-label="Like"
                            disabled={!user}
                          >
                            {myVote === 1 ? <IconThumbUpFilled size={18} /> : <IconThumbUp size={18} />}
                          </ActionIcon>
                          <Text size="sm" fw={500}>Like</Text>
                        </Group>

                        <Group
                          gap={6}
                          wrap="nowrap"
                          className="community-engagement-cluster"
                          style={{ cursor: user ? 'pointer' : 'default', opacity: user ? 1 : 0.6 }}
                          onClick={async () => {
                            if (!user) return;
                            try {
                              const nextVote = myVote === -1 ? 0 : -1;
                              await playlistService.votePostComment(comment.id, user.id, nextVote);
                              setComments(prev => prev.map(c => {
                                if (c.id !== comment.id) return c;
                                const filteredVotes = (c.playlist_comment_votes || []).filter(v => v.user_id !== user.id);
                                if (nextVote !== 0) {
                                  filteredVotes.push({ 
                                    user_id: user.id, 
                                    vote_type: nextVote, 
                                    user_profiles: { 
                                      display_name: userRoles?.display_name || 'You', 
                                      display_photo_url: userRoles?.display_photo_url,
                                      dx_display_photo_url: userRoles?.dx_display_photo_url
                                    } 
                                  });
                                }
                                return { ...c, playlist_comment_votes: filteredVotes };
                              }));
                            } catch (err) {
                              console.error('Failed to vote', err);
                            }
                          }}
                        >
                          <ActionIcon
                            variant={myVote === -1 ? 'light' : 'subtle'}
                            color={myVote === -1 ? 'red' : 'gray'}
                            size="lg"
                            aria-label="Dislike"
                            disabled={!user}
                          >
                            {myVote === -1 ? <IconThumbDownFilled size={18} /> : <IconThumbDown size={18} />}
                          </ActionIcon>
                          <Text size="sm" fw={500}>Dislike</Text>
                        </Group>
                      </Group>
                    </Group>
                  </Box>
                </Group>
              </Box>
            );
          })}
        </Stack>
      ) : (
        <Center py="sm">
          <Text size="sm" c="dimmed" fs="italic">No comments yet. Be the first!</Text>
        </Center>
      )}

      {user ? (
        <>
          <Divider variant="dotted" my="sm" />
          <Group gap="xs" wrap="nowrap" align="flex-end">
            <Avatar src={getProfileImageUrl(userRoles || user)} size={28} radius="xl" color="primary" style={{ flexShrink: 0 }}>
              {(userRoles?.display_name || '?').charAt(0)}
            </Avatar>
            <Textarea
              placeholder="Write a comment…"
              value={newComment}
              onChange={(e) => setNewComment(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
              disabled={submitting}
              minRows={1}
              autosize
              maxRows={4}
              maxLength={500}
              style={{ flex: 1 }}
              radius="md"
              styles={{ input: { fontSize: '0.8rem' } }}
            />
            <ActionIcon
              variant="filled"
              color="primary"
              size="md"
              onClick={handleAddComment}
              loading={submitting}
              disabled={!newComment.trim()}
              style={{ flexShrink: 0 }}
            >
              <IconSend size={14} />
            </ActionIcon>
          </Group>
        </>
      ) : (
        <Text size="sm" c="dimmed" ta="center" mt="sm">Log in to leave a comment.</Text>
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
