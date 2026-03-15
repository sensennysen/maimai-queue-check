import { Paper, Group, Title, Box, Image, Text } from '@mantine/core';
import { IconStar } from '@tabler/icons-react';
import { DIFFICULTY_COLORS, BASE_JACKET_URL } from '../../../config/maimai-constants';

/**
 * MostPlayedSection component
 */
export function MostPlayedSection({ 
  profile, 
  privacy, 
  isOwner, 
  songMapByTitle, 
  scrollRef, 
  isDragging, 
  onSongClick 
}) {
  const songs = profile?.maimai_best_scores?.most_played;
  if (!songs || songs.length === 0) return null;

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder className="animate-fade-in delay-400">
      <Group gap="xs" mb="md">
        <IconStar size={24} style={{ color: 'var(--mantine-color-pink-5)' }} />
        <Title order={2}>Most Played Songs</Title>
      </Group>
      <div
        className="hide-scrollbar"
        ref={scrollRef}
        style={{
          overflowX: 'auto',
          display: 'flex',
          gap: '12px',
          paddingBottom: '12px',
          paddingTop: '8px',
          cursor: 'grab'
        }}
      >
        {songs.map((song, index) => {
          const matchedSong = songMapByTitle?.get(song.title);
          const canViewDetails = isOwner || privacy.show_most_played_details === true;

          return (
            <Paper
              key={index}
              p={0}
              radius="lg"
              className="hologram-card favorite-song-card"
              style={{
                minWidth: 160,
                width: 160,
                flexShrink: 0,
                height: 160,
                overflow: 'hidden',
                position: 'relative',
                cursor: canViewDetails ? 'pointer' : 'default',
                transition: 'transform 0.1s ease, box-shadow 0.2s ease',
                border: `2px solid ${DIFFICULTY_COLORS[song.difficulty] || 'transparent'}`,
                contentVisibility: 'auto',
                containIntrinsicSize: 'auto 160px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
              onClick={() => {
                if (!isDragging && canViewDetails) {
                  onSongClick(song, matchedSong);
                }
              }}
            >
              <Box style={{ position: 'relative', width: '100%', height: '100%' }}>
                {/* Difficulty Badge */}
                {song.difficulty && (
                  <Box
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      zIndex: 10,
                      background: DIFFICULTY_COLORS[song.difficulty] || 'gray',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  >
                    {song.difficulty}
                  </Box>
                )}

                <Image
                  src={matchedSong?.imageUrl || (song.imageName ? `${BASE_JACKET_URL}${song.imageName}` : null)}
                  alt={song.title}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  fallbackSrc="https://placehold.co/160x160?text=No+Image"
                />

                {/* Dark Overlay */}
                <Box
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)',
                    zIndex: 1
                  }}
                />

                {/* Content */}
                <Box
                  p="xs"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 5
                  }}
                >
                  <Text size="xs" c="white" fw={700} lineClamp={1} mb={2} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                    {song.title}
                  </Text>
                  <Group gap={4} align="baseline">
                    <Text size="lg" fw={900} c="white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)', lineHeight: 1 }}>
                      {song.play_count}
                    </Text>
                    <Text size="xs" fw={700} c="white" style={{ opacity: 0.8, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                      plays
                    </Text>
                  </Group>
                </Box>
              </Box>
            </Paper>
          );
        })}
      </div>
    </Paper>
  );
}
