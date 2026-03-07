import React from 'react';
import { Box, Paper, Image, Text, Stack } from '@mantine/core';
import './PlaylistStack.css';

export const PlaylistStack = React.memo(function PlaylistStack({ playlist, songs = [], onClick, style = {} }) {
  // Get up to 3 song images for the stack
  const stackImages = songs.slice(0, 3).map(s => s.imageUrl).filter(Boolean);

  // If no images, use a placeholder for the top card
  if (stackImages.length === 0) {
    stackImages.push('https://placehold.co/400x400?text=No+Songs');
  }

  return (
    <Box
      className="playlist-stack-container"
      onClick={onClick}
      style={{ overflow: 'visible', ...style }}
    >
      <Box className="playlist-stack">
        {/* Render background cards (offsets) */}
        {stackImages.slice(1).reverse().map((img, idx) => (
          <Paper
            key={`bg-${idx}`}
            className={`stack-card bg-card bg-card-${stackImages.length - idx - 1}`}
            shadow="md"
          >
            <Image
              src={img}
              fallbackSrc="https://placehold.co/400x400?text=?"
              alt=""
              style={{ pointerEvents: 'none' }}
              fit="cover"
              h="100%"
              loading="lazy"
            />
          </Paper>
        ))}

        {/* Render the top card (main info) */}
        <Paper className="stack-card top-card" shadow="xl">
          <Image
            src={stackImages[0]}
            fallbackSrc="https://placehold.co/400x400?text=?"
            alt={playlist.title}
            style={{ pointerEvents: 'none' }}
            fit="cover"
            h="100%"
            loading="lazy"
          />
          <Box className="stack-overlay">
            <Stack gap={2}>
              <Text fw={800} size="sm" c="white" lineClamp={1} style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                {playlist.title}
              </Text>
              <Text size="xs" c="rgba(255,255,255,0.8)" lineClamp={1} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                {songs.length} {songs.length === 1 ? 'Song' : 'Songs'}
              </Text>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
});
