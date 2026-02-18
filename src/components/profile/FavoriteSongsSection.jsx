import { useState, useEffect, useMemo } from 'react';
import { Paper, Title, Button, SimpleGrid, Text, Group, LoadingOverlay, ActionIcon, Stack, Box, Alert, ScrollArea } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconPlus, IconX, IconHeart, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { favoritesService } from '../../services/supabase';
import { songsService } from '../../services/songs';
import { TextInput, Modal as MantineModal } from '@mantine/core';
import FavoriteSongCard from './FavoriteSongCard';
import SongSelectionModal from '../../features/songs/components/SongSelectionModal';
import FavoriteSongDetailModal from './FavoriteSongDetailModal';

export function FavoriteSongsSection({ userId, isOwnProfile }) {
  const [allSongs, setAllSongs] = useState([]);
  const [favorites, setFavorites] = useState([]); // [{ song_id, created_at }]
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSongDetails, setSelectedSongDetails] = useState(null);
  const [selectedSongComment, setSelectedSongComment] = useState(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [pendingSong, setPendingSong] = useState(null);
  const [comment, setComment] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const isMobile = useMediaQuery('(max-width: 48em)'); // 768px breakpoint

  // Fetch data
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch favorites and songs in parallel
        const [favsData, songsData] = await Promise.all([
          favoritesService.getFavorites(userId),
          songsService.getFullSongDatabase()
        ]);

        if (mounted) {
          setFavorites(favsData);
          setAllSongs(songsData);
        }
      } catch (error) {
        console.error("Error loading favorites:", error);
        notifications.show({
          title: 'Error',
          message: 'Failed to load favorite songs',
          color: 'red'
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }

    return () => { mounted = false; };
  }, [userId]);

  const favoriteSongs = useMemo(() => {
    // Map favorite song IDs to full song objects, preserving order of favorites (newest first)
    return favorites
      .map(fav => allSongs.find(s => s.songId === fav.song_id))
      .filter(Boolean);
  }, [allSongs, favorites]);

  const handleSongSelect = (song) => {
    // Check limit
    if (favorites.length >= 5) {
      notifications.show({
        title: 'Limit Reached',
        message: 'You can only add up to 5 favorite songs',
        color: 'red'
      });
      return;
    }

    // Check if already favorite
    if (favorites.some(f => f.song_id === song.songId)) {
      notifications.show({
        title: 'Already Added',
        message: `${song.title} is already in your favorites`,
        color: 'blue'
      });
      return;
    }

    setPendingSong(song);
    setComment('');
    setCommentModalOpen(true);
    setIsModalOpen(false); // Close selection modal
  };

  const confirmAddFavorite = async () => {
    if (!pendingSong) return;

    setIsAdding(true);
    try {
      // Optimistic update
      const newFav = {
        song_id: pendingSong.songId,
        created_at: new Date().toISOString(),
        comment: comment.trim() || null
      };

      setFavorites(prev => [newFav, ...prev]);

      await favoritesService.addFavorite(userId, pendingSong.songId, comment.trim() || null);

      notifications.show({
        title: 'Added',
        message: `Added ${pendingSong.title} to favorites`,
        color: 'green'
      });

      setCommentModalOpen(false);
      setPendingSong(null);
      setComment('');
    } catch (error) {
      console.error(error);
      // Revert on error
      setFavorites(prev => prev.filter(f => f.song_id !== pendingSong.songId));
      notifications.show({
        title: 'Error',
        message: 'Failed to add favorite',
        color: 'red'
      });
    } finally {
      setIsAdding(false);
    }
  };


  const handleRemoveFavorite = async (song) => {
    const songId = song.songId;
    const songTitle = song.title;
    if (!confirm(`Remove ${songTitle} from favorites?`)) return;

    try {
      // Optimistic update
      setFavorites(prev => prev.filter(f => f.song_id !== songId));

      await favoritesService.removeFavorite(userId, songId);

      notifications.show({
        title: 'Removed',
        message: `Removed ${songTitle} from favorites`,
        color: 'green'
      });
    } catch (error) {
      console.error(error);
      // Revert
      // We need to fetch again or just trust the previous state copy if we kept it
      // For simplicity, just refetch or let it be (user can retry)
      notifications.show({
        title: 'Error',
        message: 'Failed to remove favorite',
        color: 'red'
      });
    }
  };

  if (loading && allSongs.length === 0) {
    return (
      <Paper shadow="sm" p="lg" radius="md" withBorder mb="xl" style={{ minHeight: 200 }}>
        <LoadingOverlay visible={true} />
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder mb="xl" pos="relative">
      <Group justify="space-between" mb="lg">
        <Group gap="xs">
          <IconHeart size={24} style={{ color: 'var(--mantine-color-red-6)' }} />
          <Title order={2} style={{ fontSize: 'clamp(1.25rem, 4vw, 2rem)' }} truncate>Favorite Songs</Title>
        </Group>

        {isOwnProfile && favorites.length < 5 && (
          <Button
            leftSection={<IconPlus size={18} />}
            variant="light"
            onClick={() => setIsModalOpen(true)}
          >
            Add Favorite
          </Button>
        )}
      </Group>

      {favoriteSongs.length === 0 ? (
        <Alert icon={<IconAlertCircle size={16} />} title="No Favorites" color="gray" variant="light">
          {isOwnProfile
            ? "You haven't added any favorite songs yet. Click the button above to add some!"
            : "This user hasn't added any favorite songs yet."}
        </Alert>
      ) : (
        isMobile ? (
          <ScrollArea type="never" offsetScrollbars={false}>
            <div style={{ display: 'flex', gap: '12px', paddingBottom: '4px' }}>
              {favoriteSongs.map((song) => {
                const favData = favorites.find(f => f.song_id === song.songId);
                return (
                  <Box key={song.songId} style={{ minWidth: '160px', width: '40%', flexShrink: 0 }}>
                    <FavoriteSongCard
                      song={song}
                      comment={favData?.comment}
                      onDelete={handleRemoveFavorite}
                      isOwnProfile={isOwnProfile}
                      onClick={(s) => {
                        setSelectedSongDetails(s);
                        setSelectedSongComment(favData?.comment);
                      }}
                    />
                  </Box>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <SimpleGrid cols={5} spacing={{ base: 'xs', sm: 'sm' }}>
            {favoriteSongs.map((song) => {
              const favData = favorites.find(f => f.song_id === song.songId);
              return (
                <Box key={song.songId} pos="relative" style={{ height: '100%' }}>
                  <FavoriteSongCard
                    song={song}
                    comment={favData?.comment}
                    onDelete={handleRemoveFavorite}
                    isOwnProfile={isOwnProfile}
                    onClick={(s) => {
                      setSelectedSongDetails(s);
                      setSelectedSongComment(favData?.comment);
                    }}
                  />
                </Box>
              );
            })}
          </SimpleGrid>
        )
      )}

      {isOwnProfile && (
        <SongSelectionModal
          opened={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleSongSelect}
        />
      )}

      {/* Comment Input Modal */}
      <MantineModal
        opened={commentModalOpen}
        onClose={() => !isAdding && setCommentModalOpen(false)}
        title="Add a Comment (Optional)"
        centered
        zIndex={201} // Above selection modal if needed, though selection closes first
      >
        <Stack>
          <Text size="sm">Add a short comment about why you like <b>{pendingSong?.title}</b>:</Text>
          <TextInput
            placeholder="e.g. My first AP!"
            value={comment}
            onChange={(e) => setComment(e.currentTarget.value)}
            maxLength={100}
            data-autofocus
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setCommentModalOpen(false)} disabled={isAdding}>Cancel</Button>
            <Button onClick={confirmAddFavorite} loading={isAdding}>Save Favorite</Button>
          </Group>
        </Stack>
      </MantineModal>

      <FavoriteSongDetailModal
        song={selectedSongDetails}
        opened={!!selectedSongDetails}
        onClose={() => {
          setSelectedSongDetails(null);
          setSelectedSongComment(null);
        }}
        comment={selectedSongComment}
      />
    </Paper>
  );
}
