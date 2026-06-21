import { useState } from 'react';
import { 
  Modal, 
  Stack, 
  Text, 
  Textarea, 
  Button, 
  Group, 
  Box, 
  TextInput, 
  Switch, 
  Alert,
  UnstyledButton,
  Badge
} from '@mantine/core';
import IconPlus from '@tabler/icons-react/dist/esm/icons/IconPlus.mjs';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import IconPlaylistAdd from '@tabler/icons-react/dist/esm/icons/IconPlaylistAdd.mjs';
import IconFileAlert from '@tabler/icons-react/dist/esm/icons/IconFileAlert.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconMusic from '@tabler/icons-react/dist/esm/icons/IconMusic.mjs';
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
      aria-label={initialPlaylist ? 'Edit Playlist' : 'New Playlist'}
      size="lg"
      radius={24}
      padding={0}
      withCloseButton={false}
      centered
      styles={{
        content: {
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 60px)'
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
            <IconPlaylistAdd size={20} color="var(--theme-primary-contrast)" strokeWidth={2.2} />
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
              {initialPlaylist ? 'Edit Playlist' : 'New Playlist'}
            </Text>
            <Group gap={6} mt={2}>
              <Text size="xs" style={{ color: 'var(--theme-primary-contrast)', opacity: 0.8 }}>
                {initialPlaylist ? 'Update your curated selection' : 'Create a custom collection of charts'}
              </Text>
              {isDraftSaving && (
                <Badge size="xs" color="blue" variant="filled" style={{ fontSize: 9 }}>Saving draft…</Badge>
              )}
            </Group>
          </Box>
        </Group>

        <UnstyledButton
          onClick={onClose}
          disabled={isSaving}
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
            opacity: isSaving ? 0.5 : 1,
            cursor: isSaving ? 'not-allowed' : 'pointer'
          }}
          aria-label="Close"
          className="header-close-pill"
        >
          Cancel
        </UnstyledButton>
      </Box>

      {/* ── Scrollable Body ──────────────────────────────────────── */}
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <Stack gap="lg" p="lg">
          {showDraftAlert && (
            <Alert
              icon={<IconFileAlert size={18} />}
              title="Unsaved draft found"
              color="orange"
              variant="light"
              radius={16}
              withCloseButton
              onClose={handleDiscardDraft}
            >
              <Text size="sm" mb="xs">You have an unsaved draft from a previous session.</Text>
              <Group gap="sm" mt="sm">
                <Button size="xs" color="orange" radius="xl" onClick={() => handleContinueDraft(songMapById)}>
                  Continue Draft
                </Button>
                <Button size="xs" variant="subtle" color="gray" radius="xl" onClick={handleDiscardDraft}>
                  Discard
                </Button>
              </Group>
            </Alert>
          )}

          {/* General Section */}
          <Box
            style={{
              padding: 20,
              borderRadius: 20,
              background: 'var(--theme-surface)',
              border: '1px solid var(--theme-border)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
            }}
          >
            <TextInput
              label="Playlist Title"
              placeholder="e.g., My DX Grind Set"
              value={title}
              onChange={(e) => updateTitle(e.currentTarget.value)}
              required
              maxLength={50}
              styles={{
                input: { borderRadius: 12, fontWeight: 600, background: 'var(--theme-bg-soft)' },
                label: { fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-text-muted)', marginBottom: 6 }
              }}
            />
          </Box>

          {/* Songs Section */}
          <Box
            style={{
              padding: 20,
              borderRadius: 20,
              background: 'var(--theme-surface)',
              border: '1px solid var(--theme-border)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
            }}
          >
            <Group justify="space-between" mb="md">
              <Text fw={800} size="xs" tt="uppercase" style={{ letterSpacing: '0.05em' }} c="var(--theme-text-muted)">
                Songs ({selectedSongs.length})
              </Text>
              {selectedSongs.length > 0 && (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => setSelectedSongs([])}
                  style={{ fontWeight: 700 }}
                >
                  Clear All
                </Button>
              )}
            </Group>

            <Stack gap="xs">
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
                radius="md"
                style={{ borderStyle: 'dashed', height: 44 }}
                mt={selectedSongs.length > 0 ? "xs" : 0}
              >
                Add Song
              </Button>

              {selectedSongs.length === 0 && (
                <Stack align="center" py="md" gap="xs">
                  <IconMusic size={24} c="dimmed" strokeWidth={1.5} />
                  <Text size="xs" c="dimmed" fw={500}>Add some songs to your playlist</Text>
                </Stack>
              )}
            </Stack>
          </Box>

          {/* Comments & Privacy Section */}
          <Box
            style={{
              padding: 20,
              borderRadius: 20,
              background: 'var(--theme-surface)',
              border: '1px solid var(--theme-border)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
            }}
          >
            <Textarea
              label="Playlist Comment"
              placeholder="Share something about this playlist..."
              value={comment}
              onChange={(e) => updateComment(e.currentTarget.value)}
              maxLength={200}
              minRows={3}
              autosize
              styles={{
                input: { borderRadius: 12, fontWeight: 500, fontSize: 14, background: 'var(--theme-bg-soft)' },
                label: { fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-text-muted)', marginBottom: 6 },
                description: { fontSize: 10, marginTop: 4 }
              }}
              description="Tell others why you picked these songs (max 200 chars)"
            />

            {!hidePublicToggle && (
              <Box mt="xl" pt="md" style={{ borderTop: '1px solid var(--theme-border)' }}>
                <Group justify="space-between" align="center">
                  <Box>
                    <Text size="sm" fw={700}>Make Playlist Public</Text>
                    <Text size="xs" c="dimmed">Allow others to view and share this playlist</Text>
                  </Box>
                  <Switch
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
                </Group>

                {isPublic && (
                  <Alert 
                    mt="md" 
                    variant="light" 
                    color="teal" 
                    p="xs" 
                    radius="md"
                    styles={{ body: { padding: 4 }, icon: { marginRight: 8 } }}
                  >
                    <Text size="xs" fw={600}>
                      This playlist will be visible to everyone in the global feed.
                    </Text>
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        </Stack>
      </Box>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <Box 
        p="lg" 
        style={{ 
          borderTop: '1px solid var(--theme-border)',
          background: 'var(--theme-surface)',
          flexShrink: 0
        }}
      >
        <Group justify="flex-end">
          <Button 
            variant="default" 
            onClick={handleCancel} 
            disabled={isSaving}
            radius="xl"
            style={{ fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            loading={isSaving}
            radius="xl"
            leftSection={<IconCheck size={18} />}
            style={{ 
              fontWeight: 700,
              paddingLeft: 24,
              paddingRight: 24,
              boxShadow: '0 4px 12px rgba(var(--theme-primary-rgb), 0.2)'
            }}
          >
            Save Playlist
          </Button>
        </Group>
      </Box>

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
