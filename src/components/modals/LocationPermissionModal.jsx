import { Modal, Stack, Text, Button, List } from '@mantine/core';
import IconMapPin from '@tabler/icons-react/dist/esm/icons/IconMapPin.mjs';
import IconX from '@tabler/icons-react/dist/esm/icons/IconX.mjs';

/**
 * Modal component for requesting geolocation consent
 * Styled like ChangelogModal for consistency
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
      title={
        <Text fw={700} size="xl">Enable Location Services</Text>
      }
      size="lg"
      radius="md"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      closeOnClickOutside={false}
      closeOnEscape={!loading}
    >
      <Stack gap="xl" py="sm">
        <div>
          <Text fw={600} size="lg" c="secondary" mb="sm">
            Location Access Required
          </Text>

          <List
            spacing="lg"
            size="lg"
            withPadding
            icon={<IconMapPin size={18} color="var(--mantine-color-blue-6)" />}
          >
            <List.Item>
              <Stack gap={6}>
                <Text fw={600} size="lg">Auto-detect nearest arcade</Text>
                <Text size="md" c="dimmed" lh={1.6}>
                  Automatically select the branch closest to you for a seamless experience.
                </Text>
              </Stack>
            </List.Item>

            <List.Item>
              <Stack gap={6}>
                <Text fw={600} size="lg">Edit the queue in real-time</Text>
                <Text size="md" c="secondary" lh={1.6}>
                  "The Maimai SMF Queue Check needs your location to verify that you are physically at the branch."
                </Text>
              </Stack>
            </List.Item>

            <List.Item>
              <Stack gap={6}>
                <Text fw={600} size="lg">Proximity verification</Text>
                <Text size="md" c="secondary" lh={1.6}>
                  "This site would like to access your location"
                </Text>
                <Text size="sm" c="secondary" fs="italic" mt={2} lh={1.5}>
                  (You can always change this in your browser settings later)
                </Text>
              </Stack>
            </List.Item>
          </List>
        </div>

        <Stack gap="sm">
          <Button
            fullWidth
            size="md"
            leftSection={<IconMapPin size={18} />}
            onClick={onRequestLocation}
            loading={loading}
          >
            Enable Location
          </Button>
          <Button
            fullWidth
            size="md"
            variant="subtle"
            color="gray"
            leftSection={<IconX size={18} />}
            onClick={handleDecline}
            disabled={loading}
          >
            Not Now
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}

export default LocationPermissionModal;
