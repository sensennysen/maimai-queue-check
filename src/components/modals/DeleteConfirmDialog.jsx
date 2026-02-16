import { Modal, Stack, Text, Button, Group } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

const DeleteConfirmDialog = ({ opened, onClose, onConfirm, title, message, loading, confirmLabel }) => {

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconAlertTriangle size={24} color="red" />
          <Text fw={600}>{title || 'Confirm Deletion'}</Text>
        </Group>
      }
      centered
      size="sm"
    >
      <Stack gap="md">
        {typeof message === 'string' ? <Text style={{ marginTop: '1rem' }}>{message}</Text> : message}

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button color="red" onClick={onConfirm} loading={loading}>
            {confirmLabel || 'Delete Branch'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default DeleteConfirmDialog;
