import { Paper, Flex, Box, Image, Grid, Stack, Title, Text, Badge, Button, SimpleGrid } from '@mantine/core';
import IconPlaylistAdd from '@tabler/icons-react/dist/esm/icons/IconPlaylistAdd.mjs';
import { CATEGORY_TRANSLATION, VERSION_MAPPING } from '../../../config/maimai-constants';

/**
 * SongHeader component to display basic song information
 * @param {object} song - The song object
 * @param {string} activeCardType - The current chart type (dx, standard, etc)
 * @param {boolean} isMobileOrTablet - Media query state
 * @param {Function} onAddToPlaylist - Handler for opening the playlist modal
 */
export function SongHeader({ song, activeCardType, isMobileOrTablet, onAddToPlaylist }) {
  if (!song) return null;

  const infoItems = [
    {
      label: 'Category',
      value: (
        <Badge variant="light" color="blue" size="md" radius="sm" style={{ whiteSpace: 'normal', height: 'auto', padding: '4px 8px' }}>
          {CATEGORY_TRANSLATION[song.category] || song.category}
        </Badge>
      ),
    },
    {
      label: 'Version',
      value: <Text size="sm" fw={600}>{VERSION_MAPPING[song.version] || song.version || '-'}</Text>,
    },
    {
      label: 'Type',
      value: activeCardType === 'dx' || activeCardType === 'dx_plus' ? (
        <img src={new URL('../../../assets/music_dx.png', import.meta.url).href} alt="DX" style={{ height: 24, objectFit: 'contain' }} />
      ) : (
        <img src={new URL('../../../assets/music_standard.png', import.meta.url).href} alt="Standard" style={{ height: 24, objectFit: 'contain' }} />
      ),
    },
    song.bpm && {
      label: 'BPM',
      value: <Text size="sm" fw={600}>{song.bpm}</Text>,
    },
    song.releaseDate && {
      label: 'Released',
      value: <Text size="sm" fw={600}>{isMobileOrTablet ? song.releaseDate.split('-')[0] : song.releaseDate}</Text>,
    },
  ].filter(Boolean);

  return (
    <Paper p={{ base: 'md', md: 'lg' }} radius="md" className="song-discussion-surface">
      <Flex direction={{ base: 'column', md: 'row' }} gap={{ base: 'md', md: 'xl' }} align={{ base: 'stretch', md: 'center' }}>
        {/* Image */}
        <Box style={{ flexShrink: 0, width: isMobileOrTablet ? 132 : 180, marginInline: isMobileOrTablet ? 'auto' : 0 }}>
          <Image
            src={import.meta.env.VITE_SONG_JACKETS_URL + song.imageName}
            alt={song.title}
            radius="md"
            w="100%"
            fallbackSrc="https://placehold.co/240x240?text=No+Image"
            style={{ border: '1px solid var(--theme-border)', aspectRatio: '1/1', objectFit: 'cover' }}
          />
        </Box>

        {/* Content for the rest */}
        <Box flex={1} w="100%">
          <Grid gutter={{ base: 'md', md: 'xl' }} align="flex-start">
            {/* Box 1: Title and Artist */}
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Stack gap="sm" align={isMobileOrTablet ? 'center' : 'flex-start'} ta={isMobileOrTablet ? 'center' : 'left'}>
                <Title order={2} className="mobile-song-title" style={{ fontFamily: 'var(--font-heading)', wordBreak: 'break-word', marginTop: '4px' }}>
                  {song.title}
                </Title>
                <Text size={isMobileOrTablet ? 'sm' : 'md'} c="dimmed" mt={-4}>
                  Artist: <Text span fw={600} c="inherit">{song.artist}</Text>
                </Text>
                <Button
                  variant="default"
                  leftSection={<IconPlaylistAdd size={16} />}
                  onClick={onAddToPlaylist}
                  size={isMobileOrTablet ? 'sm' : 'md'}
                  fullWidth={isMobileOrTablet}
                >
                  Add to Playlist
                </Button>
              </Stack>
            </Grid.Col>

            {/* Chart metadata */}
            <Grid.Col span={{ base: 12, md: 7 }}>
              <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm" verticalSpacing="sm">
                {infoItems.map((item) => (
                  <Box
                    key={item.label}
                    p="sm"
                    style={{
                      border: '1px solid var(--mantine-color-default-border)',
                      borderRadius: 'var(--mantine-radius-md)',
                      background: 'var(--theme-background)',
                      minHeight: 78,
                    }}
                  >
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={6} style={{ letterSpacing: '0.04em' }}>
                      {item.label}
                    </Text>
                    {item.value}
                  </Box>
                ))}
              </SimpleGrid>
            </Grid.Col>
          </Grid>
        </Box>
      </Flex>
    </Paper>
  );
}
