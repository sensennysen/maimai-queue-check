import { Modal, Stack, Text, Button, Group, Box } from '@mantine/core';
import IconAlertTriangle from '@tabler/icons-react/dist/esm/icons/IconAlertTriangle.mjs';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import IconLock from '@tabler/icons-react/dist/esm/icons/IconLock.mjs';

export function PlaylistProtectionModal({ opened, onClose, onConfirm, type = 'delete', loading = false }) {
  const isDelete = type === 'delete';
  const Icon = isDelete ? IconTrash : IconLock;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="md"
      centered
      padding={0}
      radius={24}
      withCloseButton={false}
      zIndex={3000}
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
      {/* ── Fixed Red Header ─────────────────────────────────────── */}
      <Box
        style={{
          background: 'linear-gradient(135deg, var(--theme-error), color-mix(in srgb, var(--theme-error), var(--theme-primary) 35%))',
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
            <IconAlertTriangle size={18} color="var(--theme-error-contrast)" strokeWidth={2.2} />
          </Box>
          <Box>
            <Text
              size="lg"
              fw={800}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--theme-error-contrast)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              Irreversible Action
            </Text>
            <Text size="xs" style={{ color: 'var(--theme-error-contrast)', opacity: 0.8, marginTop: 2 }}>
              Review action
            </Text>
          </Box>
        </Group>
      </Box>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <Stack gap="md" p="lg">
          <Box
            style={{
              borderRadius: 18,
              padding: '16px',
              background: 'var(--theme-surface)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              border: '1px solid var(--theme-border)',
            }}
          >
            <Stack gap="sm">
              <Text size="sm" fw={600}>
                {isDelete
                  ? "Are you sure you want to delete this playlist?"
                  : "Are you sure you want to make this playlist private?"}
              </Text>

              <Text size="sm" c="dimmed" style={{ lineHeight: 1.5 }}>
                This action is <Text span fw={700} c="red">irreversible</Text>. {isDelete ? "The playlist and all" : "All community"} posts made with this playlist will be deleted from the shared feed.
              </Text>
            </Stack>
          </Box>

          <Group justify="flex-end" gap="sm" pt={4}>
            <Button
              variant="subtle"
              onClick={onClose}
              disabled={loading}
              color="gray"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Cancel
            </Button>
            <Button
              color="red"
              onClick={onConfirm}
              loading={loading}
              leftSection={<Icon size={18} />}
              style={{
                background: 'var(--theme-error)',
                boxShadow: '0 4px 12px color-mix(in srgb, var(--theme-error), transparent 70%)',
              }}
            >
              {isDelete ? "Delete Everything" : "Make Private & Delete Posts"}
            </Button>
          </Group>
        </Stack>
      </Box>
    </Modal>
  );
}
