import { Modal, Stack, Text, Button, Accordion, List, Group, Badge, Box, UnstyledButton } from '@mantine/core';
import IconMapPin from '@tabler/icons-react/dist/esm/icons/IconMapPin.mjs';
import IconBrandChrome from '@tabler/icons-react/dist/esm/icons/IconBrandChrome.mjs';
import IconBrandFirefox from '@tabler/icons-react/dist/esm/icons/IconBrandFirefox.mjs';
import IconBrandSafari from '@tabler/icons-react/dist/esm/icons/IconBrandSafari.mjs';
import IconDeviceMobile from '@tabler/icons-react/dist/esm/icons/IconDeviceMobile.mjs';
import IconDeviceDesktop from '@tabler/icons-react/dist/esm/icons/IconDeviceDesktop.mjs';

/**
 * Modal showing instructions for enabling location in browser settings
 */
function LocationHelpModal({ opened, onClose }) {
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
              Browser Location Guide
            </Text>
            <Text size="xs" style={{ color: 'var(--theme-primary-contrast)', opacity: 0.8, marginTop: 2 }}>
              Enable Geolocation in Settings
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
          <Box
            style={{
              borderRadius: 18,
              padding: '16px 20px',
              background: 'var(--theme-surface)',
              border: '1px solid var(--theme-border)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}
          >
            <Text size="sm" c="dimmed" lh={1.6}>
              In order to verify your location, we need access to your browser's geolocation. Choose your browser below for step-by-step instructions.
            </Text>
          </Box>

          <Accordion 
            variant="separated" 
            defaultValue="chrome"
            radius={18}
            styles={{
              item: { border: '1px solid var(--theme-border)', background: 'var(--theme-surface)' },
              control: { padding: '16px' },
              label: { fontWeight: 700 },
              content: { paddingBottom: '20px' }
            }}
          >
            {/* Chrome Desktop */}
            <Accordion.Item value="chrome">
              <Accordion.Control icon={<IconBrandChrome size={20} color="var(--theme-primary)" />}>
                <Group gap="xs">
                  <Text size="sm">Google Chrome</Text>
                  <Badge size="xs" variant="light" leftSection={<IconDeviceDesktop size={10} />}>Desktop</Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <List size="sm" spacing="sm" type="ordered">
                  <List.Item>Click the <strong>lock icon</strong> in the address bar</List.Item>
                  <List.Item>Find <strong>"Location"</strong> in the permissions list</List.Item>
                  <List.Item>Change from "Block" to <strong>"Allow"</strong></List.Item>
                  <List.Item>Refresh the page</List.Item>
                </List>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Chrome Mobile */}
            <Accordion.Item value="chrome-mobile">
              <Accordion.Control icon={<IconBrandChrome size={20} color="var(--theme-primary)" />}>
                <Group gap="xs">
                  <Text size="sm">Google Chrome</Text>
                  <Badge size="xs" variant="light" leftSection={<IconDeviceMobile size={10} />}>Mobile</Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <List size="sm" spacing="sm" type="ordered">
                  <List.Item>Tap the <strong>lock icon</strong> in the address bar</List.Item>
                  <List.Item>Tap <strong>"Permissions"</strong> → <strong>"Location"</strong></List.Item>
                  <List.Item>Select <strong>"Allow"</strong></List.Item>
                  <List.Item>Refresh the page</List.Item>
                </List>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Firefox */}
            <Accordion.Item value="firefox">
              <Accordion.Control icon={<IconBrandFirefox size={20} color="#FF7139" />}>
                <Group gap="xs">
                  <Text size="sm">Mozilla Firefox</Text>
                  <Badge size="xs" variant="light" leftSection={<IconDeviceDesktop size={10} />}>Desktop</Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <List size="sm" spacing="sm" type="ordered">
                  <List.Item>Click the <strong>lock icon</strong> → <strong>"Connection secure"</strong></List.Item>
                  <List.Item>Go to <strong>"Permissions"</strong> tab</List.Item>
                  <List.Item>Find <strong>"Access Your Location"</strong> and select <strong>"Allow"</strong></List.Item>
                </List>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Safari */}
            <Accordion.Item value="safari">
              <Accordion.Control icon={<IconBrandSafari size={20} color="#00AEFF" />}>
                <Group gap="sm">
                  <Text size="sm">Apple Safari</Text>
                  <Badge size="xs" variant="light">iOS / Mac</Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="xs">
                  <Text size="xs" fw={700} c="dimmed">On iPhone/iPad:</Text>
                  <List size="sm" spacing="xs" type="ordered">
                    <List.Item>Settings → Safari → Location</List.Item>
                    <List.Item>Select <strong>"Allow"</strong></List.Item>
                  </List>
                  <Text size="xs" fw={700} c="dimmed" mt="xs">On Mac:</Text>
                  <List size="sm" spacing="xs" type="ordered">
                    <List.Item>Safari → Settings → Websites → Location</List.Item>
                    <List.Item>Find this site and select <strong>"Allow"</strong></List.Item>
                  </List>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>

          <Button
            fullWidth
            size="md"
            radius="xl"
            leftSection={<IconMapPin size={18} />}
            onClick={() => window.location.reload()}
            variant="filled"
            color="var(--theme-primary)"
            style={{
              height: 48,
              fontSize: 15,
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(var(--theme-primary-rgb), 0.2)'
            }}
          >
            I've Enabled It - Reload Page
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
}

export default LocationHelpModal;
