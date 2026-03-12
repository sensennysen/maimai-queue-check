import { useState, useCallback } from 'react';
import {
  Paper, Group, Avatar, Text, Box, Stack,
  ActionIcon, Menu, Textarea, Button, Image
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useSongDatabaseContext } from '../../hooks/useSongDatabaseContext';
import IconDotsVertical from '@tabler/icons-react/dist/esm/icons/IconDotsVertical.mjs';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import IconEdit from '@tabler/icons-react/dist/esm/icons/IconEdit.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconX from '@tabler/icons-react/dist/esm/icons/IconX.mjs';
import IconMessage from '@tabler/icons-react/dist/esm/icons/IconMessage.mjs';
import IconWorld from '@tabler/icons-react/dist/esm/icons/IconWorld.mjs';
import IconUsers from '@tabler/icons-react/dist/esm/icons/IconUsers.mjs';
import IconThumbUp from '@tabler/icons-react/dist/esm/icons/IconThumbUp.mjs';
import IconThumbDown from '@tabler/icons-react/dist/esm/icons/IconThumbDown.mjs';
import IconThumbUpFilled from '@tabler/icons-react/dist/esm/icons/IconThumbUpFilled.mjs';
import IconThumbDownFilled from '@tabler/icons-react/dist/esm/icons/IconThumbDownFilled.mjs';
import { getRelativeTime, getProfileImageUrl } from '../../utils/formatters';
import { FeedPostComments } from './FeedPostComments';
import { FeedSongCard } from './FeedSongCard';
import { FeedPlaylistCard } from './FeedPlaylistCard';
import { VoterListModal } from '../common/VoterListModal';
import { feedService } from '../../services/supabase';


const MAX_CHARS = 500;

/**
 * Displays a single community feed post with author info, content,
 * inline edit/delete (for own posts), and an expandable comments section.
 */
