import { Modal, Stack, Text, Button, List } from '@mantine/core';
import { IconMapPin, IconX } from '@tabler/icons-react';

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
          <Text fw={600} size="lg" c="dimmed" mb="sm">
            Why we need your location
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
                <Text size="md" c="dimmed" lh={1.6}>
                  Add, remove, or manage queue entries when you're at the arcade.
                </Text>
              </Stack>
            </List.Item>

            <List.Item>
              <Stack gap={6}>
                <Text fw={600} size="lg">Proximity verification</Text>
                <Text size="md" c="dimmed" lh={1.6}>
                  You must be within 100 meters of the arcade to edit the queue.
                </Text>
                <Text size="sm" c="dimmed" fs="italic" mt={2} lh={1.5}>
                  * Your location is only used to verify proximity and is never stored.
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
