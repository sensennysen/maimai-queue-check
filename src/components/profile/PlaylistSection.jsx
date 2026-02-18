import { useState, useEffect, useCallback } from 'react';
import { Paper, Title, Button, SimpleGrid, Text, Group, LoadingOverlay, Box, Alert, ScrollArea } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconPlaylist, IconPlaylistAdd, IconAlertCircle, IconMusic } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { playlistService } from '../../services/supabase';
import { songsService } from '../../services/songs';
import FavoriteSongCard from './FavoriteSongCard';
import FavoriteSongDetailModal from './FavoriteSongDetailModal';
import { PlaylistEditModal } from './PlaylistEditModal';
import { PlaylistStack } from './PlaylistStack';
import { PlaylistDetailModal } from './PlaylistDetailModal';
import './PlaylistStack.css';

export function PlaylistSection({ userId, isOwnProfile }) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [playlists, setPlaylists] = useState([]);
  const [allSongs, setAllSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null); // Playlist being viewed/edited
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [playlistsData, songsData] = await Promise.all([
        playlistService.getPlaylists(userId),
        songsService.getFullSongDatabase()
      ]);

      setPlaylists(playlistsData);
      setAllSongs(songsData);
    } catch (error) {
      console.error("Error loading playlist:", error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load playlist',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId, fetchData]);

  const handleSavePlaylist = (updatedPlaylist) => {
    setPlaylists(prev => {
      const exists = prev.find(p => p.id === updatedPlaylist.id);
      if (exists) {
        return prev.map(p => p.id === updatedPlaylist.id ? updatedPlaylist : p);
      }
      return [...prev, updatedPlaylist];
    });
    // Refresh detailed data if needed
    if (selectedPlaylist?.id === updatedPlaylist.id) {
      setSelectedPlaylist(updatedPlaylist);
    }
  };

  const handleDeletePlaylist = (deletedId) => {
    setPlaylists(prev => prev.filter(p => p.id !== deletedId));
    setIsDetailModalOpen(false);
  };

  const getPlaylistSongs = (playlist) => {
    if (!playlist || !playlist.songs) return [];
    return playlist.songs
      .map(entry => allSongs.find(s => s.songId === entry.song_id))
      .filter(Boolean);
  };

  const handleCreateNew = () => {
    setSelectedPlaylist(null);
    setIsEditModalOpen(true);
  };

  const handleViewDetails = (playlist) => {
    setSelectedPlaylist(playlist);
    setIsDetailModalOpen(true);
  };

  const handleEditFromDetail = (playlist) => {
    setSelectedPlaylist(playlist);
    setIsEditModalOpen(true);
  };

  if (loading && allSongs.length === 0) {
    return (
      <Paper shadow="sm" p="lg" radius="md" withBorder mb="xl" style={{ minHeight: 150 }}>
        <LoadingOverlay visible={true} />
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder mb="xl" pos="relative" className="playlist-section">
      <Group justify="space-between" mb="lg">
        <Group gap="xs">
          <IconPlaylist size={24} style={{ color: 'var(--theme-primary)' }} />
          <Title order={2} style={{ fontSize: 'clamp(1.25rem, 4vw, 2rem)' }} truncate>My Playlists</Title>
        </Group>

      </Group>

      {playlists.length === 0 ? (
        <Alert icon={<IconAlertCircle size={16} />} title="No Playlists" color="gray" variant="light">
          {isOwnProfile
            ? "Showcase your recent grind set here!"
            : "This user hasn't created any playlists yet."}
          {isOwnProfile && (
            <Box mt="sm">
              <Button leftSection={<IconPlaylistAdd size={18} />} onClick={handleCreateNew} size="sm">
                Create First Playlist
              </Button>
            </Box>
          )}
        </Alert>
      ) : (
        isMobile ? (
          <ScrollArea type="never" offsetScrollbars={false}>
            <Group wrap="nowrap" gap="md" pb="xs">
              {playlists.map((pl) => (
                <Box key={pl.id} style={{ minWidth: '180px', width: '200px' }}>
                  <PlaylistStack
                    playlist={pl}
                    songs={getPlaylistSongs(pl)}
                    onClick={() => handleViewDetails(pl)}
                  />
                </Box>
              ))}
              {isOwnProfile && (
                <Box className="add-playlist-wrapper" style={{ minWidth: '180px', width: '200px' }}>
                  <Paper
                    withBorder
                    className="add-playlist-card"
                    onClick={handleCreateNew}
                  >
                    <IconPlaylistAdd size={32} />
                    <Text size="xs" fw={700} mt="xs">NEW PLAYLIST</Text>
                  </Paper>
                </Box>
              )}
            </Group>
          </ScrollArea>
        ) : (
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="lg">
            {playlists.map((pl) => (
              <PlaylistStack
                key={pl.id}
                playlist={pl}
                songs={getPlaylistSongs(pl)}
                onClick={() => handleViewDetails(pl)}
              />
            ))}
            {isOwnProfile && (
              <Box className="add-playlist-wrapper">
                <Paper
                  withBorder
                  className="add-playlist-card"
                  onClick={handleCreateNew}
                >
                  <IconPlaylistAdd size={32} />
                  <Text size="xs" fw={700} mt="xs">NEW PLAYLIST</Text>
                </Paper>
              </Box>
            )}
          </SimpleGrid>
        )
      )}

      {
        isOwnProfile && (
          <PlaylistEditModal
            opened={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            userId={userId}
            initialPlaylist={selectedPlaylist ? {
              ...selectedPlaylist,
              fullSongs: getPlaylistSongs(selectedPlaylist)
            } : null}
            onSave={handleSavePlaylist}
            onDelete={handleDeletePlaylist}
          />
        )
      }

      <PlaylistDetailModal
        playlist={selectedPlaylist}
        songs={selectedPlaylist ? getPlaylistSongs(selectedPlaylist) : []}
        opened={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        isOwnProfile={isOwnProfile}
        onEdit={handleEditFromDetail}
      />
    </Paper >
  );
}
