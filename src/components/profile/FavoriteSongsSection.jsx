import { useState, useEffect, useMemo } from 'react';
import { Paper, Title, Button, SimpleGrid, Text, Group, LoadingOverlay, ActionIcon, Stack, Box, Alert } from '@mantine/core';
import { IconPlus, IconX, IconHeart, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { favoritesService } from '../../services/supabase';
import { TextInput, Modal as MantineModal } from '@mantine/core';
import FavoriteSongCard from './FavoriteSongCard';
import SongSelectionModal from '../../features/songs/components/SongSelectionModal';
import MaimaiSongDetailModal from './MaimaiSongDetailModal';
import { useMouseDragScroll } from '../../hooks/useMouseDragScroll';
import { useSongDatabaseContext } from '../../hooks/useSongDatabaseContext';

export function FavoriteSongsSection({ userId, isOwnProfile }) {
  const { loading: songsLoading, songMapById } = useSongDatabaseContext();
  const [favorites, setFavorites] = useState([]); // [{ song_id, created_at }]
  const [loading, setLoading] = useState(true); // Loading for favorites data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSongDetails, setSelectedSongDetails] = useState(null);
  const [selectedSongComment, setSelectedSongComment] = useState(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [pendingSong, setPendingSong] = useState(null);
  const [comment, setComment] = useState('');
  const [isAdding, setIsAdding] = useState(false);


  const { scrollRef, isDragging } = useMouseDragScroll();
  // const isMobile = useMediaQuery('(max-width: 48em)'); // Removed per requirement

  // Fetch favorites data
  useEffect(() => {
    let mounted = true;
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const favsData = await favoritesService.getFavorites(userId);
        if (mounted) {
          setFavorites(favsData);
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
      fetchFavorites();
    }

    return () => { mounted = false; };
  }, [userId]);

  const favoriteSongsMap = useMemo(() => {
    // Map favorite song IDs to full song objects + the favorite comment metadata preserving order of favorites (newest first)
    return favorites
      .map(fav => {
        const songData = songMapById?.get(fav.song_id);
        if (!songData) return null;
        return {
          song: songData,
          comment: fav.comment
        };
      })
      .filter(Boolean);
  }, [songMapById, favorites]);

  const handleSongSelect = (song) => {
    // Limit removed per requirement
    // if (favorites.length >= 5) { ... }

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


  const handleUpdateComment = async (songId, newComment) => {
    try {
      // Optimistic update
      setFavorites(prev => prev.map(f =>
        f.song_id === songId ? { ...f, comment: newComment } : f
      ));

      await favoritesService.updateFavoriteComment(userId, songId, newComment);

      notifications.show({
        title: 'Updated',
        message: 'Comment updated successfully',
        color: 'green'
      });

      // Update selected comment if modal is open
      if (selectedSongDetails?.songId === songId) {
        setSelectedSongComment(newComment);
      }
    } catch (error) {
      console.error(error);
      notifications.show({
        title: 'Error',
        message: 'Failed to update comment',
        color: 'red'
      });
      // We should ideally revert but it's complex without original state. 
      // User can just refresh.
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

  const isEverythingLoading = loading || songsLoading;

  if (isEverythingLoading && favoriteSongsMap.length === 0) {
    return (
      <Paper shadow="sm" p="lg" radius="md" withBorder mb="xl" style={{ minHeight: 200 }}>
        <LoadingOverlay visible={true} />
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder pos="relative">
      <Group justify="space-between" mb="lg">
        <Group gap="xs">
          <IconHeart size={24} style={{ color: 'var(--mantine-color-red-6)' }} />
          <Title order={2} style={{ fontSize: 'clamp(1.25rem, 4vw, 2rem)' }} truncate>Favorite Songs</Title>
        </Group>

        {isOwnProfile && (
          <Button
            leftSection={<IconPlus size={18} />}
            variant="light"
            onClick={() => setIsModalOpen(true)}
          >
            Add Favorite
          </Button>
        )}
      </Group>

      {favoriteSongsMap.length === 0 ? (
        <Alert icon={<IconAlertCircle size={16} />} title="No Favorites" color="gray" variant="light">
          {isOwnProfile
            ? "You haven't added any favorite songs yet. Click the button above to add some!"
            : "This user hasn't added any favorite songs yet."}
        </Alert>
      ) : (
        <div
          ref={scrollRef}
          className="hide-scrollbar"
          style={{
            display: 'flex',
            gap: '12px',
            paddingBottom: '12px',
            paddingTop: '8px',
            overflowX: 'auto',
            scrollBehavior: 'smooth'
          }}
        >
          {favoriteSongsMap.map(({ song, comment: favComment }) => (
            <Box key={song.songId} style={{ minWidth: '160px', width: '180px', flexShrink: 0 }}>
              <FavoriteSongCard
                song={song}
                comment={favComment}
                onDelete={handleRemoveFavorite}
                isOwnProfile={isOwnProfile}
                onClick={(s) => {
                  if (!isDragging) {
                    setSelectedSongDetails(s);
                    setSelectedSongComment(favComment);
                  }
                }}
              />
            </Box>
          ))}
        </div>
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
        zIndex={201}
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

      <MaimaiSongDetailModal
        song={selectedSongDetails}
        opened={!!selectedSongDetails}
        onClose={() => {
          setSelectedSongDetails(null);
          setSelectedSongComment(null);
        }}
        comment={selectedSongComment}
        title="Favorite Song Details"
        isOwnProfile={isOwnProfile}
        onCommentSave={(newComment) => handleUpdateComment(selectedSongDetails.songId, newComment)}
      />
    </Paper>
  );
}
