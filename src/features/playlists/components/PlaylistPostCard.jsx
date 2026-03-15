import { Paper, Stack, Group, Avatar, Text, Menu, ActionIcon, Textarea, Button, Box, Divider } from '@mantine/core';
import { IconDotsVertical, IconMessageOff, IconMessage, IconEdit, IconTrash, IconX, IconCheck } from '@tabler/icons-react';
import { PlaylistStack } from '../../../components/profile/PlaylistStack';
import { SharedPlaylistHorizontalList } from '../../../components/profile/SharedPlaylistHorizontalList';
import { PlaylistComments } from '../../../components/profile/PlaylistComments';
import { getRelativeTime, getProfileImageUrl } from '../../../utils/formatters';

export function PlaylistPostCard({
  post,
  user,
  isMobile,
  navigate,
  editingPostId,
  editContent,
  setEditContent,
  savingEdit,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onToggleComments,
  onDeletePost,
  onViewDetails,
  hydratedSongs,
  focusPostId,
  focusPlaylistId
}) {
  const isOwnPost = user && post.author.id === user.id;
  const isFocused = focusPostId === String(post.id) || (focusPlaylistId && post.playlist?.id === focusPlaylistId);

  return (
    <Paper
      id={`playlist-post-${post.id}`}
      p="md"
      radius="md"
      withBorder
      className="glass-effect-hover"
      style={
        isFocused
          ? { borderColor: 'var(--theme-primary)', boxShadow: '0 0 0 1px rgba(255, 40, 169, 0.45)' }
          : undefined
      }
    >
      <Stack gap="md">
        {/* Author Header */}
        <Group justify="space-between">
          <Group gap="sm"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/p/${post.author.slug || post.author.id}`)}>
            <Avatar src={getProfileImageUrl(post.author)} size={40} radius="xl" color="blue">
              {(post.author.display_name || post.author.slug || '?').charAt(0).toUpperCase()}
            </Avatar>
            <Stack gap={0}>
              <Text fw={700} size="sm">{post.author.display_name || post.author.slug || 'Unknown User'}</Text>
              <Text size="xs" c="dimmed" title={new Date(post.created_at).toLocaleString()}>
                {getRelativeTime(post.created_at)}
              </Text>
            </Stack>
          </Group>

          {isOwnPost && (
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray">
                  <IconDotsVertical size={18} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Manage Post</Menu.Label>
                <Menu.Item
                  leftSection={post.comments_enabled ? <IconMessageOff size={14} /> : <IconMessage size={14} />}
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
                  onClick={() => onDeletePost(post.id)}
                >
                  Delete Post
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>

        {/* Post Content */}
        {editingPostId === post.id ? (
          <Stack gap="xs">
            <Textarea
              placeholder="Talk about your playlist..."
              value={editContent}
              onChange={(e) => setEditContent(e.currentTarget.value)}
              minRows={3}
              autosize
              maxLength={300}
              description={`${editContent.length}/300 characters`}
              disabled={savingEdit}
            />
            <Group gap="xs" justify="flex-end">
              <Button variant="subtle" size="xs" onClick={onCancelEdit} disabled={savingEdit} leftSection={<IconX size={14} />}>
                Cancel
              </Button>
              <Button size="xs" onClick={onSaveEdit} loading={savingEdit} leftSection={<IconCheck size={14} />}>
                Save
              </Button>
            </Group>
          </Stack>
        ) : (
          post.content && (
            <Text size="md" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {post.content}
            </Text>
          )
        )}

        {/* Attached Playlist Details - Bottom Full Width */}
        <Box mt="xs">
          <Paper p="md" withBorder radius="md" bg="var(--mantine-color-default-hover)" style={{ width: '100%' }}>
            <Stack gap="md">
              <Group justify="space-between">
                <Stack gap={2}>
                  <Text fw={700} lineClamp={1} size="lg">{post.playlist.title}</Text>
                  <Text size="xs" c="dimmed" fw={500}>
                    {hydratedSongs.length} song{hydratedSongs.length !== 1 ? 's' : ''}
                  </Text>
                </Stack>
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => onViewDetails({
                    ...post.playlist,
                    fullSongs: hydratedSongs,
                    authorId: post.author.id,
                    postId: post.id,
                    comments_enabled: post.comments_enabled
                  })}
                >
                  View Details
                </Button>
              </Group>

              {/* Responsive Playlist Display */}
              {isMobile ? (
                <Box w={224} mx="auto" pt="xs">
                  <PlaylistStack
                    playlist={post.playlist}
                    songs={hydratedSongs}
                    onClick={() => onViewDetails({
                      ...post.playlist,
                      fullSongs: hydratedSongs,
                      authorId: post.author.id,
                      postId: post.id,
                      comments_enabled: post.comments_enabled
                    })}
                  />
                </Box>
              ) : (
                /* Horizontal Scrollable Song List - Desktop */
                <SharedPlaylistHorizontalList
                  songs={hydratedSongs}
                  onSongClick={() => onViewDetails({
                    ...post.playlist,
                    fullSongs: hydratedSongs,
                    authorId: post.author.id,
                    postId: post.id,
                    comments_enabled: post.comments_enabled
                  })}
                />
              )}
            </Stack>
          </Paper>
        </Box>

        {/* Comments Section - Directly in feed */}
        <Box>
          <Divider mb="xs" variant="dotted" />
          <PlaylistComments
            postId={post.id}
            ownerId={post.author.id}
            commentsEnabled={post.comments_enabled}
          />
        </Box>
      </Stack>
    </Paper>
  );
}
