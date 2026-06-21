import { useState, useEffect, useCallback } from 'react';
import { Modal, Stack, Button, Select, Textarea, Text, Group, LoadingOverlay, Box, UnstyledButton } from '@mantine/core';
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
      aria-label="Share to Community"
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
      <LoadingOverlay visible={loading || sharing} zIndex={100} overlayProps={{ radius: 'md', blur: 2 }} />

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
            <IconShare size={18} color="var(--theme-primary-contrast)" strokeWidth={2.2} />
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
              Share to Community
            </Text>
            <Text size="xs" style={{ color: 'var(--theme-primary-contrast)', opacity: 0.8, marginTop: 2 }}>
              Let others see your curated collection
            </Text>
          </Box>
        </Group>

        <UnstyledButton
          onClick={onClose}
          disabled={sharing}
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
            opacity: sharing ? 0.5 : 1,
            cursor: sharing ? 'not-allowed' : 'pointer'
          }}
          aria-label="Close"
          className="header-close-pill"
        >
          Cancel
        </UnstyledButton>
      </Box>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <Stack gap="md" p="lg">
          {playlists.length === 0 && !loading ? (
            <Box
              style={{
                borderRadius: 18,
                padding: '16px',
                background: 'color-mix(in srgb, var(--theme-secondary), transparent 93%)',
                border: '1px solid color-mix(in srgb, var(--theme-secondary), transparent 80%)',
                display: 'flex',
                gap: 12,
              }}
            >
              <IconInfoCircle size={18} color="var(--theme-secondary)" style={{ marginTop: 2, flexShrink: 0 }} />
              <Box>
                <Text size="sm" fw={700} color="var(--theme-secondary)" style={{ lineHeight: 1.2 }}>
                  No Public Playlists
                </Text>
                <Text size="xs" color="var(--theme-secondary)" style={{ marginTop: 4, opacity: 0.85 }}>
                  You haven't made any playlists public yet. Go to your profile to make one public before sharing!
                </Text>
              </Box>
            </Box>
          ) : (
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
                  label={<Text size="sm" fw={700} style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.02em' }}>Playlist to Share</Text>}
                  description="Only public playlists appear here"
                  data={playlists.map(p => ({ value: p.id, label: p.title }))}
                  value={selectedPlaylistId}
                  onChange={setSelectedPlaylistId}
                  disabled={sharing}
                  leftSection={<IconPlaylist size={16} />}
                  placeholder="Choose a playlist..."
                  required
                  comboboxProps={{ 
                    withinPortal: false,
                    offset: 4
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

                <Textarea
                  label={<Text size="sm" fw={700} style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.02em' }}>Your Message</Text>}
                  placeholder="What makes this playlist special?"
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.currentTarget.value)}
                  minRows={3}
                  autosize
                  maxLength={300}
                  description={`${shareMessage.length}/300 characters`}
                  disabled={sharing}
                  styles={{
                    input: {
                      borderRadius: 12,
                    }
                  }}
                />
              </Stack>
            </Box>
          )}

          <Group justify="flex-end" gap="sm" pt={4}>
            <Button
              variant="subtle"
              onClick={onClose}
              disabled={sharing}
              color="gray"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleShare}
              loading={sharing}
              disabled={!selectedPlaylistId}
              leftSection={<IconShare size={16} />}
              style={{
                background: 'var(--theme-primary)',
                boxShadow: '0 4px 12px color-mix(in srgb, var(--theme-primary), transparent 70%)',
              }}
            >
              Share Now
            </Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  );
}
