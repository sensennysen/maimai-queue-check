import { Paper, Text, Group, Badge, Image, Stack, Tooltip, Box } from '@mantine/core';
import { useMemo } from 'react';
import dxImage from '../../../assets/music_dx.png';
import standardImage from '../../../assets/music_standard.png';
import { DIFFICULTY_COLORS, VERSION_MAPPING, CATEGORY_TRANSLATION } from '../../../config/maimai-constants';

const DIFFICULTY_ORDER = ['Basic', 'Advanced', 'Expert', 'Master', 'Re:Master'];

function SongCard({ song, onClick }) {
  // Sort sheets by difficulty
  // Sort sheets by difficulty
  const sortedSheets = useMemo(() => {
    if (!song.sheets) return [];
    return [...song.sheets].sort((a, b) => {
      const normalizeDiffForSort = (d) => {
        const map = { 'basic': 'Basic', 'advanced': 'Advanced', 'expert': 'Expert', 'master': 'Master', 'remaster': 'Re:Master' };
        return map[d.toLowerCase()] || d;
      };
      const diffA = DIFFICULTY_ORDER.indexOf(normalizeDiffForSort(a.difficulty));
      const diffB = DIFFICULTY_ORDER.indexOf(normalizeDiffForSort(b.difficulty));
      return diffA - diffB;
    });
  }, [song.sheets]);

  const typeImage = song.cardType === 'dx' ? dxImage : standardImage;

  return (
    <Paper
      p={0}
      radius="lg"
      className="hologram-card song-card"
      style={{
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        transition: 'transform 0.1s ease, box-shadow 0.2s ease',
      }}
      styles={{
        root: {
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0, 0, 0, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div
        onClick={onClick}
        style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        {/* Cover Image Area */}
        <Box
          style={{
            position: 'relative',
            width: '100%',
            paddingTop: '100%', // 1:1 Aspect Ratio
            overflow: 'hidden'
          }}
        >
          <Image
            src={song.imageUrl}
            alt={song.title}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            fallbackSrc="https://placehold.co/300x300?text=No+Image"
          />
          {/* Gradient Overlay */}
          <Box
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
              pointerEvents: 'none'
            }}
          />

          {/* Category Badge on Image */}
          <Badge
            size="sm"
            variant="filled"
            color="blue"
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              fontFamily: 'var(--font-body)'
            }}
          >
            {CATEGORY_TRANSLATION[song.category] || song.category}
          </Badge>

          {/* DX/Standard Type Badge (Bottom Right) */}
          {song.cardType && (
            <img
              src={typeImage}
              alt={song.cardType === 'dx' ? 'DX' : 'Standard'}
              style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                height: 20,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
              }}
            />
          )}

          {/* Version badge (Bottom Left) */}
          <Badge
            size="sm"
            variant="filled"
            color="dark"
            style={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              opacity: 0.8,
              fontFamily: 'var(--font-body)'
            }}
          >
            {VERSION_MAPPING[song.version] || song.version}
          </Badge>
        </Box>

        {/* Content Area */}
        <Stack p="md" gap="xs" style={{ flex: 1 }}>
          <div style={{ flex: 1 }}>
            <Text fw={700} lineClamp={1} title={song.title} size="lg" style={{ lineHeight: 1.2, fontFamily: 'var(--font-heading)' }}>
              {song.title}
            </Text>
            <Text size="sm" c="dimmed" lineClamp={1} title={song.artist} mt={4} style={{ fontFamily: 'var(--font-body)' }}>
              {song.artist}
            </Text>
          </div>

          {/* Difficulty Bars */}
          <Group gap={4} wrap="wrap" mt="sm">
            {sortedSheets.map((sheet) => {
              // Normalize difficulty string to match keys in DIFFICULTY_COLORS
              const diffMap = {
                'basic': 'Basic',
                'advanced': 'Advanced',
                'expert': 'Expert',
                'master': 'Master',
                'remaster': 'Re:Master'
              };
              const normalizedDiff = diffMap[sheet.difficulty.toLowerCase()] || sheet.difficulty;
              const diffColor = DIFFICULTY_COLORS[normalizedDiff] || 'gray';

              return (
                <Tooltip
                  key={`${sheet.type}-${sheet.difficulty}`}
                  label={`${sheet.difficulty}: ${sheet.level}${sheet.internalLevel ? ` (${sheet.internalLevel})` : ''}`}
                  withArrow
                  transitionProps={{ duration: 200 }}
                >
                  <Badge
                    size="sm"
                    variant="filled"
                    style={{
                      flex: 1,
                      minWidth: 'auto',
                      padding: '0 6px',
                      cursor: 'default',
                      fontSize: '11px',
                      fontFamily: 'var(--font-body)',
                      backgroundColor: diffColor,
                      color: 'white'
                    }}
                  >
                    {sheet.level}
                  </Badge>
                </Tooltip>
              );
            })}
          </Group>
        </Stack>
      </div>
    </Paper>
  );
}

export default SongCard;