export function FeedPostCard({ post, currentUser, profileData, onDelete, onUpdate, className }) {
  const navigate = useNavigate();
  const { songMapById } = useSongDatabaseContext();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [saving, setSaving] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count ?? 0);
  const [likes, setLikes] = useState(post.like_count ?? 0);
  const [dislikes, setDislikes] = useState(post.dislike_count ?? 0);
  const [userVote, setUserVote] = useState(post.user_vote ?? 0);
  const [voting, setVoting] = useState(false);
  const [votersOpened, setVotersOpened] = useState(false);
  const [initialVoterTab, setInitialVoterTab] = useState('likes');

  const isOwn = currentUser && post.author?.id === currentUser.id;
  const editRemaining = MAX_CHARS - editContent.length;

  const handleSaveEdit = useCallback(async () => {
    const trimmed = editContent.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      const updated = await feedService.updateFeedPost(post.id, currentUser.id, trimmed);
      onUpdate?.(post.id, updated.content);
      setEditing(false);
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to update post.', color: 'red' });
    } finally {
      setSaving(false);
    }
  }, [editContent, saving, post.id, currentUser?.id, onUpdate]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await feedService.deleteFeedPost(post.id, currentUser.id);
      onDelete?.(post.id);
      notifications.show({ title: 'Deleted', message: 'Post removed.', color: 'blue', autoClose: 2000 });
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to delete post.', color: 'red' });
    }
  }, [post.id, currentUser?.id, onDelete]);

  const handleVote = useCallback(async (type) => {
    if (!currentUser) {
      notifications.show({ title: 'Login required', message: 'Please log in to vote on posts.', color: 'blue' });
      return;
    }
    if (voting) return;

    const oldVote = userVote;
    const newVote = oldVote === type ? 0 : type;

    // Optimistic UI update
    setUserVote(newVote);
    if (oldVote === 1) setLikes(prev => prev - 1);
    if (oldVote === -1) setDislikes(prev => prev - 1);
    if (newVote === 1) setLikes(prev => prev + 1);
    if (newVote === -1) setDislikes(prev => prev + 1);

    setVoting(true);
    try {
      await feedService.voteFeedPost(post.id, currentUser.id, newVote);
    } catch {
      // Rollback on error
      setUserVote(oldVote);
      if (oldVote === 1) setLikes(prev => prev + 1);
      if (oldVote === -1) setDislikes(prev => prev + 1);
      if (newVote === 1) setLikes(prev => prev - 1);
      if (newVote === -1) setDislikes(prev => prev - 1);
      notifications.show({ title: 'Error', message: 'Failed to update vote.', color: 'red' });
    } finally {
      setVoting(false);
    }
  }, [post.id, currentUser, userVote, voting]);

  return (
    <Paper
      p="md"
      radius="md"
      withBorder
      className={className}
    >
      <Stack gap="sm">
        {/* Author row */}
        <Group justify="space-between" align="flex-start">
          <Group
            gap="sm"
            style={{ cursor: 'pointer' }}
            onClick={() => post.author?.slug && navigate(`/p/${post.author.slug}`)}
          >
            <Avatar src={getProfileImageUrl(post.author)} size={36} radius="xl" color="primary">
              {(post.author?.display_name || '?').charAt(0)}
            </Avatar>
            <Stack gap={0}>
              <Text fw={700} size="sm">
                {post.author?.display_name || 'Unknown'}
              </Text>
              <Group gap={4} align="center">
                <Text size="xs" c="dimmed" title={new Date(post.created_at).toLocaleString()}>
                  {getRelativeTime(post.created_at)}
                  {post.updated_at && <> &middot; edited</>}
                </Text>
                <Text size="xs" c="dimmed">&middot;</Text>
                {post.visibility === 'followers' ? (
                  <IconUsers size={14} style={{ color: 'var(--mantine-color-dimmed)' }} title="Followers only" />
                ) : (
                  <IconWorld size={14} style={{ color: 'var(--mantine-color-dimmed)' }} title="Public" />
                )}
              </Group>
            </Stack>
          </Group>

          {isOwn && (
            <Menu shadow="md" width={170} position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" size="sm">
                  <IconDotsVertical size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Manage Post</Menu.Label>
                <Menu.Item
                  leftSection={<IconEdit size={14} />}
                  onClick={() => { setEditContent(post.content || ''); setEditing(true); }}
                >
                  Edit
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={handleDelete}>
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>

        {/* Content */}
        {editing ? (
          <Stack gap="xs">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.currentTarget.value)}
              minRows={2}
              autosize
              maxRows={8}
              disabled={saving}
              description={`${editRemaining} remaining`}
            />
            <Group gap="xs" justify="flex-end">
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconX size={14} />}
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                size="xs"
                leftSection={<IconCheck size={14} />}
                onClick={handleSaveEdit}
                loading={saving}
                disabled={!editContent.trim() || editRemaining < 0}
              >
                Save
              </Button>
            </Group>
          </Stack>
        ) : (
          <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {post.content}
          </Text>
        )}

        {/* Post Image */}
        {post.image_url && (
          <Box mb="xs" radius="md" style={{ overflow: 'hidden', border: '1px solid var(--mantine-color-gray-2)' }}>
            <Image 
              src={post.image_url} 
              alt="Post image" 
              fit="contain" 
              mah={400} 
              fallbackSrc="https://placehold.co/600x400?text=Image+not+found" 
            />
          </Box>
        )}

        {/* Attached Media */}
        {(post.attached_song_id || post.attached_playlist) && (
          <Box mt="xs">
            {post.attached_song_id && (
              <FeedSongCard 
                song={songMapById?.get(post.attached_song_id)}
                songId={post.attached_song_id}
                onClick={() => navigate(`/songs/${post.attached_song_id}`)}
              />
            )}
            {post.attached_playlist && (
              <FeedPlaylistCard 
                post={{ 
                  author: post.author, 
                  playlist: post.attached_playlist,
                  created_at: post.created_at
                }}
                onClick={() => navigate(`/shared-playlists?post=${post.attached_playlist.id}`)}
              />
            )}
          </Box>
        )}

        {/* Comment toggle */}
        <Box>
          <Group gap="xs">
            <Button
              variant="subtle"
              size="xs"
              color="gray"
              leftSection={<IconMessage size={14} />}
              onClick={() => setCommentsOpen(p => !p)}
            >
              {commentsOpen ? 'Hide' : 'Show'} comments{commentCount > 0 ? ` (${commentCount})` : ''}
            </Button>

            <Group gap={4}>
              <ActionIcon 
                variant={userVote === 1 ? 'light' : 'subtle'} 
                color={userVote === 1 ? 'blue' : 'gray'} 
                size="md"
                onClick={() => handleVote(1)}
                loading={voting && userVote === 1}
              >
                {userVote === 1 ? <IconThumbUpFilled size={20} /> : <IconThumbUp size={20} />}
              </ActionIcon>
              {likes > 0 && (
                <Text 
                  size="sm" 
                  c="dimmed" 
                  fw={userVote === 1 ? 700 : 400}
                  style={{ cursor: 'pointer' }}
                  onClick={() => { setInitialVoterTab('likes'); setVotersOpened(true); }}
                >
                  {likes}
                </Text>
              )}

              <ActionIcon 
                variant={userVote === -1 ? 'light' : 'subtle'} 
                color={userVote === -1 ? 'red' : 'gray'} 
                size="md"
                onClick={() => handleVote(-1)}
                loading={voting && userVote === -1}
                ml={4}
              >
                {userVote === -1 ? <IconThumbDownFilled size={20} /> : <IconThumbDown size={20} />}
              </ActionIcon>
              {dislikes > 0 && (
                <Text 
                  size="sm" 
                  c="dimmed" 
                  fw={userVote === -1 ? 700 : 400}
                  style={{ cursor: 'pointer' }}
                  onClick={() => { setInitialVoterTab('dislikes'); setVotersOpened(true); }}
                >
                  {dislikes}
                </Text>
              )}
            </Group>
          </Group>

          {commentsOpen && (
            <Box mt="xs">
              <FeedPostComments
                postId={post.id}
                currentUser={currentUser}
                profileData={profileData}
                onCountChange={setCommentCount}
              />
            </Box>
          )}
        </Box>
      </Stack>

      <VoterListModal
        opened={votersOpened}
        onClose={() => setVotersOpened(false)}
        title="Post Voters"
        fetchVoters={() => feedService.getFeedPostVoters(post.id)}
        initialTab={initialVoterTab}
      />
    </Paper>
  );
}
