import { Paper, Group, Text, Avatar, Badge, Stack, Box } from '@mantine/core';
import IconMessageCircle from '@tabler/icons-react/dist/esm/icons/IconMessageCircle.mjs';
import IconMusic from '@tabler/icons-react/dist/esm/icons/IconMusic.mjs';
import { getRelativeTime, getProfileImageUrl } from '../../utils/formatters';

// Category color mapping for maimai genres
const CATEGORY_COLORS = {
  'POPS & ANIME': 'pink',
  'niconico': 'red',
  '東方Project': 'cyan',
  'GAME & VARIETY': 'violet',
  'maimai': 'yellow',
  'ORIGINAL & JOYPOLIS': 'teal',
  'ゲキチュウMAI': 'orange',
};

export function FeedSongCard({ song, songId, latestComment, onClick, variant = 'new' }) {
  const displayTitle = song?.title || songId || 'Unknown Song';
  const displayArtist = song?.artist;
  const category = song?.category;
  const categoryColor = CATEGORY_COLORS[category] || 'gray';

  return (
    <Paper
      p="sm"
      radius="md"
      withBorder
      onClick={onClick}
      style={{
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      className="glass-effect-hover"
    >
      <Group gap="sm" wrap="nowrap" align="flex-start">
        {/* Song Jacket / Thumbnail */}
        <Box
          style={{
            width: 48,
            height: 48,
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
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = ''; // Clear src on error
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
              <IconMusic size={20} />
            </Box>
          )}
        </Box>

        <Box style={{ flex: 1, overflow: 'hidden' }}>
          <Group gap={6} wrap="wrap" mb={2}>
            <Text fw={600} size="sm" lineClamp={1} style={{ maxWidth: '100%' }}>
              {displayTitle}
            </Text>
            {category && (
              <Badge size="xs" color={categoryColor} variant="light" style={{ flexShrink: 0 }}>
                {category}
              </Badge>
            )}
          </Group>
          {displayArtist && (
            <Text size="xs" c="dimmed" lineClamp={1}>
              {displayArtist}
            </Text>
          )}

          {/* Latest comment preview (discussion variant) */}
          {variant === 'discussion' && latestComment && (
            <Group gap={6} mt={6} wrap="nowrap" align="flex-start">
              <Avatar
                src={getProfileImageUrl(latestComment.author)}
                size={18}
                radius="xl"
                color="blue"
              >
                {(latestComment.author?.display_name || '?').charAt(0)}
              </Avatar>
              <Stack gap={0} style={{ flex: 1, overflow: 'hidden' }}>
                <Text size="xs" c="dimmed" lineClamp={1}>
                  <Text span fw={500} c="var(--mantine-color-text)">
                    {latestComment.author?.display_name || 'Someone'}
                  </Text>
                  {' commented • '}{getRelativeTime(latestComment.createdAt)}
                </Text>
                {latestComment.content && (
                  <Text size="xs" c="dimmed" lineClamp={1} fs="italic">
                    "{latestComment.content}"
                  </Text>
                )}
              </Stack>
            </Group>
          )}

          {/* New song date */}
          {variant === 'new' && song?.releaseDate && (
            <Text size="xs" c="dimmed" mt={2}>
              Added {getRelativeTime(song.releaseDate)}
            </Text>
          )}
        </Box>

        {/* Discussion icon indicator */}
        {variant === 'discussion' && (
          <Box style={{ color: 'var(--theme-primary)', opacity: 0.6, flexShrink: 0 }}>
            <IconMessageCircle size={16} />
          </Box>
        )}
      </Group>
    </Paper>
  );
}
