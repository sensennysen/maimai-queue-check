import { Modal, Stack, Group, Text, Button } from '@mantine/core';
import { IconMapPin, IconX } from '@tabler/icons-react';

/**
 * Modal component for requesting geolocation consent
 * Shows an informational modal before triggering the browser's permission prompt
 * 
 * @param {Object} props
 * @param {boolean} props.opened - Whether modal is open
 * @param {() => void} props.onClose - Close handler (same as decline)
 * @param {() => void} props.onRequestLocation - Location request handler (accept)
 * @param {() => void} props.onDecline - Decline handler
 * @param {boolean} props.loading - Whether location check is in progress
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
      title="Enable Location Services"
      centered
      closeOnClickOutside={false}
      closeOnEscape={!loading}
    >
      <Stack gap="md">
        <Group justify="center" style={{ marginTop: '1rem' }}>
          <IconMapPin size={48} color="var(--mantine-color-blue-6)" />
        </Group>

        <Text size="sm" fw={500}>
          Turn on location to enjoy these features:
        </Text>

        <Stack gap="xs" pl="md">
          <Text size="sm" c="dimmed">
            • Auto-detect the nearest arcade branch
          </Text>
          <Text size="sm" c="dimmed">
            • Edit the queue when you're at the arcade
          </Text>
          <Text size="sm" c="dimmed">
            • Manage games and entries in real-time
          </Text>
        </Stack>

        <Text size="xs" c="dimmed" ta="center" mt="xs">
          You must be within 100 meters of the arcade to edit the queue.
          Your location is only used to verify proximity and is not stored.
        </Text>

        <Group justify="center" mt="md" gap="sm">
          <Button
            leftSection={<IconMapPin size={16} />}
            onClick={onRequestLocation}
            loading={loading}
          >
            Enable Location
          </Button>
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconX size={16} />}
            onClick={handleDecline}
            disabled={loading}
          >
            Not Now
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default LocationPermissionModal;
