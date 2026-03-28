import { useState, useMemo } from 'react';
import { Paper, Title, Button, Text, Group, Stack, Box, Alert } from '@mantine/core';
import { IconPlus, IconHeart, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useFavorites } from '../../features/profile/hooks/useFavorites';
import { TextInput, Modal as MantineModal } from '@mantine/core';
import FavoriteSongCard from './FavoriteSongCard';
import SongSelectionModal from '../../features/songs/components/SongSelectionModal';
import MaimaiSongDetailModal from './MaimaiSongDetailModal';
import { useMouseDragScroll } from '../../hooks/useMouseDragScroll';
import { useSongDatabaseContext } from '../../hooks/useSongDatabaseContext';

export function FavoriteSongsSection({ userId, isOwnProfile }) {
  const { loading: songsLoading, songMapById } = useSongDatabaseContext();
  const {
    favorites,
    loading,
    isAdding,
    addFavorite,
    removeFavorite,
    updateComment
  } = useFavorites(userId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSongDetails, setSelectedSongDetails] = useState(null);
  const [selectedSongComment, setSelectedSongComment] = useState(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [pendingSong, setPendingSong] = useState(null);
  const [comment, setComment] = useState('');

  const { scrollRef, isDragging } = useMouseDragScroll();

  const favoriteSongsMap = useMemo(() => {
    return favorites
      .map(fav => {
        const songData = songMapById?.get(fav.song_id);
        if (!songData) return null;
        return {
          song: { ...songData, favoriteId: fav.song_id },
          comment: fav.comment
        };
      })
      .filter(Boolean);
  }, [songMapById, favorites]);

  const handleSongSelect = (song) => {
    const songKey = song.cardId || song.songId;
    if (favorites.some(f => f.song_id === songKey)) {
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
    setIsModalOpen(false);
  };

  const confirmAddFavorite = async () => {
    if (!pendingSong) return;
    const success = await addFavorite(pendingSong, comment);
    if (success) {
      setCommentModalOpen(false);
      setPendingSong(null);
      setComment('');
    }
  };

  const handleUpdateComment = async (songId, newComment) => {
    const success = await updateComment(songId, newComment);
    if (success) {
      if ((selectedSongDetails?.cardId || selectedSongDetails?.songId) === songId) {
        setSelectedSongComment(newComment);
      }
    }
  };

  const handleRemoveFavorite = async (song) => {
    if (!confirm(`Remove ${song.title} from favorites?`)) return;
    await removeFavorite(song);
  };

  const isEverythingLoading = loading || songsLoading;

  if (isEverythingLoading && favoriteSongsMap.length === 0) return null;

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder pos="relative">
      <Group justify="space-between" mb="lg">
        <Group gap="xs">
          <IconHeart size={24} style={{ color: 'var(--theme-primary)' }} />
          <Title order={2} style={{ fontSize: 'clamp(1.25rem, 4vw, 2rem)' }} truncate>Favorite Songs</Title>
        </Group>

        {isOwnProfile && (
          <Button
            leftSection={<IconPlus size={18} />}
            variant="light"
            color="primary"
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
          {favoriteSongsMap.map(({ song, comment: favComment }, index) => (
            <Box key={`${song.songId}-${index}`} style={{ minWidth: '160px', width: '180px', flexShrink: 0 }}>
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
        onCommentSave={(newComment) => handleUpdateComment(selectedSongDetails.favoriteId || selectedSongDetails.cardId || selectedSongDetails.songId, newComment)}
      />
    </Paper>
  );
}
