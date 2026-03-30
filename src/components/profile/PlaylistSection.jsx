import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Box, Group, Text, Paper, Title, Indicator, Alert, ActionIcon } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import IconPlaylist from '@tabler/icons-react/dist/esm/icons/IconPlaylist.mjs';
import IconPlaylistAdd from '@tabler/icons-react/dist/esm/icons/IconPlaylistAdd.mjs';
import IconMusicOff from '@tabler/icons-react/dist/esm/icons/IconMusicOff.mjs';
import IconSortAscending from '@tabler/icons-react/dist/esm/icons/IconSortAscending.mjs';
import { notifications } from '@mantine/notifications';
import { playlistService } from '../../services/supabase';
import { PlaylistEditModal } from './PlaylistEditModal';
import { PlaylistStack } from './PlaylistStack';
import { PlaylistDetailModal } from './PlaylistDetailModal';
import { PlaylistManageModal } from './PlaylistManageModal';
import { useMouseDragScroll } from '../../hooks/useMouseDragScroll';
import { useSongDatabaseContext } from '../../hooks/useSongDatabaseContext';
import './PlaylistStack.css';

export function PlaylistSection({ userId, isOwnProfile }) {
  const isMobile = useMediaQuery('(max-width: 500px)');
  const { loading: songsLoading, songMapById } = useSongDatabaseContext();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
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
        return { ...fullSong, level: entry.level };
      })
      .filter(Boolean);
  }, [songMapById]);

  const handleCreateNew = () => {
    setSelectedPlaylist(null);
    setIsEditModalOpen(true);
  };

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

  if (isEverythingLoading && playlists.length === 0) return null;

  const count = playlists.length;

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder className="animate-fade-in delay-200" style={{ overflow: 'hidden' }}>
      <Group justify="space-between" mb="md" align="center">
        <Group gap="xs" align="center">
          <IconPlaylist size={22} style={{ color: 'var(--theme-secondary)' }} />
          <Title order={2}>Custom Playlists</Title>
          {count > 0 && (
            <Text size="sm" c="dimmed" fw={600} ml={4} mt={2}>
              ({count})
            </Text>
          )}
        </Group>

        {isOwnProfile && (
          <Group gap="xs" wrap="nowrap">
            {playlists.length > 1 && (
              isMobile ? (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  radius="xl"
                  onClick={() => setIsManageModalOpen(true)}
                >
                  <IconSortAscending size={20} />
                </ActionIcon>
              ) : (
                <Button
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={() => setIsManageModalOpen(true)}
                  leftSection={<IconSortAscending size={16} />}
                  style={{ borderRadius: 999 }}
                >
                  Order
                </Button>
              )
            )}
            <Indicator color="orange" size={10} processing disabled={!hasDraft}>
              {isMobile ? (
                <ActionIcon
                  variant="light"
                  color="secondary"
                  size="lg"
                  radius="xl"
                  onClick={handleCreateNew}
                >
                  <IconPlaylistAdd size={20} />
                </ActionIcon>
              ) : (
                <Button
                  leftSection={<IconPlaylistAdd size={16} />}
                  variant="light"
                  color="secondary"
                  size="sm"
                  onClick={handleCreateNew}
                  style={{ borderRadius: 999 }}
                >
                  New
                </Button>
              )}
            </Indicator>
          </Group>
        )}
      </Group>

      {/* Content */}
      {playlists.length === 0 ? (
        <Alert icon={<IconMusicOff size={16} />} title="No playlists" color="gray" variant="light">
          {isOwnProfile
            ? "Create custom folders for your training sets, grinds, or favorite charts!"
            : "This player hasn't curated any playlists yet."}
        </Alert>
      ) : (
        <div
          ref={scrollRef}
          className="hide-scrollbar"
          style={{
            display: 'flex',
            padding: '4px 0 6px 0',
            overflowX: 'auto',
            overflowY: 'visible',
            scrollBehavior: 'smooth',
          }}
        >
          <Group wrap="nowrap" gap="sm" style={{ overflow: 'visible' }}>
            {playlists.map((pl) => (
              <Box key={pl.id} style={{ minWidth: '180px', width: '200px', overflow: 'visible' }}>
                <PlaylistStack
                  playlist={pl}
                  songs={getPlaylistSongs(pl)}
                  onClick={() => !isDragging && handleViewDetails(pl)}
                />
              </Box>
            ))}
          </Group>
        </div>
      )}

      {/* Modals */}
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
          onDraftChange={handleDraftChange}
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
      <PlaylistManageModal
        opened={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        userId={userId}
        playlists={playlists}
        onSave={(updatedList) => setPlaylists(updatedList)}
      />
    </Paper>
  );
}
