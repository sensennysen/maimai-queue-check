import { useState, useMemo } from 'react';
import { Button, Text, Box, Paper, Title, TextInput, Modal as MantineModal, Stack, Group, Alert, ActionIcon } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import IconPlus from '@tabler/icons-react/dist/esm/icons/IconPlus.mjs';
import IconHeart from '@tabler/icons-react/dist/esm/icons/IconHeart.mjs';
import IconMusicOff from '@tabler/icons-react/dist/esm/icons/IconMusicOff.mjs';
import { notifications } from '@mantine/notifications';
import { useFavorites } from '../../features/profile/hooks/useFavorites';
import FavoriteSongCard from './FavoriteSongCard';
import SongSelectionModal from '../../features/songs/components/SongSelectionModal';
import MaimaiSongDetailModal from './MaimaiSongDetailModal';
import { useMouseDragScroll } from '../../hooks/useMouseDragScroll';
import { useSongDatabaseContext } from '../../hooks/useSongDatabaseContext';

export function FavoriteSongsSection({ userId, isOwnProfile }) {
  const isMobile = useMediaQuery('(max-width: 500px)');
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

  const count = favoriteSongsMap.length;

  return (
    <Paper p="lg" radius="md" className="profile-surface animate-fade-in delay-200" pos="relative">
      <Group justify="space-between" mb="md" align="center">
        <Group gap="xs" align="center">
          <IconHeart size={22} style={{ color: 'var(--theme-primary)', fill: 'var(--theme-primary)' }} />
          <Title order={2}>Favorite Songs</Title>
          {count > 0 && (
            <Text size="sm" c="dimmed" fw={600} ml={4} mt={2}>
              ({count})
            </Text>
          )}
        </Group>

        {isOwnProfile && (
          isMobile ? (
            <ActionIcon
              variant="light"
              color="primary"
              size="lg"
              radius="md"
              onClick={() => setIsModalOpen(true)}
            >
              <IconPlus size={20} />
            </ActionIcon>
          ) : (
            <Button
              leftSection={<IconPlus size={16} />}
              variant="default"
              color="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
            >
              Add
            </Button>
          )
        )}
      </Group>

      {/* Content */}
      {favoriteSongsMap.length === 0 ? (
        <Alert icon={<IconMusicOff size={16} />} title="No favorites" color="gray" variant="light">
          {isOwnProfile
            ? "You haven't pinned any favorite tracks yet. Add the charts you love playing the most!"
            : "This player hasn't pinned any favorite tracks yet."}
        </Alert>
      ) : (
        <div
          ref={scrollRef}
          className="hide-scrollbar"
          style={{
            display: 'flex',
            gap: '10px',
            paddingBottom: '6px',
            paddingTop: '4px',
            overflowX: 'auto',
            scrollBehavior: 'smooth'
          }}
        >
          {favoriteSongsMap.map(({ song, comment: favComment }, index) => (
            <Box
              key={`${song.songId}-${index}`}
              style={{ minWidth: '148px', width: '168px', flexShrink: 0 }}
            >
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

      {/* Modals */}
      {isOwnProfile && (
        <SongSelectionModal
          opened={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleSongSelect}
        />
      )}

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
