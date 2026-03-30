import { Modal, Stack, Group, Text, SegmentedControl, Box, UnstyledButton } from '@mantine/core';
import IconPalette from '@tabler/icons-react/dist/esm/icons/IconPalette.mjs';
import { useTheme } from '../../contexts/ThemeContext';

const PreferencesModal = ({ opened, onClose }) => {
  const { currentTheme, setTheme } = useTheme();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
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
      {/* ── Fixed Header ─────────────────────────────────────────── */}
      <Box
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
            <IconPalette size={18} color="var(--theme-primary-contrast)" strokeWidth={2.2} />
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
              App Settings
            </Text>
            <Text size="xs" style={{ color: 'var(--theme-primary-contrast)', opacity: 0.8, marginTop: 2 }}>
              Personalize your experience
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
          className="header-close-pill"
        >
          Close
        </UnstyledButton>
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
            <Stack gap="xs">
              <Text size="sm" fw={700} style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.02em' }}>
                App Theme
              </Text>
              <SegmentedControl
                fullWidth
                value={currentTheme}
                onChange={(val) => setTheme(val)}
                radius="xl"
                data={[
                  { label: 'Circle', value: 'circle' },
                  { label: 'Prism', value: 'prism' },
                  { label: 'Buddies', value: 'buddies' },
                  { label: 'Festival', value: 'festival' },
                  { label: 'Universe', value: 'universe' },
                ]}
                styles={{
                  root: {
                    background: 'var(--theme-bg-soft)',
                    padding: 4,
                  },
                  indicator: {
                    background: 'var(--theme-surface)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  },
                  label: {
                    fontWeight: 700,
                    fontSize: 13,
                    color: 'var(--theme-text-muted)',
                    transition: 'all 0.2s ease',
                    '&[data-active]': {
                      color: 'var(--theme-text-primary) !important',
                    }
                  }
                }}
              />
            </Stack>
          </Box>

          <Text size="xs" ta="center" c="dimmed" mt="xs">
            Theme changes are applied immediately
          </Text>
        </Stack>
      </Box>
    </Modal>
  );
};

export default PreferencesModal;
