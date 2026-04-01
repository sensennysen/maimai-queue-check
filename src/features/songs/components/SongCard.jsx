import { Paper, Text, Group, Badge, Image, Stack, Tooltip, Box } from '@mantine/core';
import React, { useMemo } from 'react';
import dxImage from '../../../assets/music_dx.png';
import standardImage from '../../../assets/music_standard.png';
import { DIFFICULTY_COLORS, VERSION_MAPPING, CATEGORY_TRANSLATION, normalizeDifficulty, BASE_JACKET_URL } from '../../../config/maimai-constants';

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
  const topRowSheets = sortedSheets.slice(0, 2);
  const bottomRowSheets = sortedSheets.slice(2);

  const getDifficultyBadgeWidth = (count) => (
    count > 0 ? `calc((100% - ${(count - 1) * 4}px) / ${count})` : 'auto'
  );

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
            src={song.imageUrl || (song.imageName ? `${BASE_JACKET_URL}${song.imageName}` : null)}
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

          {/* Bottom Bar for Version and Type */}
          <Group
            justify="space-between"
            wrap="nowrap"
            gap="xs"
            px={8}
            pb={8}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              pointerEvents: 'none',
              zIndex: 5
            }}
          >
            {/* Version badge */}
            {!hideTags && (
              <Badge
                size="sm"
                variant="filled"
                color="dark"
                style={{
                  opacity: 0.9,
                  fontFamily: 'var(--font-body)',
                  pointerEvents: 'auto',
                  flexShrink: 1,
                  maxWidth: '70%',
                  fontSize: '12px'
                }}
              >
                {VERSION_MAPPING[song.version] || song.version}
              </Badge>
            )}

            {/* DX/Standard Type Badge */}
            {song.cardType && (
              <img
                src={typeImage}
                alt={song.cardType === 'dx' ? 'DX' : 'Standard'}
                loading="lazy"
                style={{
                  height: 14,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                  pointerEvents: 'auto',
                  flexShrink: 0
                }}
              />
            )}
          </Group>
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
          <Stack gap={4} mt="sm">
            {[topRowSheets, bottomRowSheets].filter(row => row.length > 0).map((rowSheets, rowIndex) => {
              const difficultyBadgeWidth = getDifficultyBadgeWidth(rowSheets.length);

              return (
                <Group key={`difficulty-row-${rowIndex}`} gap={4} wrap="nowrap">
                  {rowSheets.map((sheet) => {
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
                          styles={{
                            label: {
                              display: 'block',
                              overflow: 'visible',
                              textOverflow: 'clip',
                              whiteSpace: 'nowrap',
                              width: '100%',
                              textAlign: 'center'
                            }
                          }}
                          style={{
                            flex: `0 0 ${difficultyBadgeWidth}`,
                            width: difficultyBadgeWidth,
                            minWidth: 0,
                            padding: '0 4px',
                            cursor: 'default',
                            fontSize: '11px',
                            lineHeight: 1.1,
                            textAlign: 'center',
                            justifyContent: 'center',
                            fontVariantNumeric: 'tabular-nums',
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
              );
            })}
          </Stack>
        </Stack>
      </div>
    </Paper>
  );
});

export default SongCard;
