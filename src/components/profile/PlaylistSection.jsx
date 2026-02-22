import { useState, useEffect, useCallback } from 'react';
import { Paper, Title, Button, Text, Group, LoadingOverlay, Box, Alert } from '@mantine/core';
import { IconPlaylist, IconPlaylistAdd, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { playlistService } from '../../services/supabase';
import { PlaylistEditModal } from './PlaylistEditModal';
import { PlaylistStack } from './PlaylistStack';
import { PlaylistDetailModal } from './PlaylistDetailModal';
import { useMouseDragScroll } from '../../hooks/useMouseDragScroll';
import { useSongDatabaseContext } from '../../hooks/useSongDatabaseContext';
import './PlaylistStack.css';

export function PlaylistSection({ userId, isOwnProfile }) {
  const { loading: songsLoading, songMapById } = useSongDatabaseContext();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true); // Loading for playlists data
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null); // Playlist being viewed/edited
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { scrollRef, isDragging } = useMouseDragScroll();

  const fetchPlaylists = useCallback(async () => {
    try {
      setLoading(true);
      const playlistsData = await playlistService.getPlaylists(userId);
      setPlaylists(playlistsData);
    } catch (error) {
      console.error("Error loading playlists:", error);
      notifications.show({
        title: 'Error',
        message: 'Failed to load playlists',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchPlaylists();
    }
  }, [userId, fetchPlaylists]);

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

  const isEverythingLoading = loading || songsLoading;

  if (isEverythingLoading && playlists.length === 0) {
    return (
      <Paper shadow="sm" p="lg" radius="md" withBorder style={{ minHeight: 150 }}>
        <LoadingOverlay visible={true} />
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder pos="relative" className="playlist-section">
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
        </Alert>
      ) : (
        <div
          ref={scrollRef}
          className="hide-scrollbar"
          style={{
            display: 'flex',
            padding: '32px 10px 0px 10px',
            overflowX: 'auto',
            scrollBehavior: 'smooth'
          }}
        >
          <Group wrap="nowrap" gap="xs" style={{ overflow: 'visible' }}>
            {playlists.map((pl) => (
              <Box key={pl.id} style={{ minWidth: '200px', width: '220px', overflow: 'visible' }}>
                <PlaylistStack
                  playlist={pl}
                  songs={getPlaylistSongs(pl)}
                  onClick={() => !isDragging && handleViewDetails(pl)}
                />
              </Box>
            ))}
          </Group>
        </div>
      )
      }

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
        onDelete={handleDeletePlaylist}
      />
    </Paper >
  );
}
