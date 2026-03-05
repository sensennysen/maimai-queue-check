import { useState, useEffect, useCallback } from 'react';
import { Modal, Stack, Button, Select, TextInput, Text, Group, LoadingOverlay, Box, Tooltip } from '@mantine/core';
import { IconPlaylistAdd } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { playlistService } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { DIFFICULTY_COLORS, normalizeDifficulty } from '../../config/maimai-constants';

export function AddToPlaylistModal({
  opened,
  onClose,
  songData,
  onSuccess
}) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [selectedLevels, setSelectedLevels] = useState([]);


  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');

  const loadPlaylists = useCallback(async () => {
    try {
      setLoading(true);
      const data = await playlistService.getPlaylists(user.id);
      setPlaylists(data);
      if (data.length > 0 && !selectedPlaylistId && !isCreatingNew) {
        setSelectedPlaylistId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load playlists', error);
      notifications.show({
        title: 'Error',
        message: 'Could not load your playlists',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedPlaylistId, isCreatingNew]);

  useEffect(() => {
    if (opened && user) {
      loadPlaylists();
    } else if (!opened) {
      // Reset state on close
      setSelectedPlaylistId(null);
      setIsCreatingNew(false);
      setNewPlaylistTitle('');
      setSelectedLevels([]);
    }
  }, [opened, user, loadPlaylists]);

  const handleSave = async () => {
    if (!songData) return;

    try {
      setSaving(true);

      let targetPlaylistId = selectedPlaylistId;
      let targetSongs = [];

      if (isCreatingNew) {
        if (!newPlaylistTitle.trim()) {
          notifications.show({ title: 'Error', message: 'Title is required for a new playlist', color: 'red' });
          return;
        }

        // Ensure creation happens then add song
        const newPlaylist = await playlistService.upsertPlaylist(
          user.id,
          null,
          {
            title: newPlaylistTitle.trim(),
            songs: selectedLevels.length > 0
              ? selectedLevels.map(level => ({ id: songData.cardId || songData.songId || songData.id, level }))
              : [{ id: songData.cardId || songData.songId || songData.id, level: null }]
          }
        );
        targetPlaylistId = newPlaylist.id;
      } else {
        if (!targetPlaylistId) {
          notifications.show({ title: 'Error', message: 'No playlist selected', color: 'red' });
          return;
        }

        // Fetch existing songs for the selected playlist
        const pl = playlists.find(p => p.id === targetPlaylistId);

        // Extract song IDs currently in playlist
        targetSongs = pl?.songs || [];

        // Avoid duplicate ID if it already exists conceptually?
        // Let's just append it.
        const currentSongsToSave = targetSongs.map(s => ({
          id: s.song_id,
          level: s.level
        }));

        if (selectedLevels.length > 0) {
          selectedLevels.forEach(level => {
            currentSongsToSave.push({
              id: songData.cardId || songData.songId || songData.id,
              level: level
            });
          });
        } else {
          currentSongsToSave.push({
            id: songData.cardId || songData.songId || songData.id,
            level: null
          });
        }

        await playlistService.upsertPlaylist(
          user.id,
          targetPlaylistId,
          {
            title: pl.title,
            comment: pl.comment,
            is_public: pl.is_public,
            songs: currentSongsToSave
          }
        );
      }

      notifications.show({
        title: 'Success',
        message: `Song added to ${isCreatingNew ? 'new playlist' : 'playlist'}`,
        color: 'green',
        icon: <IconPlaylistAdd size={16} />
      });

      if (onSuccess) onSuccess();
      onClose();

    } catch (error) {
      console.error('Failed to save to playlist', error);
      notifications.show({
        title: 'Error',
        message: 'Could not add song to playlist',
        color: 'red'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600} size="lg">Add to Playlist</Text>}
      centered
      size="sm"
    >
      <Box pos="relative">
        <LoadingOverlay visible={loading} zIndex={100} />

        <Stack spacing="md" mt="xs">
          {songData && (
            <Text size="sm" color="dimmed" mb="xs">
              Adding <strong>{songData.title}</strong>
            </Text>
          )}

          <Select
            label="Select Playlist"
            data={[
              ...playlists.map(p => ({ value: p.id, label: p.title })),
              { value: 'create_new', label: '+ Create New Playlist' }
            ]}
            value={isCreatingNew ? 'create_new' : selectedPlaylistId}
            onChange={(val) => {
              if (val === 'create_new') {
                setIsCreatingNew(true);
                setSelectedPlaylistId(null);
              } else {
                setIsCreatingNew(false);
                setSelectedPlaylistId(val);
              }
            }}
            disabled={saving}
            searchable={playlists.length > 5}
            nothingFoundMessage="No playlists found"
          />

          {isCreatingNew && (
            <TextInput
              label="New Playlist Title"
              placeholder="My awesome playlist..."
              value={newPlaylistTitle}
              onChange={(e) => setNewPlaylistTitle(e.currentTarget.value)}
              autoFocus
              disabled={saving}
              required
            />
          )}

          {songData?.sheets && (
            <Stack gap="xs">
              <Text size="sm" fw={500}>Select Chart Levels</Text>
              <Group gap="xs">
                {songData.sheets.map(sheet => {
                  const normalized = normalizeDifficulty(sheet.difficulty);
                  const isSelected = selectedLevels.includes(normalized);

                  // Check if this specific chart (song + level) is already in the selected playlist
                  const currentPlaylist = playlists.find(p => p.id === selectedPlaylistId);
                  const songIdToCompare = songData.cardId || songData.songId || songData.id;
                  const isAlreadyInPlaylist = currentPlaylist?.songs?.some(s =>
                    (s.song_id === songIdToCompare) &&
                    (normalizeDifficulty(s.level) === normalized)
                  );

                  const button = (
                    <Button
                      key={normalized}
                      size="xs"
                      variant={isSelected ? 'filled' : 'outline'}
                      color={DIFFICULTY_COLORS[normalized] || 'gray'}
                      disabled={isAlreadyInPlaylist}
                      onClick={() => {
                        setSelectedLevels(prev =>
                          prev.includes(normalized)
                            ? prev.filter(l => l !== normalized)
                            : [...prev, normalized]
                        );
                      }}
                    >
                      {normalized} {sheet.level}
                    </Button>
                  );

                  if (isAlreadyInPlaylist) {
                    return (
                      <Tooltip key={normalized} label="This chart is already in the playlist" withArrow>
                        {/* Wrapper for disabled element tooltip */}
                        <Box component="div" style={{ cursor: 'not-allowed' }}>
                          {button}
                        </Box>
                      </Tooltip>
                    );
                  }

                  return button;
                })}
              </Group>
            </Stack>
          )}

          <Group position="right" mt="md" justify="flex-end">
            <Button variant="default" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={
                (!isCreatingNew && !selectedPlaylistId) ||
                (isCreatingNew && !newPlaylistTitle.trim()) ||
                (selectedLevels.length === 0)
              }
            >
              Add Song
            </Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  );
}
