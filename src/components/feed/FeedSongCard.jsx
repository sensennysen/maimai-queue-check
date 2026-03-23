import { useState } from 'react';
import { Paper, Group, Text, Avatar, Badge, Stack, Box } from '@mantine/core';
import IconMessageCircle from '@tabler/icons-react/dist/esm/icons/IconMessageCircle.mjs';
import IconMusic from '@tabler/icons-react/dist/esm/icons/IconMusic.mjs';
import { getRelativeTime, getProfileImageUrl } from '../../utils/formatters';
import { ImagePreviewModal } from '../common/ImagePreviewModal';

const CATEGORY_COLORS = {
  'POPS & ANIME': 'pink',
  niconico: 'red',
  '\u6771\u65b9Project': 'cyan',
  'GAME & VARIETY': 'violet',
  maimai: 'yellow',
  'ORIGINAL & JOYPOLIS': 'teal',
  '\u30b2\u30ad\u30c1\u30e5\u30a6MAI': 'orange',
};

export function FeedSongCard({ song, songId, latestComment, onClick, variant = 'new', className }) {
  const displayTitle = song?.title || songId || 'Unknown Song';
  const displayArtist = song?.artist;
  const category = song?.category;
  const categoryColor = CATEGORY_COLORS[category] || 'gray';
  const isTrending = variant === 'trending';
  const isDiscussion = variant === 'discussion' || isTrending;
  const [imagePreviewOpened, setImagePreviewOpened] = useState(false);
  const [imagePreviewSrc, setImagePreviewSrc] = useState(null);
  const [imagePreviewAlt, setImagePreviewAlt] = useState(displayTitle);

  const openImagePreview = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!song?.imageUrl) return;
    setImagePreviewSrc(song.imageUrl);
    setImagePreviewAlt(displayTitle);
    setImagePreviewOpened(true);
  };

  return (
    <>
      <Paper
        p="sm"
        radius="md"
        withBorder
        onClick={onClick}
        style={{
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        className={`glass-effect-hover ${className || ''}`.trim()}
      >
      <Group gap={isTrending ? 'md' : 'sm'} wrap="nowrap" align="center">
        <Box
          className={isTrending ? 'community-trending-jacket' : undefined}
          style={{
            width: isTrending ? 220 : 48,
            height: isTrending ? 120 : 48,
            borderRadius: 'var(--mantine-radius-md)',
            overflow: 'hidden',
            flexShrink: 0,
            backgroundColor: 'var(--mantine-color-default-hover)',
          }}
        >
          {song?.imageUrl ? (
            <img
              src={song.imageUrl}
              alt={displayTitle}
              style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }}
              onClick={openImagePreview}
              onError={(e) => {
                e.currentTarget.src = '';
                e.currentTarget.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--theme-primary)"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg></div>';
              }}
            />
          ) : (
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--theme-primary)',
              }}
            >
              <IconMusic size={isTrending ? 32 : 20} />
            </Box>
          )}
        </Box>

        <Box style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <Group gap={6} wrap="wrap" mb={2}>
            <Text fw={700} size={isTrending ? 'xl' : 'sm'} lineClamp={1} style={{ maxWidth: '100%' }}>
              {displayTitle}
            </Text>
            {category && (
              <Badge size="xs" color={categoryColor} variant="light" style={{ flexShrink: 0 }}>
                {category}
              </Badge>
            )}
          </Group>
          {displayArtist && (
            <Text size={isTrending ? 'sm' : 'xs'} c="dimmed" lineClamp={1}>
              {displayArtist}
            </Text>
          )}

          {isDiscussion && latestComment && (
            <Group gap={6} mt={6} wrap="nowrap" align="flex-start">
              <Avatar
                src={getProfileImageUrl(latestComment.author)}
                size={isTrending ? 24 : 18}
                radius="xl"
                color="blue"
              >
                {(latestComment.author?.display_name || '?').charAt(0)}
              </Avatar>
              <Stack gap={0} style={{ flex: 1, overflow: 'hidden' }}>
                <Text size={isTrending ? 'sm' : 'xs'} c="dimmed" lineClamp={1}>
                  <Text span fw={500} c="var(--mantine-color-text)">
                    {latestComment.author?.display_name || 'Someone'}
                  </Text>
                  {' commented - '}{getRelativeTime(latestComment.createdAt)}
                </Text>
                {latestComment.content && (
                  <Text size={isTrending ? 'sm' : 'xs'} c="dimmed" lineClamp={isTrending ? 2 : 1} fs="italic">
                    "{latestComment.content}"
                  </Text>
                )}
              </Stack>
            </Group>
          )}

          {variant === 'new' && song?.releaseDate && (
            <Text size="xs" c="dimmed" mt={2}>
              Added {getRelativeTime(song.releaseDate)}
            </Text>
          )}
        </Box>

        {isDiscussion && !isTrending && (
          <Box style={{ color: 'var(--theme-primary)', opacity: 0.6, flexShrink: 0 }}>
            <IconMessageCircle size={16} />
          </Box>
        )}
      </Group>
      </Paper>

      {imagePreviewOpened && (
        <ImagePreviewModal
          opened={imagePreviewOpened}
          onClose={() => {
            setImagePreviewOpened(false);
            setImagePreviewSrc(null);
          }}
          src={imagePreviewSrc}
          alt={imagePreviewAlt}
          caption={null}
        />
      )}
    </>
  );
}
