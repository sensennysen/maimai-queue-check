import { useState, useEffect, useCallback } from 'react';
import { Modal, Stack, Button, Select, Textarea, Text, Group, LoadingOverlay, Box, Alert } from '@mantine/core';
import IconShare from '@tabler/icons-react/dist/esm/icons/IconShare.mjs';
import IconInfoCircle from '@tabler/icons-react/dist/esm/icons/IconInfoCircle.mjs';
import IconPlaylist from '@tabler/icons-react/dist/esm/icons/IconPlaylist.mjs';
import { notifications } from '@mantine/notifications';
import { playlistService } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';

export function GlobalSharePlaylistModal({
  opened,
  onClose,
  onSuccess
}) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [shareMessage, setShareMessage] = useState('');

  const loadPublicPlaylists = useCallback(async () => {
    try {
      setLoading(true);
      const data = await playlistService.getPlaylists(user.id);
      // Only allow sharing public playlists
      const publicPlaylists = data.filter(p => p.is_public);
      setPlaylists(publicPlaylists);

      if (publicPlaylists.length > 0 && !selectedPlaylistId) {
        setSelectedPlaylistId(publicPlaylists[0].id);
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
  }, [user?.id, selectedPlaylistId]);

  useEffect(() => {
    if (opened && user) {
      loadPublicPlaylists();
    } else if (!opened) {
      // Reset state on close
      setSelectedPlaylistId(null);
      setShareMessage('');
    }
  }, [opened, user, loadPublicPlaylists]);

  const handleShare = async () => {
    if (!selectedPlaylistId) return;

    try {
      setSharing(true);
      await playlistService.sharePlaylist(user.id, selectedPlaylistId, shareMessage.trim());

      notifications.show({
        title: 'Success',
        message: 'Playlist shared to community!',
        color: 'green',
        icon: <IconShare size={16} />
      });

      if (onSuccess) onSuccess();
      onClose();

    } catch (error) {
      console.error('Failed to share playlist', error);
      notifications.show({
        title: 'Error',
        message: 'Could not share playlist to community',
        color: 'red'
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconShare size={20} style={{ color: 'var(--theme-primary)' }} />
          <Text fw={600} size="lg">Share to Community</Text>
        </Group>
      }
      centered
      size="md"
      radius="md"
      classNames={{ content: 'profile-modal-pop' }}
    >
      <Box pos="relative">
        <LoadingOverlay visible={loading} zIndex={100} />

        <Stack gap="md" mt="xs">
          {playlists.length === 0 && !loading ? (
            <Alert icon={<IconInfoCircle size={16} />} title="No Public Playlists" color="blue" radius="md">
              <Text size="sm">
                You haven't made any playlists public yet. Go to your profile playlists to make one public before sharing!
              </Text>
            </Alert>
          ) : (
            <>
              <Select
                label="Select Playlist"
                description="Only your public playlists can be shared"
                data={playlists.map(p => ({ value: p.id, label: p.title }))}
                value={selectedPlaylistId}
                onChange={setSelectedPlaylistId}
                disabled={sharing}
                leftSection={<IconPlaylist size={16} />}
                placeholder="Choose a playlist to share"
                required
                comboboxProps={{ withinPortal: false }}
              />

              <Textarea
                label="Message (Optional)"
                placeholder="Talk about your playlist..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.currentTarget.value)}
                minRows={3}
                autosize
                maxLength={300}
                description={`${shareMessage.length}/300 characters`}
                disabled={sharing}
              />

              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={onClose} disabled={sharing}>
                  Cancel
                </Button>
                <Button
                  onClick={handleShare}
                  loading={sharing}
                  disabled={!selectedPlaylistId}
                  leftSection={<IconShare size={16} />}
                >
                  Share Now
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Box>
    </Modal>
  );
}
