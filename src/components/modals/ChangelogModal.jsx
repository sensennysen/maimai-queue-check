import { Modal, Text, Stack, Group, Box, UnstyledButton } from '@mantine/core';
import IconHistory from '@tabler/icons-react/dist/esm/icons/IconHistory.mjs';
import { changelogData } from '../../data/changelog';

function ChangelogModal({ opened, onClose }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
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
            <IconHistory size={18} color="var(--theme-primary-contrast)" strokeWidth={2.2} />
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
              Changelogs
            </Text>
            <Text size="xs" style={{ color: 'var(--theme-primary-contrast)', opacity: 0.8, marginTop: 2 }}>
              What's new in mpqCheckPH
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

      {/* ── Scrollable Body ──────────────────────────────────────── */}
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <Stack gap="lg" p="lg">
          {changelogData.map((release, index) => (
            <Box
              key={index}
              style={{
                borderRadius: 18,
                padding: '20px',
                background: 'var(--theme-surface)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                border: '1px solid var(--theme-border)',
              }}
            >
              <Group justify="space-between" mb="md" align="baseline">
                <Text fw={800} size="lg" style={{ color: 'var(--theme-primary)', fontFamily: 'var(--font-heading)' }}>
                  Version {release.version}
                </Text>
                <Text size="sm" c="dimmed" fw={500}>
                  {release.date}
                </Text>
              </Group>

              <Stack gap="xl">
                {release.changes.map((change, i) => {
                  const foot = change.footnote || change.note;
                  return (
                    <Box key={i}>
                      <Group gap="xs" mb={4}>
                        <Box style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--theme-primary)' }} />
                        <Text fw={700} size="md" style={{ letterSpacing: '-0.01em' }}>
                          {change.title}
                        </Text>
                      </Group>
                      <Stack gap={6} pl={14}>
                        <Text size="sm" c="dimmed" lh={1.6} style={{ textAlign: 'justify' }}>
                          {change.description}
                        </Text>
                        {foot && (
                          <Box
                            style={{
                              padding: '8px 12px',
                              background: 'var(--theme-bg-soft)',
                              borderRadius: 10,
                              borderLeft: '3px solid var(--theme-border)'
                            }}
                          >
                            <Text size="xs" c="secondary" fs="italic">
                              {foot}
                            </Text>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
    </Modal>
  );
}

export default ChangelogModal;
