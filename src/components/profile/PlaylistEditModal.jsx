import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Stack, Text, Textarea, Button, Group, ActionIcon, Paper, Image, Box, Divider, Loader, TextInput, Badge, Switch, Alert } from '@mantine/core';
import { IconPlus, IconTrash, IconArrowUp, IconArrowDown, IconPlaylistAdd, IconDeviceFloppy, IconFileAlert } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import SongSelectionModal from '../../features/songs/components/SongSelectionModal';
import { playlistService } from '../../services/supabase';
import { DIFFICULTY_COLORS } from '../../config/maimai-constants';
import { PlaylistProtectionModal } from '../modals/PlaylistProtectionModal';
import { useSongDatabaseContext } from '../../hooks/useSongDatabaseContext';

export function PlaylistEditModal({ opened, onClose, userId, initialPlaylist, onSave, hidePublicToggle = false, onDraftChange }) {
  const { songMapById } = useSongDatabaseContext();
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [isSongPickerOpen, setIsSongPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProtectionModalOpen, setIsProtectionModalOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  // Draft state managed via Refs for stable debounced access
  const draftIdRef = useRef(null);
  const [showDraftAlert, setShowDraftAlert] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const autosaveTimer = useRef(null);
  const isNewPlaylist = !initialPlaylist;

  // On open: for new playlists, check if a draft exists
  useEffect(() => {
    if (!opened) return;

    if (initialPlaylist) {
      setTitle(initialPlaylist.title || '');
      setComment(initialPlaylist.comment || '');
      setIsPublic(initialPlaylist.is_public || false);
      setSelectedSongs(initialPlaylist.fullSongs || []);
      draftIdRef.current = null;
      setShowDraftAlert(false);
      setPendingDraft(null);
    } else {
      setTitle('');
      setComment('');
      setIsPublic(false);
      setSelectedSongs([]);
      draftIdRef.current = null;
      setShowDraftAlert(false);
      setPendingDraft(null);

      if (userId) {
        playlistService.getDraft(userId).then((draft) => {
          if (draft && (draft.title || (draft.songs && draft.songs.length > 0) || draft.comment)) {
            setPendingDraft(draft);
            setShowDraftAlert(true);
          }
        }).catch(console.error);
      }
    }
  }, [opened, initialPlaylist, userId]);

  // Clear autosave timer on close
  useEffect(() => {
    if (!opened) {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    }
  }, [opened]);

  const buildSongsPayload = useCallback((songs) =>
    songs.map(s => {
      // Handle both full song objects and raw draft entries
      const id = s.cardId || s.songId || s.id;
      return { id, level: s.level || null };
    }),
    []
  );

  // Debounced autosave
  const scheduleDraftSave = useCallback((nextTitle, nextComment, nextIsPublic, nextSongs) => {
    if (!isNewPlaylist || !userId) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      try {
        setIsDraftSaving(true);
        const saved = await playlistService.saveDraft(userId, draftIdRef.current, {
          title: nextTitle,
          comment: nextComment,
          is_public: nextIsPublic,
          songs: buildSongsPayload(nextSongs),
        });
        if (saved?.id) draftIdRef.current = saved.id;
        if (onDraftChange) onDraftChange(true);
      } catch (err) {
        console.error('Draft autosave failed:', err);
      } finally {
        setIsDraftSaving(false);
      }
    }, 1000);
  }, [isNewPlaylist, userId, buildSongsPayload, onDraftChange]);

  const handleContinueDraft = () => {
    if (!pendingDraft) return;
    setTitle(pendingDraft.title || '');
    setComment(pendingDraft.comment || '');
    setIsPublic(pendingDraft.is_public || false);

    // Resolve song data from the draft
    if (pendingDraft.songs && songMapById) {
      const resolved = pendingDraft.songs.map(entry => {
        const full = songMapById.get(entry.song_id);
        return full ? { ...full, level: entry.level } : null;
      }).filter(Boolean);
      setSelectedSongs(resolved);
    } else {
      setSelectedSongs([]);
    }

    draftIdRef.current = pendingDraft.id;
    setShowDraftAlert(false);
    setPendingDraft(null);
  };

  const handleDiscardDraft = async () => {
    if (pendingDraft?.id) {
      try {
        await playlistService.discardDraft(pendingDraft.id);
        if (onDraftChange) onDraftChange(false);
      } catch (err) {
        console.error('Failed to discard draft:', err);
      }
    }
    setShowDraftAlert(false);
    setPendingDraft(null);
  };

  const handleAddSong = (songOrSongs) => {
    const newSelection = Array.isArray(songOrSongs) ? songOrSongs : [songOrSongs];
    setSelectedSongs(newSelection);
    setIsSongPickerOpen(false);
    scheduleDraftSave(title, comment, isPublic, newSelection);
  };

  const handleRemoveSong = (index) => {
    const newSongs = [...selectedSongs];
    newSongs.splice(index, 1);
    setSelectedSongs(newSongs);
    scheduleDraftSave(title, comment, isPublic, newSongs);
  };

  const moveSong = (index, direction) => {
    const newSongs = [...selectedSongs];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newSongs.length) return;
    const temp = newSongs[index];
    newSongs[index] = newSongs[newIndex];
    newSongs[newIndex] = temp;
    setSelectedSongs(newSongs);
    scheduleDraftSave(title, comment, isPublic, newSongs);
  };

  const handleTitleChange = (e) => {
    const val = e.currentTarget.value;
    setTitle(val);
    scheduleDraftSave(val, comment, isPublic, selectedSongs);
  };

  const handleCommentChange = (e) => {
    const val = e.currentTarget.value;
    setComment(val);
    scheduleDraftSave(title, val, isPublic, selectedSongs);
  };

  const handlePublicChange = (newValue) => {
    setIsPublic(newValue);
    scheduleDraftSave(title, comment, newValue, selectedSongs);
  };

  const clearDraft = async () => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    if (draftIdRef.current) {
      try {
        await playlistService.discardDraft(draftIdRef.current);
        if (onDraftChange) onDraftChange(false);
      } catch (err) {
        console.error('Failed to clear draft:', err);
      }
      draftIdRef.current = null;
    }
  };

  const handleCancel = async () => {
    await clearDraft();
    onClose();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      notifications.show({ title: 'Title Required', message: 'Please give your playlist a title', color: 'red' });
      return;
    }

    setIsSaving(true);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    try {
      const songs = selectedSongs.map(s => ({ id: s.cardId || s.songId || s.id, level: s.level || null }));
      const updatedPlaylist = await playlistService.upsertPlaylist(userId, draftIdRef.current || initialPlaylist?.id, {
        title: title.trim(),
        comment: comment.trim(),
        is_public: isPublic,
        is_draft: false,
        songs
      });

      if (onDraftChange) onDraftChange(false);

      notifications.show({
        title: 'Success',
        message: 'Playlist saved successfully',
        color: 'green'
      });

      if (onSave) onSave(updatedPlaylist);
      draftIdRef.current = null;
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
        <Group justify="space-between" w="100%">
          <Group gap="xs">
            <IconPlaylistAdd size={20} />
            <Text fw={700}>{initialPlaylist ? 'Edit Playlist' : 'New Playlist'}</Text>
            {isDraftSaving && <Text size="xs" c="dimmed">Saving draft…</Text>}
          </Group>
          {selectedSongs.length > 0 && (
            <Button
              size="xs"
              variant="subtle"
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={() => {
                setSelectedSongs([]);
                scheduleDraftSave(title, comment, isPublic, []);
              }}
            >
              Clear All
            </Button>
          )}
        </Group>
      }
      size="lg"
      radius="md"
      centered
      transitionProps={{ transition: 'fade', duration: 0 }}
      classNames={{ content: 'profile-modal-pop' }}
    >
      <Stack gap="md" pt="md">
        {showDraftAlert && (
          <Alert
            icon={<IconFileAlert size={18} />}
            title="Unsaved draft found"
            color="orange"
            variant="light"
            withCloseButton
            onClose={handleDiscardDraft}
          >
            <Text size="sm" mb="xs">You have an unsaved draft from a previous session.</Text>
            <Group gap="xs">
              <Button size="xs" color="orange" onClick={handleContinueDraft}>
                Continue Draft
              </Button>
              <Button size="xs" variant="subtle" color="gray" onClick={handleDiscardDraft}>
                Discard
              </Button>
            </Group>
          </Alert>
        )}

        <TextInput
          label="Playlist Title"
          placeholder="e.g., My DX Grind Set"
          value={title}
          onChange={handleTitleChange}
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
                <Group gap={4}>
                  <Text size="xs" c="dimmed" truncate style={{ flexShrink: 1 }}>{song.artist}</Text>
                  {song.level && (
                    <Badge size="xs" color={DIFFICULTY_COLORS[song.level] || 'gray'} variant="filled" style={{ textTransform: 'none' }}>
                      {song.level}
                    </Badge>
                  )}
                </Group>
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
          onChange={handleCommentChange}
          maxLength={200}
          minRows={3}
          autosize
          description="Tell others why you picked these songs (max 200 chars)"
          mt="md"
        />

        <Group justify={hidePublicToggle ? "flex-end" : "space-between"} mt="xl">
          {!hidePublicToggle && (
            <Switch
              label="Make Playlist Public"
              description="Allow others to view and share this playlist"
              checked={isPublic}
              onChange={(event) => {
                const newValue = event.currentTarget.checked;
                if (!newValue && initialPlaylist?.is_public) {
                  setIsProtectionModalOpen(true);
                } else {
                  handlePublicChange(newValue);
                }
              }}
              color="teal"
            />
          )}

          {isPublic && !hidePublicToggle && (
            <Box p="xs" radius="sm" bg="var(--mantine-color-teal-light)" style={{ border: '1px solid var(--mantine-color-teal-outline)' }}>
              <Text size="xs" c="teal" fw={500}>
                This playlist will be visible to everyone in the global feed.
              </Text>
            </Box>
          )}

          <Group gap="sm">
            <Button variant="default" onClick={handleCancel} disabled={isSaving}>Cancel</Button>
            <Button leftSection={isSaving ? <Loader size={18} /> : <IconDeviceFloppy size={18} />} onClick={handleSave} loading={isSaving}>
              Save Playlist
            </Button>
          </Group>
        </Group>
      </Stack>

      <PlaylistProtectionModal
        opened={isProtectionModalOpen}
        onClose={() => setIsProtectionModalOpen(false)}
        onConfirm={async () => {
          setIsSaving(true);
          try {
            const songsForService = selectedSongs.map(s => ({ id: s.cardId || s.songId || s.id, level: s.level }));
            const updatedPlaylist = await playlistService.upsertPlaylist(userId, initialPlaylist?.id, {
              title: title.trim(),
              comment: comment.trim(),
              is_public: false,
              songs: songsForService
            });

            await playlistService.softDeletePostsByPlaylist(initialPlaylist.id);

            notifications.show({
              title: 'Playlist Private',
              message: 'Playlist is now private and its shared posts have been removed.',
              color: 'indigo'
            });

            if (onSave) onSave(updatedPlaylist);
            onClose();
          } catch (error) {
            console.error('Error privatizing playlist:', error);
            notifications.show({ title: 'Error', message: 'Failed to privatize playlist', color: 'red' });
          } finally {
            setIsSaving(false);
            setIsProtectionModalOpen(false);
          }
        }}
        type="private"
        loading={isSaving}
      />

      <SongSelectionModal
        opened={isSongPickerOpen}
        onClose={() => setIsSongPickerOpen(false)}
        onSelect={handleAddSong}
        multiple={true}
        initialSelectedSongs={selectedSongs}
        onSelectionChange={(newSelection) => {
          setSelectedSongs(newSelection);
          scheduleDraftSave(title, comment, isPublic, newSelection);
        }}
      />
    </Modal>
  );
}
