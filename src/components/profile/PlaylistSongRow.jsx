import { Paper, Image, Box, Stack, Text, Group, Badge, ActionIcon } from '@mantine/core';
import IconArrowUp from '@tabler/icons-react/dist/esm/icons/IconArrowUp.mjs';
import IconArrowDown from '@tabler/icons-react/dist/esm/icons/IconArrowDown.mjs';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import { DIFFICULTY_COLORS, BASE_JACKET_URL } from '../../config/maimai-constants';

export function PlaylistSongRow({ song, index, totalSongs, moveSong, handleRemoveSong }) {
  return (
    <Paper
      withBorder
      p="xs"
      radius="md"
      className="glass-effect-hover"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--mantine-color-default-hover)',
      }}
    >
      <Box style={{ width: 50, height: 50, borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
        <Image src={song.imageUrl || (song.imageName ? `${BASE_JACKET_URL}${song.imageName}` : null)} alt={song.title} fallbackSrc="https://placehold.co/50x50?text=?" />
      </Box>

      <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" fw={700} truncate>{song.title}</Text>
        <Group gap={4}>
          <Text size="sm" c="dimmed" truncate style={{ flexShrink: 1 }}>{song.artist}</Text>
          {song.level && (
            <Badge size="sm" color={DIFFICULTY_COLORS[song.level] || 'gray'} variant="filled" style={{ textTransform: 'none' }}>
              {song.level}
            </Badge>
          )}
        </Group>
      </Stack>

      <Group gap={4}>
        <ActionIcon variant="subtle" color="gray" onClick={() => moveSong(index, -1)} disabled={index === 0}>
          <IconArrowUp size={16} />
        </ActionIcon>
        <ActionIcon variant="subtle" color="gray" onClick={() => moveSong(index, 1)} disabled={index === totalSongs - 1}>
          <IconArrowDown size={16} />
        </ActionIcon>
        <ActionIcon variant="subtle" color="red" onClick={() => handleRemoveSong(index)}>
          <IconTrash size={16} />
        </ActionIcon>
      </Group>
    </Paper>
  );
}
