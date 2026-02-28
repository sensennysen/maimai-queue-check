import { useState, useEffect, useCallback } from 'react';
import { Container, Stack, Group, Title, Text, Button, Loader, Paper, Divider, ActionIcon, Avatar, Box, ScrollArea, Image } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconArrowLeft, IconRefresh, IconPlaylist, IconShare, IconDotsVertical, IconMessageOff, IconMessage, IconTrash } from '@tabler/icons-react';
import { Menu } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../hooks/useAuth';
import { playlistService } from '../services/supabase';
import { PlaylistStack } from '../components/profile/PlaylistStack';
import { PlaylistDetailModal } from '../components/profile/PlaylistDetailModal';
import { PlaylistEditModal } from '../components/profile/PlaylistEditModal';
import { GlobalSharePlaylistModal } from '../components/modals/GlobalSharePlaylistModal';
import { SharedPlaylistHorizontalList } from '../components/profile/SharedPlaylistHorizontalList';
import { PlaylistComments } from '../components/profile/PlaylistComments';
import { useSongDatabaseContext } from '../hooks/useSongDatabaseContext';
import { getRelativeTime } from '../utils/formatters';

export default function SharedPlaylistsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading: songsLoading, songMapById } = useSongDatabaseContext();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingPlaylist, setViewingPlaylist] = useState(null);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [shareModalOpened, setShareModalOpened] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await playlistService.getSharedPlaylists();
      setPosts(data || []);
    } catch (err) {
      console.error('Failed to load shared playlists:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const getPlaylistSongs = useCallback((playlist) => {
    if (!playlist || !playlist.songs) return [];
    return playlist.songs
      .map(entry => {
        const fullSong = songMapById?.get(entry.song_id);
        if (!fullSong) return null;
        return { ...fullSong, level: entry.level }; // Inject level from DB
      })
      .filter(Boolean);
  }, [songMapById]);

  const handleToggleComments = async (postId, currentStatus) => {
    try {
      await playlistService.togglePostComments(postId, !currentStatus);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_enabled: !currentStatus } : p));
      notifications.show({ title: 'Updated', message: `Comments ${!currentStatus ? 'enabled' : 'disabled'} successfully`, color: 'blue' });
    } catch (err) {
      console.error('Failed to toggle comments:', err);
      notifications.show({ title: 'Error', message: 'Failed to update comment settings', color: 'red' });
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to remove this post from the feed?')) return;
    try {
      await playlistService.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      notifications.show({ title: 'Deleted', message: 'Post removed from feed', color: 'blue' });
    } catch (err) {
      console.error('Failed to delete post:', err);
      notifications.show({ title: 'Error', message: 'Failed to remove post', color: 'red' });
    }
  };

  return (
    <Container size="md" py="xl" className="animate-fade-in">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-end">
          <Stack gap={0}>
            <Button onClick={() => navigate(-1)} variant="subtle" leftSection={<IconArrowLeft size={16} />} px={0} mb="xs" w="fit-content">
              Go Back
            </Button>
            <Group gap="sm">
              <IconPlaylist size={32} style={{ color: 'var(--theme-primary)' }} />
              <Title order={1} style={{ fontFamily: 'var(--font-heading)' }}>
                Community Playlists
              </Title>
            </Group>
            <Text c="dimmed">Discover playlists shared by other players!</Text>
          </Stack>
          <Group gap="sm">
            {user && (
              <Button
                variant="gradient"
                gradient={{ from: 'indigo', to: 'cyan' }}
                leftSection={<IconShare size={18} />}
                onClick={() => setShareModalOpened(true)}
              >
                Share Your Playlist
              </Button>
            )}
            <ActionIcon variant="light" size="lg" onClick={fetchPosts} loading={loading}>
              <IconRefresh size={20} />
            </ActionIcon>
          </Group>
        </Group>

        {loading || songsLoading ? (
          <Stack align="center" justify="center" py="xl" style={{ minHeight: 200 }}>
            <Loader size="lg" type="bars" color="pink" />
            <Text c="dimmed">Loading community posts...</Text>
          </Stack>
        ) : error ? (
          <Paper p="xl" withBorder radius="md" bg="var(--mantine-color-red-light)">
            <Stack align="center">
              <Text c="red" fw={500}>Failed to load shared playlists.</Text>
              <Button variant="light" color="red" onClick={fetchPosts}>Try Again</Button>
            </Stack>
          </Paper>
        ) : posts.length === 0 ? (
          <Paper p="xl" withBorder radius="md" bg="var(--mantine-color-default-hover)">
            <Stack align="center" py="xl">
              <Text fw={500} size="lg">No playlists have been shared yet.</Text>
              <Text c="dimmed" size="sm">Be the first to share one!</Text>
            </Stack>
          </Paper>
        ) : (
          <Stack gap="xl">
            {posts.map((post) => {
              const hydratedSongs = getPlaylistSongs(post.playlist);
              return (
                <Paper key={post.id} p="md" radius="md" withBorder className="glass-effect-hover">
                  <Stack gap="md">
                    {/* Author Header */}
                    <Group justify="space-between">
                      <Group gap="sm"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/p/${post.author.slug || post.author.id}`)}>
                        <Avatar src={post.author.display_photo_url} radius="xl" color="blue">
                          {(post.author.display_name || post.author.slug || '?').charAt(0).toUpperCase()}
                        </Avatar>
                        <Stack gap={0}>
                          <Text fw={700} size="sm">{post.author.display_name || post.author.slug || 'Unknown User'}</Text>
                          <Text size="xs" c="dimmed" title={new Date(post.created_at).toLocaleString()}>
                            {getRelativeTime(post.created_at)}
                          </Text>
                        </Stack>
                      </Group>

                      {user && post.author.id === user.id && (
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
                              onClick={() => handleToggleComments(post.id, post.comments_enabled)}
                            >
                              {post.comments_enabled ? 'Disable Comments' : 'Enable Comments'}
                            </Menu.Item>

                            <Menu.Divider />

                            <Menu.Item
                              color="red"
                              leftSection={<IconTrash size={14} />}
                              onClick={() => handleDeletePost(post.id)}
                            >
                              Delete Post
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      )}
                    </Group>

                    {/* Post Content */}
                    {post.content && (
                      <Text size="md" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {post.content}
                      </Text>
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
                              onClick={() => setViewingPlaylist({
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
                                onClick={() => setViewingPlaylist({
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
                              onSongClick={() => setViewingPlaylist({
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
            })}
          </Stack>
        )}
      </Stack>

      <PlaylistDetailModal
        opened={!!viewingPlaylist}
        onClose={() => setViewingPlaylist(null)}
        playlist={viewingPlaylist}
        songs={viewingPlaylist?.fullSongs || []}
        postId={viewingPlaylist?.postId}
        isOwnProfile={user && viewingPlaylist?.authorId === user.id}
        onEdit={(p) => setEditingPlaylist(p)}
        hideShareDelete={true}
        onDelete={async (id) => {
          try {
            await playlistService.deletePlaylist(id);
            setViewingPlaylist(null);
            fetchPosts();
            notifications.show({ title: 'Deleted', message: 'Playlist removed successfully', color: 'blue' });
          } catch (err) {
            console.error('Failed to delete playlist:', err);
            notifications.show({ title: 'Error', message: 'Failed to delete playlist', color: 'red' });
          }
        }}
      />

      <PlaylistEditModal
        opened={!!editingPlaylist}
        onClose={() => setEditingPlaylist(null)}
        userId={user?.id}
        initialPlaylist={editingPlaylist}
        hidePublicToggle={true}
        onSave={() => {
          setEditingPlaylist(null);
          fetchPosts();
        }}
      />

      <GlobalSharePlaylistModal
        opened={shareModalOpened}
        onClose={() => setShareModalOpened(false)}
        onSuccess={fetchPosts}
      />
    </Container>
  );
}
