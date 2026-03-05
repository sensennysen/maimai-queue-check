import { useState, useEffect, useCallback, useRef } from 'react';
import { Paper, Title, Button, Group, LoadingOverlay, Box, Alert, Indicator } from '@mantine/core';
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
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const { scrollRef, isDragging } = useMouseDragScroll();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchPlaylists = useCallback(async () => {
    try {
      if (isMounted.current) setLoading(true);
      const playlistsData = await playlistService.getPlaylists(userId);
      if (isMounted.current) setPlaylists(playlistsData);
    } catch (error) {
      console.error("Error loading playlists:", error);
      if (isMounted.current) {
        notifications.show({
          title: 'Error',
          message: 'Failed to load playlists',
          color: 'red'
        });
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchPlaylists();
      // Check for existing draft on mount
      playlistService.getDraft(userId).then((draft) => {
        if (isMounted.current) {
          setHasDraft(!!draft && (!!draft.title || (draft.songs && draft.songs.length > 0) || !!draft.comment));
        }
      }).catch(console.error);
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

  // Called by PlaylistEditModal when draft state changes
  const handleDraftChange = (draftExists) => {
    setHasDraft(draftExists);
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
    <Paper shadow="sm" p="lg" radius="md" withBorder pos="relative" className="playlist-section" style={{ overflow: 'hidden' }}>
      <Group justify="space-between" mb="lg">
        <Group gap="xs">
          <IconPlaylist size={24} style={{ color: 'var(--theme-primary)' }} />
          <Title order={2} style={{ fontSize: 'clamp(1.25rem, 4vw, 2rem)' }} truncate>My Playlists</Title>
        </Group>

        {isOwnProfile && (
          <Indicator color="orange" size={10} processing disabled={!hasDraft}>
            <Button
              leftSection={<IconPlaylistAdd size={18} />}
              variant="light"
              onClick={handleCreateNew}
            >
              New Playlist
            </Button>
          </Indicator>
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
            /* Top padding gives cards room to rotate/hover without clipping */
            /* Horizontal margin matches parent Paper padding to keep it contained */
            /* Top margin 0 prevents the container from bleeding above the Title/Header area */
            padding: '24px 20px 20px 20px',
            margin: '0 -20px -20px -20px',
            overflowX: 'auto',
            overflowY: 'visible',
            scrollBehavior: 'smooth',
            maxWidth: 'calc(100% + 40px)'
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
            onDraftChange={handleDraftChange}
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
