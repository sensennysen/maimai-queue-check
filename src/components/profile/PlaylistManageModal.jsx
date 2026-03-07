import { useState, useEffect } from 'react';
import { Modal, Stack, Text, Button, Group, ActionIcon, Paper, ThemeIcon } from '@mantine/core';
import { IconArrowUp, IconArrowDown, IconPlaylist, IconDeviceFloppy, IconSelector } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { playlistService } from '../../services/supabase';

export function PlaylistManageModal({ opened, onClose, userId, playlists: initialPlaylists, onSave }) {
  const [playlists, setPlaylists] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (opened) {
      setPlaylists([...initialPlaylists]);
    }
  }, [opened, initialPlaylists]);

  const movePlaylist = (index, direction) => {
    const newPlaylists = [...playlists];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newPlaylists.length) return;

    const temp = newPlaylists[index];
    newPlaylists[index] = newPlaylists[newIndex];
    newPlaylists[newIndex] = temp;
    setPlaylists(newPlaylists);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const playlistIds = playlists.map(p => p.id);
      await playlistService.reorderPlaylists(userId, playlistIds);

      notifications.show({
        title: 'Success',
        message: 'Playlist order updated',
        color: 'green'
      });

      if (onSave) onSave(playlists);
      onClose();
    } catch (error) {
      console.error('Error saving playlist order:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to save new order',
        color: 'red'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconSelector size={20} />
          <Text fw={700}>Manage Playlist Order</Text>
        </Group>
      }
      size="md"
      radius="md"
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Use the arrows to change the display order of your playlists on your profile.
        </Text>

        <Stack gap="xs">
          {playlists.map((pl, index) => (
            <Paper
              key={pl.id}
              withBorder
              p="sm"
              radius="md"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--mantine-color-default-hover)',
              }}
            >
              <ThemeIcon variant="light" color="gray" size="md">
                <IconPlaylist size={18} />
              </ThemeIcon>

              <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={700} truncate>{pl.title}</Text>
                <Text size="xs" c="dimmed">
                  {pl.songs?.length || 0} {(pl.songs?.length || 0) === 1 ? 'Song' : 'Songs'}
                </Text>
              </Stack>

              <Group gap={4}>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => movePlaylist(index, -1)}
                  disabled={index === 0 || isSaving}
                >
                  <IconArrowUp size={16} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => movePlaylist(index, 1)}
                  disabled={index === playlists.length - 1 || isSaving}
                >
                  <IconArrowDown size={16} />
                </ActionIcon>
              </Group>
            </Paper>
          ))}
        </Stack>

        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            leftSection={<IconDeviceFloppy size={18} />}
            onClick={handleSave}
            loading={isSaving}
          >
            Save Order
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
