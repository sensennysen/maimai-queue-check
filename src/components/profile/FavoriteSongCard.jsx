import React from 'react';
import { Paper, Text, Box, Image, ActionIcon, Tooltip } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import dxImage from '../../assets/music_dx.png';
import standardImage from '../../assets/music_standard.png';
const FavoriteSongCard = React.memo(function FavoriteSongCard({ song, onDelete, isOwnProfile, onClick }) {
  return (
    <Paper
      p={0}
      radius="lg"
      className="hologram-card favorite-song-card"
      style={{
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        transition: 'transform 0.1s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 160px'
      }}
      styles={{
        root: {
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
      }}
      onClick={(e) => {
        // Don't trigger if clicking delete button
        if (e.target.closest('.delete-btn')) return;
        if (onClick) onClick(song);
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
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Full Cover Image Area */}
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
              objectFit: 'cover',
              pointerEvents: 'none'
            }}
            fallbackSrc="https://placehold.co/300x300?text=No+Image"
            loading="lazy"
          />

          {/* Dark Overlay for Text Readability */}
          {/* Dark Overlay for Text Readability - Stronger gradient */}
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0) 100%)',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />

          {/* Delete Button (Protruding) */}
          {isOwnProfile && (
            <ActionIcon
              variant="filled"
              color="red"
              size="sm"
              radius="xl"
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 10,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(song);
              }}
              title="Remove from favorites"
            >
              <IconX size={14} />
            </ActionIcon>
          )}

          {/* DX/Standard Type Badge */}
          {song.cardType && (
            <img
              src={song.cardType === 'dx' ? dxImage : standardImage}
              alt={song.cardType === 'dx' ? 'DX' : 'Standard'}
              loading="lazy"
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                height: 16,
                zIndex: 10,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))'
              }}
            />
          )}

          {/* Content Overlay */}
          <Box
            p="md"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 5,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end'
            }}
          >
            {/* Title */}
            <Text
              fw={700}
              lineClamp={1}
              title={song.title}
              size="sm"
              c="white"
              style={{
                lineHeight: 1.2,
                fontFamily: 'var(--font-heading)',
                textShadow: '0 2px 4px rgba(0,0,0,1)'
              }}
            >
              {song.title}
            </Text>
          </Box>
        </Box>
      </div>
    </Paper>
  );
});

export default FavoriteSongCard;
