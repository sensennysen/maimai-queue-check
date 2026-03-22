import { Container, Stack, Title, Text, Loader, Alert, Group, Button } from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import { useSharedPlaylists } from './hooks/useSharedPlaylists';
import { PlaylistPostCard } from './components/PlaylistPostCard';
import { useMediaQuery } from '@mantine/hooks';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PlaylistDetailModal } from '../../components/profile/PlaylistDetailModal';
import { useState } from 'react';

const SharedPlaylistsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const initialFocusPostId = searchParams.get('post');
  const initialFocusPlaylistId = searchParams.get('playlist');

  const [detailPlaylist, setDetailPlaylist] = useState(null);
  const [detailSongs, setDetailSongs] = useState([]);

  const {
    posts,
    loading,
    error,
    user,
    editingPostId,
    editContent,
    setEditContent,
    savingEdit,
    fetchPosts,
    getPlaylistSongs,
    handleToggleComments,
    handlePostDelete,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handlePlaylistDelete,
    scrollRef
  } = useSharedPlaylists(initialFocusPostId, initialFocusPlaylistId);

  if (loading && posts.length === 0) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" py={100}>
          <Loader size="xl" variant="bars" color="var(--theme-primary)" />
          <Text size="lg" fw={500} c="dimmed">Loading community playlists...</Text>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error}
          <Button variant="light" color="red" size="xs" mt="md" onClick={fetchPosts} leftSection={<IconRefresh size={14} />}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
      <Container size="xl" py="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <Stack gap={4}>
            <Title order={1} fw={900} style={{ 
              fontSize: '2.5rem',
              background: 'linear-gradient(45deg, var(--theme-primary), var(--theme-secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Community Playlists
            </Title>
            <Text c="dimmed" size="lg">Explore and discuss playlists shared by the community</Text>
          </Stack>
          <Button 
            variant="light" 
            leftSection={<IconRefresh size={16} />}
            onClick={fetchPosts}
            loading={loading}
          >
            Refresh
          </Button>
        </Group>

        {posts.length === 0 ? (
          <Stack align="center" py={100} gap="md">
            <Text size="xl" fw={600} c="dimmed">No playlists shared yet</Text>
            <Text c="dimmed">Be the first to share your playlist from your profile!</Text>
          </Stack>
        ) : (
          <Stack gap="lg" ref={scrollRef}>
            {posts.map((post) => (
              <PlaylistPostCard 
                key={post.id} 
                post={post}
                user={user}
                isMobile={isMobile}
                navigate={navigate}
                editingPostId={editingPostId}
                editContent={editContent}
                setEditContent={setEditContent}
                savingEdit={savingEdit}
                onStartEdit={handleStartEdit}
                onCancelEdit={handleCancelEdit}
                onSaveEdit={handleSaveEdit}
                onToggleComments={handleToggleComments}
                onDeletePost={handlePostDelete}
                onPlaylistDelete={handlePlaylistDelete}
                onViewDetails={(data) => {
                  setDetailPlaylist(data);
                  setDetailSongs(data.fullSongs || []);
                }}
                hydratedSongs={getPlaylistSongs(post.playlist)}
                focusPostId={initialFocusPostId}
                focusPlaylistId={initialFocusPlaylistId}
              />
            ))}
          </Stack>
        )}
      </Stack>

      <PlaylistDetailModal
        playlist={detailPlaylist}
        songs={detailSongs}
        opened={!!detailPlaylist}
        onClose={() => setDetailPlaylist(null)}
        isOwnProfile={detailPlaylist?.authorId === user?.id}
        onEdit={handleStartEdit}
        onDelete={handlePlaylistDelete}
      />
    </Container>
  );
};

export default SharedPlaylistsPage;
