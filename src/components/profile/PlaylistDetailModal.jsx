import { Modal, Stack, Text, Group, SimpleGrid, Box, Divider, Button } from '@mantine/core';
import { IconPlaylist, IconEdit, IconMusic, IconTrash } from '@tabler/icons-react';
import FavoriteSongCard from './FavoriteSongCard';

export function PlaylistDetailModal({ playlist, songs = [], opened, onClose, isOwnProfile, onEdit, onDelete }) {
  if (!playlist) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconPlaylist size={24} style={{ color: 'var(--theme-primary)' }} />
          <Text fw={700} size="lg">{playlist.title}</Text>
        </Group>
      }
      size="xl"
      radius="md"
      centered
    >
      <Stack gap="lg" pt="md">
        <Divider label={<Group gap={4}><IconMusic size={14} /> Songs ({songs.length})</Group>} labelPosition="center" />

        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
          {songs.map((song) => (
            <FavoriteSongCard
              key={song.songId}
              song={song}
              onDelete={() => { }}
              isOwnProfile={false}
              onClick={() => { }}
            />
          ))}
          {songs.length === 0 && (
            <Text ta="center" c="dimmed" style={{ gridColumn: '1 / -1' }}>No songs in this playlist yet.</Text>
          )}
        </SimpleGrid>

        {playlist.comment && (
          <Box
            p="md"
            radius="md"
            style={{
              background: 'var(--mantine-color-default-hover)',
              borderLeft: '4px solid var(--theme-primary)',
              fontStyle: 'italic'
            }}
          >
            <Text size="sm" c="var(--theme-text-muted)">
              "{playlist.comment}"
            </Text>
          </Box>
        )}

        {isOwnProfile && (
          <Group justify="space-between" mt="md">
            <Button
              variant="subtle"
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this playlist?')) {
                  onDelete(playlist.id);
                }
              }}
            >
              Delete
            </Button>
            <Button
              variant="light"
              leftSection={<IconEdit size={16} />}
              onClick={() => {
                onClose();
                onEdit(playlist);
              }}
            >
              Edit Playlist
            </Button>
          </Group>
        )}
      </Stack>
    </Modal>
  );
}
