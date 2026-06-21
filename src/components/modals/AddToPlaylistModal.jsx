import { useState, useEffect, useCallback } from 'react';
import { Modal, Stack, Button, Select, TextInput, Text, Group, LoadingOverlay, Box, Tooltip, UnstyledButton } from '@mantine/core';
import IconPlaylistAdd from '@tabler/icons-react/dist/esm/icons/IconPlaylistAdd.mjs';
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

        const pl = playlists.find(p => p.id === targetPlaylistId);
        targetSongs = pl?.songs || [];

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
      aria-label="Add to Playlist"
      size="md"
      centered
      padding={0}
      radius={24}
      withCloseButton={false}
      styles={{
        content: {
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 40px)'
        },
        body: {
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden'
        },
      }}
    >
      <LoadingOverlay visible={loading || saving} zIndex={100} overlayProps={{ radius: 'md', blur: 2 }} />

      {/* ── Fixed Header ─────────────────────────────────────────── */}
      <Box
        className="app-modal-header"
        style={{
          background: 'linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary), var(--theme-secondary) 40%))',
          padding: '24px 24px 20px',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <Group gap="sm" style={{ position: 'relative', zIndex: 1 }}>
          <Box
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3)',
            }}
          >
            <IconPlaylistAdd size={18} color="var(--theme-primary-contrast)" strokeWidth={2.2} />
          </Box>
          <Box>
            <Text
              size="lg"
              fw={800}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--theme-primary-contrast)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              Add to Playlist
            </Text>
            <Text size="xs" style={{ color: 'var(--theme-primary-contrast)', opacity: 0.8, marginTop: 2 }}>
              {songData?.title}
            </Text>
          </Box>
        </Group>

        <UnstyledButton
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            padding: '4px 12px',
            borderRadius: 20,
            background: 'rgba(255,255,255,0.2)',
            color: 'var(--theme-primary-contrast)',
            fontSize: 12,
            fontWeight: 700,
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s ease',
            zIndex: 10,
          }}
          aria-label="Close"
          className="header-close-pill"
        >
          Close
        </UnstyledButton>
      </Box>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <Stack gap="md" p="lg">
          {/* Section: Playlist Selection */}
          <Box
            style={{
              borderRadius: 18,
              padding: '16px',
              background: 'var(--theme-surface)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              border: '1px solid var(--theme-border)',
            }}
          >
            <Stack gap="md">
              <Select
                label={<Text size="sm" fw={700} style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.02em' }}>Target Playlist</Text>}
                placeholder="Choose a playlist..."
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
                comboboxProps={{
                  withinPortal: false,
                  offset: 4,
                  position: 'bottom'
                }}
                styles={{
                  input: {
                    borderRadius: 12,
                    minHeight: 46,
                    background: 'var(--theme-bg-soft, #f8f9fa)',
                    border: '1px solid var(--theme-border)',
                  }
                }}
              />

              {isCreatingNew && (
                <Stack gap={4}>
                  <Text size="sm" fw={700} style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.02em' }}>Playlist Title</Text>
                  <TextInput
                    placeholder="My awesome playlist..."
                    value={newPlaylistTitle}
                    onChange={(e) => setNewPlaylistTitle(e.currentTarget.value)}
                    autoFocus
                    disabled={saving}
                    styles={{
                      input: {
                        borderRadius: 12,
                        minHeight: 40,
                      }
                    }}
                  />
                </Stack>
              )}
            </Stack>
          </Box>

          {/* Section: Level Selection */}
          {songData?.sheets && (
            <Box
              style={{
                borderRadius: 18,
                padding: '16px',
                background: 'var(--theme-surface)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                border: '1px solid var(--theme-border)',
              }}
            >
              <Stack gap="xs">
                <Text size="sm" fw={700} style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.02em' }}>Choose Charts</Text>
                <Group gap="xs">
                  {songData.sheets.map(sheet => {
                    const normalized = normalizeDifficulty(sheet.difficulty);
                    const isSelected = selectedLevels.includes(normalized);

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
                        radius="xl"
                        onClick={() => {
                          setSelectedLevels(prev =>
                            prev.includes(normalized)
                              ? prev.filter(l => l !== normalized)
                              : [...prev, normalized]
                          );
                        }}
                        style={{
                          height: 32,
                          padding: '0 12px',
                          borderWidth: isSelected ? 0 : 1.5,
                        }}
                      >
                        {normalized} {sheet.level}
                      </Button>
                    );

                    if (isAlreadyInPlaylist) {
                      return (
                        <Tooltip key={normalized} label="Already in playlist" withArrow>
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
            </Box>
          )}

          <Group justify="flex-end" gap="sm" pt={4}>
            <Button
              variant="subtle"
              onClick={onClose}
              disabled={saving}
              color="gray"
              style={{ color: 'var(--theme-text-muted)' }}
            >
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
              style={{
                background: 'var(--theme-primary)',
                boxShadow: '0 4px 12px color-mix(in srgb, var(--theme-primary), transparent 70%)',
              }}
            >
              Add Song
            </Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  );
}
