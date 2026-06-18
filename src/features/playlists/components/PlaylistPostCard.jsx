import { useState, useCallback, useEffect } from 'react';
import {
  Paper, Stack, Group, Avatar, Text, Menu, ActionIcon,
  Textarea, Button, Box, UnstyledButton, Card,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import IconDotsVertical from '@tabler/icons-react/dist/esm/icons/IconDotsVertical.mjs';
import IconMessageOff from '@tabler/icons-react/dist/esm/icons/IconMessageOff.mjs';
import IconMessage from '@tabler/icons-react/dist/esm/icons/IconMessage.mjs';
import IconMessageCircle from '@tabler/icons-react/dist/esm/icons/IconMessageCircle.mjs';
import IconEdit from '@tabler/icons-react/dist/esm/icons/IconEdit.mjs';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import IconX from '@tabler/icons-react/dist/esm/icons/IconX.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconWorld from '@tabler/icons-react/dist/esm/icons/IconWorld.mjs';
import IconMusic from '@tabler/icons-react/dist/esm/icons/IconMusic.mjs';
import IconThumbUp from '@tabler/icons-react/dist/esm/icons/IconThumbUp.mjs';
import IconThumbDown from '@tabler/icons-react/dist/esm/icons/IconThumbDown.mjs';
import IconThumbUpFilled from '@tabler/icons-react/dist/esm/icons/IconThumbUpFilled.mjs';
import IconThumbDownFilled from '@tabler/icons-react/dist/esm/icons/IconThumbDownFilled.mjs';
import { getRelativeTime, getProfileImageUrl } from '../../../utils/formatters';
import { PlaylistComments } from '../../../components/profile/PlaylistComments';
import { playlistService } from '../../../services/supabase';
import '../../../pages/FeedPage.css';

/* ─── tiny cover mosaic ─── */
function PlaylistCover({ songs }) {
  const covers = (songs || [])
    .map((s) => s.imageUrl || s.image_url)
    .filter(Boolean)
    .slice(0, 4);
  const overflowCount = Math.max((songs || []).length - 4, 0);

  if (covers.length === 0) {
    return (
      <Box
        className="playlist-cover-placeholder"
        style={{
          width: 72,
          height: 72,
          flexShrink: 0,
          borderRadius: 10,
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--theme-primary) 30%, var(--theme-surface)), color-mix(in srgb, var(--theme-secondary) 30%, var(--theme-surface)))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconMusic size={28} style={{ opacity: 0.6, color: 'var(--theme-text-primary)' }} />
      </Box>
    );
  }

  if (covers.length === 1) {
    return (
      <Box className="playlist-cover-single" style={{ flexShrink: 0 }}>
        <img src={covers[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </Box>
    );
  }

  // 2–4 covers: 2×2 grid
  const grid = covers.slice(0, 4);
  return (
    <Box
      className="playlist-cover-mosaic"
      style={{
        width: 72,
        height: 72,
        flexShrink: 0,
        borderRadius: 10,
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 2,
      }}
    >
      {grid.map((src, i) => (
        <img key={i} src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ))}
      {overflowCount > 0 && (
        <span className="playlist-cover-overflow" aria-label={`${overflowCount} more songs`}>
          +{overflowCount}
        </span>
      )}
    </Box>
  );
}

/**
 * Displays a community playlist post with engagement buttons and comments.
 */
export function PlaylistPostCard({
  post,
  user,
  editingPostId,
  editContent,
  setEditContent,
  savingEdit,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onToggleComments,
  onPlaylistDelete,
  onViewDetails,
  onVote,
  onViewVoters,
  hydratedSongs,
}) {
  const navigate = useNavigate();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likes, setLikes] = useState(post.like_count ?? 0);
  const [dislikes, setDislikes] = useState(post.dislike_count ?? 0);
  const [userVote, setUserVote] = useState(post.user_vote ?? 0);
  const [voting, setVoting] = useState(false);
  const [latestComment, setLatestComment] = useState(null);

  const isOwnPost = user && post.author.id === user.id;
  const commentCount = post.comment_count ?? 0;

  const handleVote = useCallback(async (type) => {
    if (!user) {
      notifications.show({ title: 'Login required', message: 'Please log in to vote on playlists.', color: 'blue' });
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
      await onVote(post.id, newVote);
    } catch {
      // Rollback on error
      setUserVote(oldVote);
      if (oldVote === 1) setLikes(prev => prev + 1);
      if (oldVote === -1) setDislikes(prev => prev + 1);
      if (newVote === 1) setLikes(prev => prev - 1);
      if (newVote === -1) setDislikes(prev => prev - 1);
    } finally {
      setVoting(false);
    }
  }, [post.id, user, userVote, voting, onVote]);

  useEffect(() => {
    let cancelled = false;

    const fetchLatestComment = async () => {
      if (!post.id || (post.comment_count ?? 0) <= 0) {
        setLatestComment(null);
        return;
      }
      try {
        const comments = await playlistService.getPostComments(post.id, 1);
        if (!cancelled) setLatestComment(comments?.[0] || null);
      } catch {
        if (!cancelled) setLatestComment(null);
      }
    };

    fetchLatestComment();
    return () => {
      cancelled = true;
    };
  }, [post.id, post.comment_count]);

  const handleViewDetails = useCallback(() => {
    onViewDetails({
      ...post.playlist,
      fullSongs: hydratedSongs,
      authorId: post.author.id,
    });
  }, [onViewDetails, post, hydratedSongs]);

  return (
    <Card
      id={`playlist-post-${post.id}`}
      p={0}
      radius="md"
      className="playlist-post-card"
    >
      <Stack gap={0}>
        {/* Author row */}
        <Group justify="space-between" align="flex-start" wrap="nowrap" className="playlist-post-header">
          <Group
            gap="sm"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/p/${post.author.slug}`)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                navigate(`/p/${post.author.slug}`);
              }
            }}
            role="link"
            tabIndex={0}
            wrap="nowrap"
          >
            <Avatar src={getProfileImageUrl(post.author)} size={42} radius="xl" color="primary">
              {(post.author?.display_name || '?').charAt(0)}
            </Avatar>
            <Stack gap={2}>
              <Text fw={700} size="md">
                {post.author?.display_name || 'Anonymous'}
              </Text>
              <Group gap={4} align="center">
                <Text size="sm" c="dimmed">
                  {getRelativeTime(post.created_at)}
                </Text>
                <Text size="sm" c="dimmed">&middot;</Text>
                <IconWorld size={14} style={{ color: 'var(--mantine-color-dimmed)' }} title="Public" />
              </Group>
            </Stack>
          </Group>

          {isOwnPost && (
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" size="sm">
                  <IconDotsVertical size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Manage Post</Menu.Label>
                <Menu.Item
                  leftSection={post.comments_enabled ? <IconMessageOff size={14} /> : <IconMessageCircle size={14} />}
                  onClick={() => onToggleComments(post.id, post.comments_enabled)}
                >
                  {post.comments_enabled ? 'Disable Comments' : 'Enable Comments'}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconEdit size={14} />}
                  onClick={() => onStartEdit(post)}
                >
                  Edit Caption
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => onPlaylistDelete(post.playlist.id)}
                >
                  Delete Shared Post
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>

        {/* Caption */}
        {editingPostId === post.id ? (
          <Stack gap="xs" className="playlist-post-caption">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.currentTarget.value)}
              minRows={2}
              autosize
              maxRows={8}
              disabled={savingEdit}
            />
            <Group gap="xs" justify="flex-end">
              <Button
                variant="subtle"
                size="sm"
                onClick={onCancelEdit}
                disabled={savingEdit}
                leftSection={<IconX size={14} />}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={onSaveEdit}
                loading={savingEdit}
                leftSection={<IconCheck size={14} />}
              >
                Save
              </Button>
            </Group>
          </Stack>
        ) : (
          post.content && (
            <Text size="sm" className="playlist-post-caption" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {post.content}
            </Text>
          )
        )}

        {/* Embedded playlist block */}
        <Paper
          p="md"
          radius="md"
          withBorder
          className="playlist-embed-card"
          style={{ cursor: 'pointer' }}
          onClick={handleViewDetails}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleViewDetails();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`View ${post.playlist.title || post.playlist.name || 'playlist'} details`}
        >
          <Group gap="lg" align="stretch" wrap="nowrap" className="playlist-embed-layout">
            <PlaylistCover songs={hydratedSongs} />

            <Box className="playlist-embed-content">
              <Text className="playlist-embed-label">Shared playlist</Text>
              <Text fw={700} size="xl" lineClamp={2} className="playlist-embed-title">
                {post.playlist.title || post.playlist.name || 'Untitled Playlist'}
              </Text>
              {post.playlist.comment && (
                <Text size="sm" c="dimmed" lineClamp={3} mt="xs">
                  {post.playlist.comment}
                </Text>
              )}
              <Group gap="sm" mt="auto">
                <Text size="sm" c="dimmed" fw={500}>
                  {hydratedSongs.length} song{hydratedSongs.length !== 1 ? 's' : ''}
                </Text>
                <Text size="sm" className="playlist-view-link">View details</Text>
              </Group>
            </Box>

          </Group>
        </Paper>

        {/* Engagement bar */}
        <Box className="community-post-engagement playlist-post-engagement">
          <Group
            justify="space-between"
            align="center"
            wrap="wrap"
            gap="sm"
            className="community-post-engagement-bar"
          >
            {/* Stats slot — left side */}
            <Box
              className="community-post-engagement-stats-slot"
              style={{ flex: '1 1 0', minWidth: 0 }}
            >
              {(likes > 0 || dislikes > 0) && (
                <div className="community-post-engagement-stats" style={{ display: 'flex', alignItems: 'center', gap: 0, lineHeight: 1 }}>
                  {likes > 0 && (
                    <button
                      type="button"
                      className="community-post-engagement-stat"
                      onClick={() => onViewVoters(post.id, 'likes')}
                      style={{ padding: 0, margin: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', minWidth: 0 }}
                    >
                      <span style={{ fontSize: 'var(--mantine-font-size-sm)', color: 'var(--mantine-color-dimmed)', whiteSpace: 'nowrap' }}>
                        {likes} {likes === 1 ? 'like' : 'likes'}
                      </span>
                    </button>
                  )}
                  {likes > 0 && dislikes > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '1rem', color: 'var(--mantine-color-dimmed)', fontSize: 'var(--mantine-font-size-xs)', userSelect: 'none' }} aria-hidden>·</span>
                  )}
                  {dislikes > 0 && (
                    <button
                      type="button"
                      className="community-post-engagement-stat"
                      onClick={() => onViewVoters(post.id, 'dislikes')}
                      style={{ padding: 0, margin: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', minWidth: 0 }}
                    >
                      <span style={{ fontSize: 'var(--mantine-font-size-sm)', color: 'var(--mantine-color-dimmed)', whiteSpace: 'nowrap' }}>
                        {dislikes} {dislikes === 1 ? 'dislike' : 'dislikes'}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </Box>

            {/* Actions — right side: [Comments, Like, Dislike] */}
            <Group
              gap={6}
              wrap="wrap"
              justify="flex-end"
              align="center"
              className="community-post-engagement-actions"
              style={{ flex: '0 1 auto', minWidth: 0 }}
            >
              <UnstyledButton
                type="button"
                aria-expanded={commentsOpen}
                aria-controls={commentsOpen ? `playlist-post-${post.id}-comments` : undefined}
                className={[
                  'community-post-engagement-btn',
                  commentsOpen ? 'community-post-engagement-btn--comments-open' : '',
                ].filter(Boolean).join(' ')}
                onClick={(e) => {
                  setCommentsOpen((p) => !p);
                  const pe = e.nativeEvent;
                  if (pe && 'pointerType' in pe && pe.pointerType === 'touch') {
                    e.currentTarget.blur();
                  }
                }}
              >
                <Group gap={6} justify="center" wrap="nowrap">
                  <IconMessage size={18} stroke={1.5} />
                  <Text size="sm" fw={500}>
                    Comments
                  </Text>
                  {commentCount > 0 && (
                    <Text component="span" size="sm" c="dimmed" fw={500}>
                      {commentCount}
                    </Text>
                  )}
                </Group>
              </UnstyledButton>

              <UnstyledButton
                type="button"
                className="community-engagement-cluster"
                onClick={() => handleVote(1)}
                aria-pressed={userVote === 1}
                aria-label={`Like playlist${likes > 0 ? `, ${likes} likes` : ''}`}
              >
                <Group gap={6} justify="center" wrap="nowrap">
                  {userVote === 1 ? <IconThumbUpFilled size={18} /> : <IconThumbUp size={18} />}
                  <Text size="sm" fw={500}>Like</Text>
                </Group>
              </UnstyledButton>

              <UnstyledButton
                type="button"
                className="community-engagement-cluster"
                onClick={() => handleVote(-1)}
                aria-pressed={userVote === -1}
                aria-label={`Dislike playlist${dislikes > 0 ? `, ${dislikes} dislikes` : ''}`}
              >
                <Group gap={6} justify="center" wrap="nowrap">
                  {userVote === -1 ? <IconThumbDownFilled size={18} /> : <IconThumbDown size={18} />}
                  <Text size="sm" fw={500}>Dislike</Text>
                </Group>
              </UnstyledButton>
            </Group>
          </Group>
        </Box>

        <Box
          id={`playlist-post-${post.id}-comments`}
          className={[
            'playlist-post-comments',
            commentsOpen ? 'playlist-post-comments--open' : '',
          ].filter(Boolean).join(' ')}
        >
          {/* Latest comment preview */}
          {latestComment && !commentsOpen && (
            <UnstyledButton
              className="playlist-latest-comment"
              onClick={() => setCommentsOpen(true)}
              aria-label="Open playlist comments"
            >
              <Group gap="sm" align="flex-start" wrap="nowrap">
                <Avatar
                  src={getProfileImageUrl(latestComment.user_profiles)}
                  size={30}
                  radius="xl"
                  color="blue"
                >
                  {(latestComment.user_profiles?.display_name || '?').charAt(0)}
                </Avatar>
                <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" fw={700} lineClamp={1}>
                      {latestComment.user_profiles?.display_name || 'Someone'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {getRelativeTime(latestComment.created_at)}
                    </Text>
                  </Group>
                  <Text size="sm" lineClamp={2} className="playlist-latest-comment__content">
                    {latestComment.content}
                  </Text>
                  <Text size="xs" c="primary" fw={600}>
                    View conversation
                  </Text>
                </Stack>
              </Group>
            </UnstyledButton>
          )}

          {/* Expanded comments thread */}
          {commentsOpen && (
            <Box className="playlist-comments-thread">
              <Group justify="space-between" mb="sm">
                <Text fw={700} size="sm">
                  Comments {commentCount > 0 ? `(${commentCount})` : ''}
                </Text>
                <Button variant="subtle" size="compact-xs" onClick={() => setCommentsOpen(false)}>
                  Hide
                </Button>
              </Group>
              <PlaylistComments
                postId={post.id}
                ownerId={post.author.id}
                commentsEnabled={post.comments_enabled}
              />
            </Box>
          )}
        </Box>
      </Stack>
    </Card>
  );
}
