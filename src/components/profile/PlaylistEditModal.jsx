import { useState, useEffect } from 'react';
import { Modal, Stack, Text, Textarea, Button, Group, ActionIcon, Paper, Image, Box, Divider, Loader, TextInput } from '@mantine/core';
import { IconPlus, IconTrash, IconArrowUp, IconArrowDown, IconPlaylistAdd, IconDeviceFloppy } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import SongSelectionModal from '../../features/songs/components/SongSelectionModal';
import { playlistService } from '../../services/supabase';

export function PlaylistEditModal({ opened, onClose, userId, initialPlaylist, onSave, onDelete }) {
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [selectedSongs, setSelectedSongs] = useState([]); // Array of full song objects
  const [isSongPickerOpen, setIsSongPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    if (opened && initialPlaylist) {
      setTitle(initialPlaylist.title || '');
      setComment(initialPlaylist.comment || '');
      setSelectedSongs(initialPlaylist.fullSongs || []);
    } else if (opened) {
      setTitle('');
      setComment('');
      setSelectedSongs([]);
    }
  }, [opened, initialPlaylist]);

  const handleAddSong = (song) => {

    if (selectedSongs.some(s => s.songId === song.songId)) {
      notifications.show({
        title: 'Already Added',
        message: `${song.title} is already in your playlist`,
        color: 'blue'
      });
      return;
    }

    setSelectedSongs([...selectedSongs, song]);
    setIsSongPickerOpen(false);
  };

  const handleRemoveSong = (index) => {
    const newSongs = [...selectedSongs];
    newSongs.splice(index, 1);
    setSelectedSongs(newSongs);
  };

  const moveSong = (index, direction) => {
    const newSongs = [...selectedSongs];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newSongs.length) return;

    const temp = newSongs[index];
    newSongs[index] = newSongs[newIndex];
    newSongs[newIndex] = temp;
    setSelectedSongs(newSongs);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      notifications.show({ title: 'Title Required', message: 'Please give your playlist a title', color: 'red' });
      return;
    }

    setIsSaving(true);
    try {
      const songIds = selectedSongs.map(s => s.songId);
      const updatedPlaylist = await playlistService.upsertPlaylist(userId, initialPlaylist?.id, {
        title: title.trim(),
        comment: comment.trim(),
        songIds
      });

      notifications.show({
        title: 'Success',
        message: 'Playlist saved successfully',
        color: 'green'
      });

      if (onSave) onSave(updatedPlaylist);
      onClose();
    } catch (error) {
      console.error('Error saving playlist:', error);
      notifications.show({ title: 'Error', message: 'Failed to save playlist', color: 'red' });
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
          <IconPlaylistAdd size={20} />
          <Text fw={700}>{initialPlaylist ? 'Edit Playlist' : 'New Playlist'}</Text>
        </Group>
      }
      size="lg"
      radius="md"
      centered
    >
      <Stack gap="md" pt="md">
        <TextInput
          label="Playlist Title"
          placeholder="e.g., My DX Grind Set"
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          required
          maxLength={50}
        />

        <Divider label={`Songs (${selectedSongs.length})`} labelPosition="center" />

        <Stack gap="xs">
          {selectedSongs.map((song, index) => (
            <Paper
              key={`${song.songId}-${index}`}
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
                <Image src={song.imageUrl} alt={song.title} fallbackSrc="https://placehold.co/50x50?text=?" />
              </Box>

              <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={700} truncate>{song.title}</Text>
                <Text size="xs" c="dimmed" truncate>{song.artist}</Text>
              </Stack>

              <Group gap={4}>
                <ActionIcon variant="subtle" color="gray" onClick={() => moveSong(index, -1)} disabled={index === 0}>
                  <IconArrowUp size={16} />
                </ActionIcon>
                <ActionIcon variant="subtle" color="gray" onClick={() => moveSong(index, 1)} disabled={index === selectedSongs.length - 1}>
                  <IconArrowDown size={16} />
                </ActionIcon>
                <ActionIcon variant="subtle" color="red" onClick={() => handleRemoveSong(index)}>
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Paper>
          ))}

          <Button
            variant="light"
            leftSection={<IconPlus size={18} />}
            onClick={() => setIsSongPickerOpen(true)}
            fullWidth
            style={{ borderStyle: 'dashed' }}
            mt="xs"
          >
            Add Song
          </Button>

          {selectedSongs.length === 0 && (
            <Text size="xs" c="dimmed" ta="center" mt="xs">Add some songs to your playlist</Text>
          )}
        </Stack>

        <Textarea
          label="Playlist Comment"
          placeholder="Share something about this playlist..."
          value={comment}
          onChange={(e) => setComment(e.currentTarget.value)}
          maxLength={200}
          minRows={3}
          autosize
          description="Tell others why you picked these songs (max 200 chars)"
          mt="md"
        />

        <Group justify="flex-end" mt="xl">
          <Group gap="sm">
            <Button variant="default" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button leftSection={isSaving ? <Loader size={18} /> : <IconDeviceFloppy size={18} />} onClick={handleSave} loading={isSaving}>
              Save Playlist
            </Button>
          </Group>
        </Group>
      </Stack>

      <SongSelectionModal opened={isSongPickerOpen} onClose={() => setIsSongPickerOpen(false)} onSelect={handleAddSong} />
    </Modal>
  );
}
