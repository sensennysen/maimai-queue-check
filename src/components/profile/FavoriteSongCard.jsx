import React from 'react';
import { ActionIcon, Badge, Image, Paper, Text } from '@mantine/core';
import IconX from '@tabler/icons-react/dist/esm/icons/IconX.mjs';
import dxImage from '../../assets/music_dx.png';
import standardImage from '../../assets/music_standard.png';
import { BASE_JACKET_URL, DIFFICULTY_COLORS, normalizeDifficulty } from '../../config/maimai-constants';

const FavoriteSongCard = React.memo(function FavoriteSongCard({ song, onDelete, isOwnProfile, onClick }) {
  const selectedSheet = React.useMemo(() => {
    if (!song.level || !song.sheets) return null;
    return song.sheets.find(s => normalizeDifficulty(s.difficulty) === song.level || s.difficulty === song.level);
  }, [song.level, song.sheets]);

  return (
    <Paper p={0} radius="md" className="profile-song-card">
      <button type="button" className="profile-song-card__button" onClick={() => onClick?.(song)}>
        <div className="profile-song-card__image">
          <Image
            src={song.imageUrl || (song.imageName ? `${BASE_JACKET_URL}${song.imageName}` : null)}
            alt=""
            fallbackSrc="https://placehold.co/300x300?text=No+Image"
            loading="lazy"
          />

          {isOwnProfile && (
            <ActionIcon
              className="delete-btn profile-song-card__delete"
              variant="filled"
              color="red"
              size="sm"
              radius="md"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDelete(song);
              }}
              aria-label={`Remove ${song.title} from favorites`}
            >
              <IconX size={14} />
            </ActionIcon>
          )}
        </div>

        <div className="profile-song-card__content">
          <Text fw={700} size="sm" lineClamp={2} title={song.title}>
            {song.title}
          </Text>
          <div className="profile-song-card__meta">
            {song.cardType && (
              <img
                src={song.cardType === 'dx' ? dxImage : standardImage}
                alt={song.cardType === 'dx' ? 'DX chart' : 'Standard chart'}
              />
            )}
            {song.level && (
              <Badge
                size="sm"
                variant="filled"
                style={{ backgroundColor: DIFFICULTY_COLORS[song.level] || 'gray' }}
              >
                {selectedSheet ? selectedSheet.level : song.level}
              </Badge>
            )}
          </div>
        </div>
      </button>
    </Paper>
  );
});

export default FavoriteSongCard;
