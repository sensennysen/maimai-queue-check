import { Modal, Stack, Group, Text, Button } from '@mantine/core';
import { IconMapPin } from '@tabler/icons-react';

/**
 * Modal component for requesting location permission
 * @param {Object} props
 * @param {boolean} props.opened - Whether modal is open
 * @param {() => void} props.onClose - Close handler
 * @param {() => void} props.onRequestLocation - Location request handler
 * @param {boolean} props.loading - Whether location check is in progress
 */
function LocationPermissionModal({ opened, onClose, onRequestLocation, loading }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Location Permission Required"
      centered
    >
      <Stack gap="md">
        <Group justify="center">
          <IconMapPin size={48} color="var(--mantine-color-blue-6)" />
        </Group>
        <Text size="sm" ta="center">
          To enable editing the queue, we need to verify your location.
        </Text>
        <Text size="xs" c="dimmed" ta="center">
          You must be within 100 meters of the arcade to edit the queue.
        </Text>
        <Group justify="center" mt="md">
          <Button
            leftSection={<IconMapPin size={16} />}
            onClick={onRequestLocation}
            loading={loading}
          >
            Enable Location Services
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Not Now
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default LocationPermissionModal;
