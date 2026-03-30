import { Modal, Stack, Text, Button, Group } from '@mantine/core';
import IconAlertTriangle from '@tabler/icons-react/dist/esm/icons/IconAlertTriangle.mjs';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import IconLock from '@tabler/icons-react/dist/esm/icons/IconLock.mjs';

export function PlaylistProtectionModal({ opened, onClose, onConfirm, type = 'delete', loading = false }) {
  const isDelete = type === 'delete';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconAlertTriangle size={24} color="var(--theme-error, #fa5252)" />
          <Text fw={700} size="lg">Irreversible Action</Text>
        </Group>
      }
      centered
      size="md"
      radius="md"
      zIndex={3000}
      classNames={{ content: 'profile-modal-pop' }}
    >
      <Stack gap="md" py="xs">
        <Text size="sm" fw={500}>
          {isDelete
            ? "Are you sure you want to delete this playlist?"
            : "Are you sure you want to make this playlist private?"}
        </Text>

        <Text size="sm" c="dimmed">
          This action is <Text span fw={700} c="red">irreversible</Text>. {isDelete ? "The playlist and all" : "All community"} posts made with this playlist will be deleted from the shared feed.
        </Text>

        <Group justify="flex-end" mt="lg">
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={onConfirm}
            loading={loading}
            leftSection={isDelete ? <IconTrash size={18} /> : <IconLock size={18} />}
          >
            {isDelete ? "Delete Everything" : "Make Private & Delete Posts"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
