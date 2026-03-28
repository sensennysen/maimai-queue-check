import { Paper, Group, Avatar, Stack, Text, Button, Badge } from '@mantine/core';
import { BASE_JACKET_URL } from '../../config/maimai-constants';

export function PlaylistResultCard({ playlist, song, onView }) {
  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
          <Avatar
            src={song.imageUrl || (song.imageName ? `${BASE_JACKET_URL}${song.imageName}` : undefined)}
            radius="md"
            size={64}
          />
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text fw={700} lineClamp={1}>{playlist.title}</Text>
            <Text size="sm" c="dimmed" lineClamp={1}>
              by {playlist.author?.display_name || playlist.author?.slug || 'Unknown'}
            </Text>
            <Badge size="xs" variant="light">
              {(playlist.songs || []).length} match{(playlist.songs || []).length !== 1 ? 'es' : ''}
            </Badge>
          </Stack>
        </Group>
        <Group gap="xs" wrap="nowrap">
          <Button
            size="xs"
            variant="light"
            onClick={() => onView(playlist)}
          >
            View Playlist
          </Button>
        </Group>
      </Group>
    </Paper>
  );
}
