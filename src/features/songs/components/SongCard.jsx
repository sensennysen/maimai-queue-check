import { Paper, Text, Group, Badge, Image, Stack, Tooltip, Box } from '@mantine/core';
import React, { useMemo } from 'react';
import dxImage from '../../../assets/music_dx.png';
import standardImage from '../../../assets/music_standard.png';
import { DIFFICULTY_COLORS, VERSION_MAPPING, CATEGORY_TRANSLATION, normalizeDifficulty } from '../../../config/maimai-constants';

const DIFFICULTY_ORDER = ['Basic', 'Advanced', 'Expert', 'Master', 'Re:Master'];

/**
 * Component for displaying a single song card with its metadata and difficulty bars.
 * @param {Object} props - Component props.
 * @param {Object} props.song - The song data object.
 * @param {Function} props.onClick - Handler for card click events.
 * @param {boolean} [props.hideDifficulties=false] - Whether to hide difficulty level badges.
 * @param {boolean} [props.hideTags=false] - Whether to hide version and category tags.
 * @param {Object} [props.style] - Optional CSS styles for the container.
 * @returns {JSX.Element} The rendered song card.
 */
export const SongCard = React.memo(function SongCard({ song, onClick, hideDifficulties = false, hideTags = false, style }) {
  // Sort sheets by difficulty
  const sortedSheets = useMemo(() => {
    if (hideDifficulties || !song.sheets) return [];
    return [...song.sheets].sort((a, b) => {
      const diffA = DIFFICULTY_ORDER.indexOf(normalizeDifficulty(a.difficulty));
      const diffB = DIFFICULTY_ORDER.indexOf(normalizeDifficulty(b.difficulty));
      return diffA - diffB;
    });
  }, [song.sheets, hideDifficulties]);

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
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 360px', /* Approximate height of card */
        ...style,
      }}
      styles={{
        root: {
          transition: 'transform 0.1s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px -8px rgba(0, 0, 0, 0.2)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
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
            loading="lazy"
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
          {!hideTags && (
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
          )}

          {/* DX/Standard Type Badge (Bottom Right) */}
          {song.cardType && (
            <img
              src={typeImage}
              alt={song.cardType === 'dx' ? 'DX' : 'Standard'}
              loading="lazy"
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
          {!hideTags && (
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
          )}
        </Box>

        {/* Content Area */}
        <Stack p="md" gap="xs" style={{ flex: 1 }}>
          <div style={{ flex: 1 }}>
            <Text fw={700} lineClamp={1} title={song.title} size="lg" style={{ lineHeight: 1.2, fontFamily: 'var(--font-heading)' }}>
              {song.title}
            </Text>
            <Text size="sm" c="secondary" lineClamp={1} title={song.artist} mt={4} style={{ fontFamily: 'var(--font-body)' }}>
              {song.artist}
            </Text>
          </div>

          {/* Difficulty Bars */}
          <Group gap={4} wrap="wrap" mt="sm">
            {sortedSheets.map((sheet) => {
              // Normalize difficulty string to match keys in DIFFICULTY_COLORS
              const normalizedDiff = normalizeDifficulty(sheet.difficulty);
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
});

export default SongCard;
