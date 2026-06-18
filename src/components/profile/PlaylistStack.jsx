import React from 'react';
import { Box, Text } from '@mantine/core';
import IconPlaylist from '@tabler/icons-react/dist/esm/icons/IconPlaylist.mjs';
import './PlaylistStack.css';

export const PlaylistStack = React.memo(function PlaylistStack({ playlist, songs = [], onClick, style = {} }) {
  const covers = songs
    .map(song => song.imageUrl || song.image_url)
    .filter(Boolean)
    .slice(0, 4);

  return (
    <button
      type="button"
      className="profile-playlist-card"
      onClick={onClick}
      style={style}
      aria-label={`Open ${playlist.title || 'playlist'}`}
    >
      <Box className="profile-playlist-card__cover">
        {Array.from({ length: 4 }, (_, index) => (
          covers[index]
            ? <img key={index} src={covers[index]} alt="" loading="lazy" />
            : <span key={index} aria-hidden="true"><IconPlaylist size={22} /></span>
        ))}
      </Box>

      <Box className="profile-playlist-card__content">
        <Text fw={700} size="sm" lineClamp={2}>
          {playlist.title || 'Untitled Playlist'}
        </Text>
        <Text size="xs" c="dimmed">
          {songs.length} {songs.length === 1 ? 'song' : 'songs'}
        </Text>
      </Box>
    </button>
  );
});
