import { SimpleGrid, Text, Center, Loader, Pagination, Stack, Box } from '@mantine/core';
import SongCard from './SongCard';
import SongDetailModal from './SongDetailModal';
import { useState, useMemo } from 'react';

const ITEMS_PER_PAGE = 25;

function SongList({ songs, loading }) {
  const [activePage, setPage] = useState(1);
  const [selectedSong, setSelectedSong] = useState(null);

  const paginatedSongs = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE;
    return songs.slice(start, start + ITEMS_PER_PAGE);
  }, [songs, activePage]);

  const totalPages = Math.ceil(songs.length / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <Center p="xl" h={400}>
        <Stack align="center" gap="md">
          <Loader size="xl" variant="bars" color="primary" />
          <Text c="dimmed" size="sm" className="animate-pulse">Loading Database...</Text>
        </Stack>
      </Center>
    );
  }

  if (songs.length === 0) {
    return (
      <Center p="xl" h={300} className="hologram-card" style={{ borderRadius: '16px' }}>
        <Stack align="center">
          <Text size="xl">🎵</Text>
          <Text c="dimmed">No songs found matching your criteria.</Text>
          <Text size="xs" c="dimmed">Try adjusting your filters or search query.</Text>
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
                onClick={() => setSelectedSong(song)}
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
    </>
  );
}

export default SongList;
