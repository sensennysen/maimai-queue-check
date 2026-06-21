import { Modal, Stack, Text, Button, List, Box, Group, UnstyledButton } from '@mantine/core';
import IconMapPin from '@tabler/icons-react/dist/esm/icons/IconMapPin.mjs';
import IconX from '@tabler/icons-react/dist/esm/icons/IconX.mjs';

/**
 * Modal component for requesting geolocation consent
 * Styled like Kawaii Tech shell for consistency
 */
function LocationPermissionModal({ opened, onClose, onRequestLocation, onDecline, loading }) {
  const handleDecline = () => {
    if (onDecline) {
      onDecline();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleDecline}
      aria-label="Enable Location Services"
      size="lg"
      radius={24}
      padding={0}
      withCloseButton={false}
      centered
      closeOnClickOutside={false}
      closeOnEscape={!loading}
      styles={{
        content: {
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
        body: {
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
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
            <IconMapPin size={18} color="var(--theme-primary-contrast)" strokeWidth={2.2} />
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
              Enable Location Services
            </Text>
            <Text size="xs" style={{ color: 'var(--theme-primary-contrast)', opacity: 0.8, marginTop: 2 }}>
              Location Access Required
            </Text>
          </Box>
        </Group>

        {!loading && (
          <UnstyledButton
            onClick={handleDecline}
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
            Not Now
          </UnstyledButton>
        )}
      </Box>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <Box p="lg">
        <Stack gap="md">
          <Box
            style={{
              borderRadius: 18,
              padding: '20px',
              background: 'var(--theme-surface)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              border: '1px solid var(--theme-border)',
            }}
          >
            <List
              spacing="lg"
              size="sm"
              center
              icon={
                <Box 
                  style={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: 8, 
                    background: 'var(--theme-bg-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--theme-border)'
                  }}
                >
                  <IconMapPin size={16} color="var(--theme-primary)" />
                </Box>
              }
            >
              <List.Item>
                <Stack gap={2}>
                  <Text fw={700} size="sm">Auto-detect nearest arcade</Text>
                  <Text size="xs" c="dimmed" lh={1.4}>
                    Automatically select the branch closest to you for a seamless experience.
                  </Text>
                </Stack>
              </List.Item>

              <List.Item>
                <Stack gap={2}>
                  <Text fw={700} size="sm">Edit the queue in real-time</Text>
                  <Text size="xs" c="dimmed" lh={1.4}>
                    mpqCheckPH needs your location to verify that you are physically at the branch.
                  </Text>
                </Stack>
              </List.Item>
            </List>
          </Box>

          <Stack gap="sm">
            <Button
              fullWidth
              size="md"
              radius="xl"
              leftSection={<IconMapPin size={18} />}
              onClick={onRequestLocation}
              loading={loading}
              variant="filled"
              color="var(--theme-primary)"
              style={{
                height: 48,
                fontSize: 15,
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(var(--theme-primary-rgb), 0.2)'
              }}
            >
              Enable Location
            </Button>
            <Button
              fullWidth
              size="md"
              radius="xl"
              variant="subtle"
              color="gray"
              leftSection={<IconX size={18} />}
              onClick={handleDecline}
              disabled={loading}
              style={{ fontWeight: 600 }}
            >
              Not Now
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}

export default LocationPermissionModal;
