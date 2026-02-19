import { useState, useEffect, useCallback } from 'react';
import { Paper, Title, Button, Text, Group, LoadingOverlay, Box, Alert, ScrollArea } from '@mantine/core';
import { IconPlaylist, IconPlaylistAdd, IconAlertCircle, IconMusic } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { playlistService } from '../../services/supabase';
import { songsService } from '../../services/songs';
import FavoriteSongCard from './FavoriteSongCard';
import FavoriteSongDetailModal from './FavoriteSongDetailModal';
import { PlaylistEditModal } from './PlaylistEditModal';
import { PlaylistStack } from './PlaylistStack';
import { PlaylistDetailModal } from './PlaylistDetailModal';
import { useMouseDragScroll } from '../../hooks/useMouseDragScroll';
import './PlaylistStack.css';

export function PlaylistSection({ userId, isOwnProfile }) {
  // const isMobile = useMediaQuery('(max-width: 768px)'); // Removed per requirement
  const [playlists, setPlaylists] = useState([]);
  const [allSongs, setAllSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null); // Playlist being viewed/edited
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { scrollRef, isDragging } = useMouseDragScroll();

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

  const handleDeletePlaylist = async (deletedId) => {
    try {
      await playlistService.deletePlaylist(deletedId);
      setPlaylists(prev => prev.filter(p => p.id !== deletedId));
      setIsDetailModalOpen(false);
      notifications.show({ title: 'Deleted', message: 'Playlist removed', color: 'blue' });
    } catch (error) {
      console.error('Error deleting playlist:', error);
      notifications.show({ title: 'Error', message: 'Failed to delete playlist', color: 'red' });
    }
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

        {isOwnProfile && (
          <Button
            leftSection={<IconPlaylistAdd size={18} />}
            variant="light"
            onClick={handleCreateNew}
          >
            New Playlist
          </Button>
        )}
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
        <ScrollArea viewportRef={scrollRef} type="never" offsetScrollbars={false} pb={0}>
          <Group wrap="nowrap" gap="xs" pb="xs">
            {playlists.map((pl) => (
              <Box key={pl.id} style={{ minWidth: '200px', width: '220px' }}>
                <PlaylistStack
                  playlist={pl}
                  songs={getPlaylistSongs(pl)}
                  onClick={() => !isDragging && handleViewDetails(pl)}
                />
              </Box>
            ))}
          </Group>
        </ScrollArea>
      )}

      {isOwnProfile && (
        <PlaylistEditModal
          opened={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          userId={userId}
          initialPlaylist={selectedPlaylist ? {
            ...selectedPlaylist,
            fullSongs: getPlaylistSongs(selectedPlaylist)
          } : null}
          onSave={handleSavePlaylist}
        />
      )}

      <PlaylistDetailModal
        playlist={selectedPlaylist}
        songs={selectedPlaylist ? getPlaylistSongs(selectedPlaylist) : []}
        opened={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        isOwnProfile={isOwnProfile}
        onEdit={handleEditFromDetail}
        onDelete={handleDeletePlaylist}
      />
    </Paper>
  );
}
