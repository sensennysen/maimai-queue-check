import { Container, Stack, Text, Loader, Alert, Button, Paper, Box } from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import { useSharedPlaylists } from './hooks/useSharedPlaylists';
import { PlaylistPostCard } from './components/PlaylistPostCard';
import { useSearchParams } from 'react-router-dom';
import { PlaylistDetailModal } from '../../components/profile/PlaylistDetailModal';
import { useState } from 'react';
import { PanelHeader } from '../feed/components/PanelHeader';
import { VoterListModal } from '../../components/common/VoterListModal';
import { playlistService } from '../../services/supabase';
import './SharedPlaylistsPage.css';
import '../../pages/FeedPage.css';

const SharedPlaylistsPage = () => {
  const [searchParams] = useSearchParams();
  const initialFocusPostId = searchParams.get('post');
  const initialFocusPlaylistId = searchParams.get('playlist');

  const [detailPlaylist, setDetailPlaylist] = useState(null);
  const [detailSongs, setDetailSongs] = useState([]);

  const [votersOpened, setVotersOpened] = useState(false);
  const [votersPostId, setVotersPostId] = useState(null);
  const [initialVoterTab, setInitialVoterTab] = useState('likes');

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
    handleVote,
  } = useSharedPlaylists(initialFocusPostId, initialFocusPlaylistId);

  /* ── loading state ── */
  if (loading && posts.length === 0) {
    return (
      <Container size="xl" py="lg" className="playlists-feed-page">
        <Stack align="center" py={100}>
          <Loader size="xl" variant="bars" color="var(--theme-primary)" />
          <Text size="lg" fw={500} c="dimmed">Loading community playlists...</Text>
        </Stack>
      </Container>
    );
  }

  /* ── error state ── */
  if (error) {
    return (
      <Container size="xl" py="lg" className="playlists-feed-page">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error}
          <Button
            variant="light"
            color="red"
            size="xs"
            mt="md"
            onClick={fetchPosts}
            leftSection={<IconRefresh size={14} />}
          >
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  /* ── main page ── */
  return (
    <Container size="xl" py="lg" className="playlists-feed-page">
      <Stack gap="lg">
        {/* Posts list */}
        {posts.length === 0 ? (
          <Paper p="md" radius="xl" withBorder className="community-panel">
            <Box className="playlists-empty-state">
              <Text size="xl" fw={600} c="dimmed">No playlists shared yet</Text>
              <Text c="dimmed" mt="xs">Be the first to share your playlist from your profile!</Text>
            </Box>
          </Paper>
        ) : (
          <Stack gap="sm">
            {posts.map((post) => (
              <PlaylistPostCard
                key={post.id}
                post={post}
                user={user}
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
                onVote={handleVote}
                onViewVoters={(postId, tab = 'likes') => {
                  setVotersPostId(postId);
                  setInitialVoterTab(tab);
                  setVotersOpened(true);
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

      <VoterListModal
        opened={votersOpened}
        onClose={() => setVotersOpened(false)}
        title="Playlist Voters"
        fetchVoters={() => votersPostId ? playlistService.getPlaylistPostVoters(votersPostId) : []}
        initialTab={initialVoterTab}
      />
    </Container>
  );
};

export default SharedPlaylistsPage;
