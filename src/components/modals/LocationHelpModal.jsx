import { Modal, Stack, Text, Button, Accordion, List, Group, Badge } from '@mantine/core';
import { IconMapPin, IconBrandChrome, IconBrandFirefox, IconBrandSafari, IconBrandEdge, IconDeviceMobile, IconDeviceDesktop } from '@tabler/icons-react';

/**
 * Modal showing instructions for enabling location in browser settings
 */
function LocationHelpModal({ opened, onClose }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} size="xl">Enable Location in Browser</Text>
      }
      size="lg"
      radius="md"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack gap="lg" py="sm">
        <Text size="md" c="dimmed">
          Location permission was previously denied. Follow these steps to enable it:
        </Text>

        <Accordion variant="separated" defaultValue="chrome">
          {/* Chrome Desktop */}
          <Accordion.Item value="chrome">
            <Accordion.Control icon={<IconBrandChrome size={20} />}>
              <Group gap="xs">
                <Text fw={500}>Chrome</Text>
                <Badge size="xs" variant="light"><IconDeviceDesktop size={12} /> Desktop</Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <List size="sm" spacing="xs" type="ordered">
                <List.Item>Click the <strong>lock icon</strong> (or tune icon) in the address bar</List.Item>
                <List.Item>Find <strong>"Location"</strong> in the permissions list</List.Item>
                <List.Item>Change from "Block" to <strong>"Allow"</strong></List.Item>
                <List.Item>Refresh this page</List.Item>
              </List>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Chrome Mobile */}
          <Accordion.Item value="chrome-mobile">
            <Accordion.Control icon={<IconBrandChrome size={20} />}>
              <Group gap="xs">
                <Text fw={500}>Chrome</Text>
                <Badge size="xs" variant="light"><IconDeviceMobile size={12} /> Mobile</Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <List size="sm" spacing="xs" type="ordered">
                <List.Item>Tap the <strong>lock icon</strong> in the address bar</List.Item>
                <List.Item>Tap <strong>"Permissions"</strong></List.Item>
                <List.Item>Tap <strong>"Location"</strong> and select "Allow"</List.Item>
                <List.Item>Refresh this page</List.Item>
              </List>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Firefox */}
          <Accordion.Item value="firefox">
            <Accordion.Control icon={<IconBrandFirefox size={20} />}>
              <Group gap="xs">
                <Text fw={500}>Firefox</Text>
                <Badge size="xs" variant="light"><IconDeviceDesktop size={12} /> Desktop</Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <List size="sm" spacing="xs" type="ordered">
                <List.Item>Click the <strong>lock icon</strong> in the address bar</List.Item>
                <List.Item>Click <strong>"Connection secure"</strong></List.Item>
                <List.Item>Click <strong>"More information"</strong></List.Item>
                <List.Item>Go to <strong>"Permissions"</strong> tab</List.Item>
                <List.Item>Find "Access Your Location" and change to "Allow"</List.Item>
                <List.Item>Refresh this page</List.Item>
              </List>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Edge */}
          <Accordion.Item value="edge">
            <Accordion.Control icon={<IconBrandEdge size={20} />}>
              <Group gap="xs">
                <Text fw={500}>Microsoft Edge</Text>
                <Badge size="xs" variant="light"><IconDeviceDesktop size={12} /> Desktop</Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <List size="sm" spacing="xs" type="ordered">
                <List.Item>Click the <strong>lock icon</strong> in the address bar</List.Item>
                <List.Item>Click <strong>"Permissions for this site"</strong></List.Item>
                <List.Item>Find <strong>"Location"</strong> and change to "Allow"</List.Item>
                <List.Item>Refresh this page</List.Item>
              </List>
            </Accordion.Panel>
          </Accordion.Item>

          {/* Safari */}
          <Accordion.Item value="safari">
            <Accordion.Control icon={<IconBrandSafari size={20} />}>
              <Group gap="xs">
                <Text fw={500}>Safari</Text>
                <Badge size="xs" variant="light"><IconDeviceDesktop size={12} /> Mac / <IconDeviceMobile size={12} /> iOS</Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Text size="sm" fw={500} mb="xs">On Mac:</Text>
              <List size="sm" spacing="xs" type="ordered" mb="md">
                <List.Item>Go to <strong>Safari → Settings → Websites</strong></List.Item>
                <List.Item>Click <strong>"Location"</strong> in the sidebar</List.Item>
                <List.Item>Find this website and change to "Allow"</List.Item>
                <List.Item>Refresh this page</List.Item>
              </List>
              <Text size="sm" fw={500} mb="xs">On iPhone/iPad:</Text>
              <List size="sm" spacing="xs" type="ordered">
                <List.Item>Go to <strong>Settings → Safari → Location</strong></List.Item>
                <List.Item>Select <strong>"Ask"</strong> or <strong>"Allow"</strong></List.Item>
                <List.Item>Refresh this page in Safari</List.Item>
              </List>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        <Button
          fullWidth
          size="md"
          leftSection={<IconMapPin size={18} />}
          onClick={() => window.location.reload()}
        >
          I've Enabled Location - Reload Page
        </Button>
      </Stack>
    </Modal>
  );
}

export default LocationHelpModal;
