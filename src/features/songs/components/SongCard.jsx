import { Image, Paper, Text, Tooltip } from '@mantine/core';
import React, { useMemo } from 'react';
import dxImage from '../../../assets/music_dx.png';
import standardImage from '../../../assets/music_standard.png';
import {
  BASE_JACKET_URL,
  CATEGORY_TRANSLATION,
  DIFFICULTY_COLORS,
  VERSION_MAPPING,
  normalizeDifficulty,
} from '../../../config/maimai-constants';
import './SongDatabase.css';

const DIFFICULTY_ORDER = ['Basic', 'Advanced', 'Expert', 'Master', 'Re:Master'];

export const SongCard = React.memo(function SongCard({
  song,
  onClick,
  hideDifficulties = false,
  hideTags = false,
  style,
}) {
  const sortedSheets = useMemo(() => {
    if (hideDifficulties || !song.sheets) return [];

    return [...song.sheets].sort((a, b) => {
      const diffA = DIFFICULTY_ORDER.indexOf(normalizeDifficulty(a.difficulty));
      const diffB = DIFFICULTY_ORDER.indexOf(normalizeDifficulty(b.difficulty));
      return diffA - diffB;
    });
  }, [song.sheets, hideDifficulties]);

  const typeImage = song.cardType === 'dx' ? dxImage : standardImage;
  const category = CATEGORY_TRANSLATION[song.category] || song.category;
  const version = VERSION_MAPPING[song.version] || song.version;

  return (
    <Paper p={0} radius="md" className="song-card" style={style}>
      <button type="button" className="song-card__button" onClick={onClick} aria-label={`Open ${song.title}`}>
        <div className="song-card__image">
          <Image
            src={song.imageUrl || (song.imageName ? `${BASE_JACKET_URL}${song.imageName}` : null)}
            alt=""
            loading="lazy"
            fallbackSrc="https://placehold.co/300x300?text=No+Image"
          />
        </div>

        <div className="song-card__content">
          <div className="song-card__heading">
            <Text fw={700} lineClamp={2} title={song.title} size="sm" className="song-card__title">
              {song.title}
            </Text>
            <Text size="xs" c="dimmed" lineClamp={1} title={song.artist} mt={2}>
              {song.artist}
            </Text>
          </div>

          {!hideTags && (
            <div className="song-card__meta">
              {song.cardType && (
                <img
                  src={typeImage}
                  alt={song.cardType === 'dx' ? 'DX chart' : 'Standard chart'}
                  loading="lazy"
                  className="song-card__type"
                />
              )}
              <Text className="song-card__meta-text" lineClamp={1} title={`${category} · ${version}`}>
                {category} · {version}
              </Text>
            </div>
          )}

          {sortedSheets.length > 0 && (
            <div className="song-card__difficulties" aria-label="Chart levels">
              {sortedSheets.map((sheet) => {
                const normalizedDiff = normalizeDifficulty(sheet.difficulty);
                const diffColor = DIFFICULTY_COLORS[normalizedDiff] || 'gray';

                return (
                  <Tooltip
                    key={`${sheet.type}-${sheet.difficulty}`}
                    label={`${normalizedDiff}: ${sheet.level}${sheet.internalLevel ? ` (${sheet.internalLevel})` : ''}`}
                    withArrow
                  >
                    <span
                      className="song-card__difficulty"
                      style={{ backgroundColor: diffColor }}
                      aria-label={`${normalizedDiff} level ${sheet.level}`}
                    >
                      {sheet.level}
                    </span>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </div>
      </button>
    </Paper>
  );
});

export default SongCard;
