import { SimpleGrid, Text, Center, Loader, Pagination, Stack, Box, Modal, Button, Group } from '@mantine/core';
import { DIFFICULTY_COLORS, normalizeDifficulty } from '../../../config/maimai-constants';
import SongCard from './SongCard';
import SongDetailModal from './SongDetailModal';
import { useState, useMemo } from 'react';

const ITEMS_PER_PAGE = 25;

function SongList({ songs, loading, error, onSongSelect, multiple, selectedSongs = [], onSelectionChange }) {
  const [activePage, setPage] = useState(1);
  const [selectedSong, setSelectedSong] = useState(null);
  const [songToSelectLevel, setSongToSelectLevel] = useState(null);

  const toggleSongLevel = (song, level) => {
    const getSongKey = (s) => (s.cardId || s.songId) + '__' + (s.level || '');
    const targetKey = (song.cardId || song.songId) + '__' + level;

    const isSelected = selectedSongs.some(s => getSongKey(s) === targetKey);
    if (isSelected) {
      onSelectionChange(selectedSongs.filter(s => getSongKey(s) !== targetKey));
    } else {
      onSelectionChange([...selectedSongs, { ...song, level }]);
    }
  };

  const paginatedSongs = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE;
    return songs.slice(start, start + ITEMS_PER_PAGE);
  }, [songs, activePage]);

  const totalPages = Math.ceil(songs.length / ITEMS_PER_PAGE);

  if (error) {
    return (
      <Center p="xl" h={300} className="hologram-card" style={{ borderRadius: '16px', borderColor: 'var(--mantine-color-red-6)' }}>
        <Stack align="center">
          <Text size="xl">❌</Text>
          <Text c="red" fw={500}>Failed to load song database.</Text>
          <Text size="sm" c="red">Please check your connection or try again later.</Text>
        </Stack>
      </Center>
    );
  }

  if (loading) {
    return (
      <Center p="xl" h={400}>
        <Stack align="center" gap="md">
          <Loader size="xl" variant="bars" color="primary" />
          <Text c="secondary" size="sm" fw={500} className="animate-pulse">Loading Database...</Text>
        </Stack>
      </Center>
    );
  }

  if (songs.length === 0) {
    return (
      <Center p="xl" h={300} className="hologram-card" style={{ borderRadius: '16px' }}>
        <Stack align="center">
          <Text size="xl">🎵</Text>
          <Text c="secondary" fw={500}>No songs found matching your criteria.</Text>
          <Text size="sm" c="secondary">Try adjusting your filters or search query.</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <>
      <Stack align="center" gap="xl" w="100%">
        <SimpleGrid
          cols={{ base: 2, xs: 2, sm: 3, md: 3, lg: 4, xl: 5 }}
          spacing="md"
          verticalSpacing="lg"
          w="100%"
        >
          {paginatedSongs.map((song, index) => (
            <Box
              key={song.cardId || song.songId}
              className="animate-fade-in"
              style={{
                animationDelay: `${index * 50}ms`, // Stagger effect
                height: '100%'
              }}
            >
              <SongCard
                song={song}
                onClick={() => {
                  if (multiple) {
                    setSongToSelectLevel(song);
                  } else if (onSongSelect) {
                    onSongSelect(song);
                  } else {
                    setSelectedSong(song);
                  }
                }}
                style={(() => {
                  const getSongKey = (s) => s.cardId || s.songId;
                  const isSelected = selectedSongs.some(s => getSongKey(s) === getSongKey(song));

                  if (multiple && isSelected) {
                    return {
                      outline: '3px solid var(--mantine-color-primary-6)',
                      outlineOffset: '-3px',
                      borderRadius: '12px',
                      transition: 'outline 0.1s ease'
                    };
                  }

                  return {};
                })()}
              />
            </Box>
          ))}
        </SimpleGrid>

        {totalPages > 1 && (
          <Pagination
            total={totalPages}
            value={activePage}
            onChange={(page) => {
              setPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            size="md"
            radius="xl"
            withEdges
            color="primary"
            siblings={1}
          />
        )}
      </Stack>

      <SongDetailModal
        song={selectedSong}
        opened={!!selectedSong}
        onClose={() => setSelectedSong(null)}
      />

      <Modal
        opened={!!songToSelectLevel}
        onClose={() => setSongToSelectLevel(null)}
        title="Select Chart Level"
        centered
        zIndex={250}
        transitionProps={{ transition: 'fade', duration: 0 }}
        classNames={{ content: 'profile-modal-pop' }}
      >
        {songToSelectLevel && (
          <Stack align="center">
            <Text fw={700} ta="center">{songToSelectLevel.title}</Text>
            <Text size="sm" c="dimmed" ta="center">Pick the levels you want to add. Deselect to remove.</Text>
            <Group justify="center" gap="sm">
              {songToSelectLevel.sheets?.map(sheet => {
                const normalizedDiff = normalizeDifficulty(sheet.difficulty);
                const diffColor = DIFFICULTY_COLORS[normalizedDiff] || 'gray';
                const getSongKey = (s) => (s.cardId || s.songId) + '__' + (s.level || '');
                const targetKey = (songToSelectLevel.cardId || songToSelectLevel.songId) + '__' + normalizedDiff;
                const isSelected = selectedSongs.some(s => getSongKey(s) === targetKey);

                return (
                  <Button
                    key={normalizedDiff}
                    variant={isSelected ? 'filled' : 'outline'}
                    color={diffColor}
                    onClick={() => toggleSongLevel(songToSelectLevel, normalizedDiff)}
                  >
                    {normalizedDiff} {sheet.level}
                  </Button>
                );
              })}
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}

export default SongList;
