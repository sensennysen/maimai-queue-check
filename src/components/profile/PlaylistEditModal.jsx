import { useState } from 'react';
import { Modal, Stack, Text, Textarea, Button, Group, Box, Divider, Loader, TextInput, Switch, Alert } from '@mantine/core';
import { IconPlus, IconTrash, IconPlaylistAdd, IconDeviceFloppy, IconFileAlert } from '@tabler/icons-react';
import SongSelectionModal from '../../features/songs/components/SongSelectionModal';
import { PlaylistProtectionModal } from '../modals/PlaylistProtectionModal';
import { useSongDatabaseContext } from '../../hooks/useSongDatabaseContext';
import { usePlaylistEditor } from '../../features/playlists/hooks/usePlaylistEditor';
import { PlaylistSongRow } from './PlaylistSongRow';

export function PlaylistEditModal({ opened, onClose, userId, initialPlaylist, onSave, hidePublicToggle = false, onDraftChange }) {
  const { songMapById } = useSongDatabaseContext();
  const {
    title,
    comment,
    selectedSongs,
    setSelectedSongs,
    isSaving,
    isPublic,
    showDraftAlert,
    isDraftSaving,
    handleContinueDraft,
    handleDiscardDraft,
    handleAddSong,
    handleRemoveSong,
    moveSong,
    updateTitle,
    updateComment,
    updatePublic,
    clearDraft,
    savePlaylist,
    privatizePlaylist
  } = usePlaylistEditor({ userId, initialPlaylist, opened, onDraftChange, onSave });

  const [isSongPickerOpen, setIsSongPickerOpen] = useState(false);
  const [isProtectionModalOpen, setIsProtectionModalOpen] = useState(false);

  const handleCancel = async () => {
    await clearDraft();
    onClose();
  };

  const handleSave = async () => {
    const success = await savePlaylist();
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group justify="space-between" w="100%">
          <Group gap="sm">
            <IconPlaylistAdd size={20} />
            <Text fw={700}>{initialPlaylist ? 'Edit Playlist' : 'New Playlist'}</Text>
            {isDraftSaving && <Text size="sm" c="dimmed">Saving draft…</Text>}
          </Group>
          {selectedSongs.length > 0 && (
            <Button
              size="sm"
              variant="subtle"
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={() => setSelectedSongs([])}
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
            <Group gap="sm" mt="sm">
              <Button size="sm" color="orange" onClick={() => handleContinueDraft(songMapById)}>
                Continue Draft
              </Button>
              <Button size="sm" variant="subtle" color="gray" onClick={handleDiscardDraft}>
                Discard
              </Button>
            </Group>
          </Alert>
        )}

        <TextInput
          label="Playlist Title"
          placeholder="e.g., My DX Grind Set"
          value={title}
          onChange={(e) => updateTitle(e.currentTarget.value)}
          required
          maxLength={50}
        />

        <Divider label={`Songs (${selectedSongs.length})`} labelPosition="center" />

        <Stack gap="sm">
          {selectedSongs.map((song, index) => (
            <PlaylistSongRow
              key={`${song.songId}-${index}`}
              song={song}
              index={index}
              totalSongs={selectedSongs.length}
              moveSong={moveSong}
              handleRemoveSong={handleRemoveSong}
            />
          ))}

          <Button
            variant="light"
            leftSection={<IconPlus size={18} />}
            onClick={() => setIsSongPickerOpen(true)}
            fullWidth
            style={{ borderStyle: 'dashed' }}
            mt="sm"
          >
            Add Song
          </Button>

          {selectedSongs.length === 0 && (
            <Text size="sm" c="dimmed" ta="center" mt="sm">Add some songs to your playlist</Text>
          )}
        </Stack>

        <Textarea
          label="Playlist Comment"
          placeholder="Share something about this playlist..."
          value={comment}
          onChange={(e) => updateComment(e.currentTarget.value)}
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
                  updatePublic(newValue);
                }
              }}
              color="teal"
            />
          )}

          {isPublic && !hidePublicToggle && (
            <Box p="sm" radius="sm" bg="var(--mantine-color-teal-light)" style={{ border: '1px solid var(--mantine-color-teal-outline)' }}>
              <Group gap={4} align="center">
                <Text size="sm" c="teal" fw={500}>
                  This playlist will be visible to everyone in the global feed.
                </Text>
              </Group>
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
          const success = await privatizePlaylist();
          if (success) {
            setIsProtectionModalOpen(false);
            onClose();
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
        }}
      />
    </Modal>
  );
}
