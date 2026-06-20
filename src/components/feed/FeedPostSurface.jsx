import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Group,
  Image,
  Menu,
  Paper,
  Stack,
  Text,
  Textarea,
  UnstyledButton,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconDotsVertical from '@tabler/icons-react/dist/esm/icons/IconDotsVertical.mjs';
import IconEdit from '@tabler/icons-react/dist/esm/icons/IconEdit.mjs';
import IconMessage from '@tabler/icons-react/dist/esm/icons/IconMessage.mjs';
import IconThumbDown from '@tabler/icons-react/dist/esm/icons/IconThumbDown.mjs';
import IconThumbDownFilled from '@tabler/icons-react/dist/esm/icons/IconThumbDownFilled.mjs';
import IconThumbUp from '@tabler/icons-react/dist/esm/icons/IconThumbUp.mjs';
import IconThumbUpFilled from '@tabler/icons-react/dist/esm/icons/IconThumbUpFilled.mjs';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import IconUsers from '@tabler/icons-react/dist/esm/icons/IconUsers.mjs';
import IconWorld from '@tabler/icons-react/dist/esm/icons/IconWorld.mjs';
import IconX from '@tabler/icons-react/dist/esm/icons/IconX.mjs';
import { useSongDatabaseContext } from '../../hooks/useSongDatabaseContext';
import { getProfileImageUrl, getRelativeTime } from '../../utils/formatters';
import { UserAttributionBadges } from '../common/UserAttributionBadges';
import { FeedPlaylistCard } from './FeedPlaylistCard';
import { FeedSongCard } from './FeedSongCard';

export function FeedPostSurface({
  post,
  className,
  isOwn,
  editing,
  editContent,
  editRemaining,
  saving,
  onEditContentChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onOpenImage,
  likes,
  dislikes,
  userVote,
  voting,
  onVote,
  commentCount,
  onOpenComments,
  children,
}) {
  const navigate = useNavigate();
  const { songMapById } = useSongDatabaseContext();

  return (
    <Paper
      p="md"
      radius="md"
      withBorder
      className={`community-feed-post ${className || ''}`.trim()}
    >
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start">
          <Group
            gap="sm"
            component="button"
            type="button"
            className="community-post-author"
            onClick={() => post.author?.slug && navigate(`/p/${post.author.slug}`)}
            disabled={!post.author?.slug}
          >
            <Avatar src={getProfileImageUrl(post.author)} size={38} radius="xl" color="primary">
              {(post.author?.display_name || '?').charAt(0)}
            </Avatar>
            <Stack gap={0}>
              <Group gap={6} align="center" wrap="nowrap">
                <Text fw={700} size="sm">
                  {post.author?.display_name || 'Unknown'}
                </Text>
                <UserAttributionBadges
                  attributions={post.author?.user_attributions?.attributions}
                  size="sm"
                  gap={4}
                />
              </Group>
              <Group gap={4} align="center">
                <Text
                  size="sm"
                  c="dimmed"
                  className="community-post-metadata"
                  title={new Date(post.created_at).toLocaleString()}
                >
                  {getRelativeTime(post.created_at)}
                  {post.updated_at && <> &middot; edited</>}
                </Text>
                <Text size="sm" c="dimmed">&middot;</Text>
                {post.visibility === 'followers' ? (
                  <IconUsers size={16} style={{ color: 'var(--mantine-color-dimmed)' }} title="Followers only" />
                ) : (
                  <IconWorld size={16} style={{ color: 'var(--mantine-color-dimmed)' }} title="Public" />
                )}
              </Group>
            </Stack>
          </Group>

          {isOwn && (
            <Menu shadow="md" width={170} position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Manage post">
                  <IconDotsVertical size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Manage Post</Menu.Label>
                <Menu.Item leftSection={<IconEdit size={14} />} onClick={onStartEdit}>
                  Edit
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={onDelete}>
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>

        {editing ? (
          <Stack gap="xs">
            <Textarea
              value={editContent}
              onChange={(event) => onEditContentChange(event.currentTarget.value)}
              minRows={2}
              autosize
              maxRows={8}
              disabled={saving}
              description={`${editRemaining} remaining`}
            />
            <Group gap="xs" justify="flex-end">
              <Button
                variant="subtle"
                size="sm"
                leftSection={<IconX size={14} />}
                onClick={onCancelEdit}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                leftSection={<IconCheck size={14} />}
                onClick={onSaveEdit}
                loading={saving}
                disabled={!editContent.trim() || editRemaining < 0}
              >
                Save
              </Button>
            </Group>
          </Stack>
        ) : (
          <Text
            size="md"
            className="community-post-body"
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {post.content}
          </Text>
        )}

        {post.image_url && (
          <Box className="community-post-media">
            <Image
              src={post.image_url}
              alt="Post image"
              fit="contain"
              fallbackSrc="https://placehold.co/600x400?text=Image+not+found"
              className="community-post-media-image"
              onClick={() => onOpenImage(post.image_url, 'Post image')}
            />
          </Box>
        )}

        {(post.attached_song_id || post.attached_playlist) && (
          <Box className="community-post-attachments">
            {post.attached_song_id && (
              <FeedSongCard
                song={songMapById?.get(post.attached_song_id)}
                songId={post.attached_song_id}
                onClick={() => navigate(`/songs/${post.attached_song_id}`)}
                variant="attachment"
              />
            )}
            {post.attached_playlist && (
              <FeedPlaylistCard
                post={{
                  author: post.author,
                  playlist: post.attached_playlist,
                  created_at: post.created_at,
                }}
                onClick={() => navigate(`/shared-playlists?playlist=${post.attached_playlist.id}`)}
                className="clay-sub-card"
              />
            )}
          </Box>
        )}

        <Box className="community-post-conversation">
          <Box className="community-post-reaction-summary" aria-label="Post reaction counts">
            <span>{likes} {likes === 1 ? 'Like' : 'Likes'}</span>
            <span aria-hidden="true">&middot;</span>
            <span>{dislikes} {dislikes === 1 ? 'Dislike' : 'Dislikes'}</span>
          </Box>

          <Box className="community-post-action-bar" role="group" aria-label="Post actions">
            <UnstyledButton
              type="button"
              className="community-post-action"
              onClick={() => onVote(1)}
              disabled={voting}
              aria-label={`Like, ${likes} ${likes === 1 ? 'like' : 'likes'}`}
              aria-pressed={userVote === 1}
            >
              <span className="community-engagement-icon" aria-hidden="true">
                {userVote === 1 ? <IconThumbUpFilled size={18} /> : <IconThumbUp size={18} />}
              </span>
              <span>Like</span>
            </UnstyledButton>

            <UnstyledButton
              type="button"
              className="community-post-action"
              onClick={() => onVote(-1)}
              disabled={voting}
              aria-label={`Dislike, ${dislikes} ${dislikes === 1 ? 'dislike' : 'dislikes'}`}
              aria-pressed={userVote === -1}
            >
              <span className="community-engagement-icon" aria-hidden="true">
                {userVote === -1 ? <IconThumbDownFilled size={18} /> : <IconThumbDown size={18} />}
              </span>
              <span>Dislike</span>
            </UnstyledButton>

            <UnstyledButton
              type="button"
              className="community-post-action"
              onClick={onOpenComments}
              aria-haspopup="dialog"
              aria-label={`Comments, ${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`}
            >
              <IconMessage size={18} stroke={1.6} aria-hidden="true" />
              <span>Comment</span>
            </UnstyledButton>
          </Box>

          {children}
        </Box>
      </Stack>
    </Paper>
  );
}
