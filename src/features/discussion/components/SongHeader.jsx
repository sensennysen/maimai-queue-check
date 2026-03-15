import { Paper, Flex, Box, Image, Grid, Stack, Title, Text, Badge, Group } from '@mantine/core';
import { CATEGORY_TRANSLATION, VERSION_MAPPING } from '../../../config/maimai-constants';

/**
 * SongHeader component to display basic song information
 * @param {object} song - The song object
 * @param {string} activeCardType - The current chart type (dx, standard, etc)
 * @param {boolean} isMobileOrTablet - Media query state
 */
export function SongHeader({ song, activeCardType, isMobileOrTablet }) {
  if (!song) return null;

  return (
    <Paper p={{ base: 'md', md: 'lg' }} radius="md" withBorder>
      <Flex direction={{ base: 'column', md: 'row' }} gap={{ base: 'md', md: 'xl' }} align="center">
        {/* Image */}
        <Box style={{ flexShrink: 0, width: isMobileOrTablet ? 160 : 180 }}>
          <Image
            src={import.meta.env.VITE_SONG_JACKETS_URL + song.imageName}
            alt={song.title}
            radius="md"
            w="100%"
            fallbackSrc="https://placehold.co/240x240?text=No+Image"
            style={{ boxShadow: 'var(--mantine-shadow-md)', aspectRatio: '1/1', objectFit: 'cover' }}
          />
        </Box>

        {/* Content for the rest */}
        <Box flex={1} w="100%">
          <Grid gutter={{ base: 'md', md: 'xl' }} align="center">
            {/* Box 1: Title and Artist */}
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Stack gap="sm" align={isMobileOrTablet ? 'center' : 'flex-start'} ta={isMobileOrTablet ? 'center' : 'left'}>
                <Title order={2} className="mobile-song-title" style={{ fontFamily: 'var(--font-heading)', wordBreak: 'break-word', marginTop: '4px' }}>
                  {song.title}
                </Title>
                <Text size={isMobileOrTablet ? "sm" : "md"} mt={-8}>Artist: <Text span fw={500}>{song.artist}</Text></Text>
              </Stack>
            </Grid.Col>

            {/* Box 2 & 3: Info container on mobile/tablet */}
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Box>
                <Grid gutter={{ base: 'xs', sm: 'md', md: 'xl' }} align="center">
                  {/* Category and Version */}
                  <Grid.Col span={{ base: 6, lg: 5 }}>
                    <Stack gap="md" align={isMobileOrTablet ? 'center' : 'flex-start'} ta={isMobileOrTablet ? 'center' : 'left'} h="100%" justify="center">
                      <Box>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>CATEGORY</Text>
                        <Badge variant="light" color="blue" size="md" radius="sm" style={{ whiteSpace: 'normal', height: 'auto', padding: '4px 8px' }}>
                          {CATEGORY_TRANSLATION[song.category] || song.category}
                        </Badge>
                      </Box>

                      <Box>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>VERSION</Text>
                        <Text size="md" fw={500}>{VERSION_MAPPING[song.version] || song.version || '-'}</Text>
                      </Box>
                    </Stack>
                  </Grid.Col>

                  {/* Type, BPM, Released */}
                  <Grid.Col span={{ base: 6, lg: 7 }}>
                    <Stack gap="md" align={isMobileOrTablet ? 'center' : 'flex-start'} ta={isMobileOrTablet ? 'center' : 'left'} h="100%" justify="center">
                      <Box>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>TYPE</Text>
                        {activeCardType === 'dx' || activeCardType === 'dx_plus' ? (
                          <img src={new URL('../../../assets/music_dx.png', import.meta.url).href} alt="DX" style={{ height: 26, objectFit: 'contain' }} />
                        ) : (
                          <img src={new URL('../../../assets/music_standard.png', import.meta.url).href} alt="Standard" style={{ height: 26, objectFit: 'contain' }} />
                        )}
                      </Box>

                      <Group gap="xl" align="flex-start" justify={isMobileOrTablet ? 'center' : 'flex-start'} wrap="nowrap">
                        {song.bpm && (
                          <Box mt={isMobileOrTablet ? 0 : 2}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>BPM</Text>
                            <Text size="base" fw={500}>{song.bpm}</Text>
                          </Box>
                        )}

                        {song.releaseDate && (
                          <Box mt={isMobileOrTablet ? 0 : 2} style={(song.bpm && !isMobileOrTablet) ? { borderLeft: '1px solid var(--mantine-color-default-border)', paddingLeft: 'var(--mantine-spacing-xl)' } : {}}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>RELEASED</Text>
                            <Text size="base" fw={500}>{isMobileOrTablet ? song.releaseDate.split('-')[0] : song.releaseDate}</Text>
                          </Box>
                        )}
                      </Group>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Box>
            </Grid.Col>
          </Grid>
        </Box>
      </Flex>
    </Paper>
  );
}
