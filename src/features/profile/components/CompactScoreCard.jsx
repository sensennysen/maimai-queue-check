import React from 'react';
import { Box, Image, Text, Badge, Stack } from '@mantine/core';
import { BASE_JACKET_URL, DIFFICULTY_COLORS, normalizeDifficulty } from '../../../config/maimai-constants';
import { getGrade } from '../../../utils/maimai-calc';

/**
 * A highly compact score card for the profile sidebar preview.
 * Displays only: jacket, achievement, letter score, and rating.
 */
export const CompactScoreCard = React.memo(function CompactScoreCard({ score, onClick }) {
  const jacketUrl = score.imageName ? `${BASE_JACKET_URL}${score.imageName}` : null;
  const scoreGrade = score.grade || getGrade(score.achievement);
  const difficultyLabel = normalizeDifficulty(score.difficulty);
  const difficultyColor = DIFFICULTY_COLORS[difficultyLabel] || 'gray';

  return (
    <Box
      pos="relative"
      style={{
        aspectRatio: '1',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        borderRadius: '8px',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        backgroundColor: 'var(--mantine-color-dark-6)'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <Image
        src={jacketUrl}
        alt={score.title}
        fallbackSrc="https://placehold.co/120x120?text=?"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Left side difficulty stripe - matches Recent Plays style */}
      <Box
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: difficultyColor,
          zIndex: 1,
        }}
      />

      {/* Bottom Gradient for readability */}
      <Box
        pos="absolute"
        inset={0}
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)',
          pointerEvents: 'none'
        }}
      />

      {/* Top Right: Rating Badge */}
      <Box pos="absolute" top={4} right={4}>
        <Badge
          size="xs"
          variant="filled"
          color="dark"
          radius="xs"
          h={16}
          px={4}
          style={{
            fontSize: '9px',
            fontWeight: 900,
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
            backgroundColor: 'rgba(0,0,0,0.8)'
          }}
        >
          {score.rating}
        </Badge>
      </Box>

      {/* Bottom Info: Achievement + Grade */}
      <Box
        pos="absolute"
        bottom={4}
        left={6}
        right={6}
        style={{ pointerEvents: 'none' }}
      >
        <Stack gap={0}>
          <Text
            size="9px"
            fw={900}
            c="white"
            style={{
              textShadow: '0 1px 3px black',
              lineHeight: 1,
              letterSpacing: '-0.2px',
              fontFamily: 'monospace'
            }}
          >
            {parseFloat(score.achievement).toFixed(4)}%
          </Text>
          <Text
            size="12px"
            fw={900}
            c="var(--theme-primary)"
            style={{
              textShadow: '0 1px 4px black',
              lineHeight: 1.1,
              marginTop: '1px'
            }}
          >
            {scoreGrade}
          </Text>
        </Stack>
      </Box>
    </Box>
  );
});
