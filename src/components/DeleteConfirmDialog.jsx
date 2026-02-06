import { Modal, Stack, Text, Button, Group } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

const DeleteConfirmDialog = ({ opened, onClose, onConfirm, title, message, branchName }) => {
  // Backwards compatibility or specific logic for branchName if message is not provided
  const content = message || (
    <>
      <Text style={{ marginTop: '2rem' }}>
        Are you sure you want to delete <Text component="span" fw={700}>{branchName}</Text>?
      </Text>
      <Text size="sm" c="dimmed">
        This action cannot be undone. All associated mall schedules will also be deleted.
      </Text>
    </>
  );

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
        {typeof content === 'string' ? <Text style={{ marginTop: '1rem' }}>{content}</Text> : content}

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={onConfirm}>
            Delete Branch
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default DeleteConfirmDialog;
