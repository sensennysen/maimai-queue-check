import { useState, useEffect } from 'react';
import {
  Group,
  ActionIcon,
  Box,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
  Text,
  Button,
  Modal,
  Stack
} from '@mantine/core';
import IconArrowUp from '@tabler/icons-react/dist/esm/icons/IconArrowUp.mjs';
import IconArrowDown from '@tabler/icons-react/dist/esm/icons/IconArrowDown.mjs';
import IconPlaylist from '@tabler/icons-react/dist/esm/icons/IconPlaylist.mjs';
import IconSelector from '@tabler/icons-react/dist/esm/icons/IconSelector.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
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
      aria-label="Manage Display Order"
      size="md"
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
            <IconSelector size={18} color="var(--theme-primary-contrast)" strokeWidth={2.2} />
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
              Manage Display Order
            </Text>
            <Text size="xs" style={{ color: 'var(--theme-primary-contrast)', opacity: 0.8, marginTop: 2 }}>
              Rearrange how your playlists appear on your profile
            </Text>
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
          Close
        </UnstyledButton>
      </Box>

      {/* ── Scrollable Body ──────────────────────────────────────── */}
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <Stack gap="lg" p="lg">
          <Box
            style={{
              padding: 4,
              borderRadius: 18,
              background: 'var(--theme-surface)',
              border: '1px solid var(--theme-border)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
            }}
          >
            <Stack gap={4}>
              {playlists.map((pl, index) => (
                <Box
                  key={pl.id}
                  p="sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    borderRadius: 14,
                    background: index % 2 === 0 ? 'transparent' : 'var(--theme-bg-soft)',
                  }}
                >
                  <ThemeIcon variant="light" color="gray" size={32} radius="md">
                    <IconPlaylist size={18} />
                  </ThemeIcon>

                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" fw={700} truncate>{pl.title}</Text>
                    <Text size="xs" c="dimmed" fw={600}>
                      {pl.songs?.length || 0} {(pl.songs?.length || 0) === 1 ? 'Song' : 'Songs'}
                    </Text>
                  </Box>

                  <Group gap={4}>
                    <Tooltip label="Move Up" position="left" openDelay={500}>
                      <ActionIcon
                        variant="light"
                        color="gray"
                        radius="md"
                        onClick={() => movePlaylist(index, -1)}
                        disabled={index === 0 || isSaving}
                      >
                        <IconArrowUp size={16} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Move Down" position="left" openDelay={500}>
                      <ActionIcon
                        variant="light"
                        color="gray"
                        radius="md"
                        onClick={() => movePlaylist(index, 1)}
                        disabled={index === playlists.length - 1 || isSaving}
                      >
                        <IconArrowDown size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Box>
              ))}

              {playlists.length === 0 && (
                <Stack align="center" py="xl" gap="xs">
                  <IconPlaylist size={32} c="dimmed" strokeWidth={1} />
                  <Text size="sm" c="dimmed" fw={500}>No playlists to manage</Text>
                </Stack>
              )}
            </Stack>
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
            onClick={onClose}
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
            Save Order
          </Button>
        </Group>
      </Box>
    </Modal>
  );
}
