import { useState, useEffect } from 'react';
import {
  Stack,
  Button,
  Group,
  Text,
  Table,
  ActionIcon,
  Checkbox,
  Loader,
  Center,
  Paper,
  Modal,
  TextInput,
} from '@mantine/core';
import {
  IconUsers,
  IconEdit,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { adminService } from '../services/supabase';
import './UserManager.css';

const UserManager = ({ isSuperAdmin = false }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [editForm, setEditForm] = useState({
    display_name: '',
    can_edit: false,
    is_admin: false,
  });
  const [saving, setSaving] = useState(false);

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsersForAdmin();
      setUsers(data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to load users',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleEditClick = (user) => {
    setUserToEdit(user);
    setEditForm({
      display_name: user.display_name || '',
      can_edit: user.can_edit || false,
      is_admin: user.is_admin || false,
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!userToEdit) return;

    setSaving(true);
    try {
      // Build updates object based on permission level
      const updates = {
        display_name: editForm.display_name,
        can_edit: editForm.can_edit,
      };

      // Only super admins can modify is_admin
      if (isSuperAdmin) {
        updates.is_admin = editForm.is_admin;
      }

      await adminService.updateUserRole(userToEdit.user_id, updates);

      notifications.show({
        title: 'Success',
        message: `User ${userToEdit.email} updated successfully`,
        color: 'green',
      });

      setEditModalOpen(false);
      setUserToEdit(null);
      loadUsers();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update user',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCanEdit = async (user) => {
    try {
      await adminService.updateUserRole(user.user_id, {
        can_edit: !user.can_edit,
      });
      notifications.show({
        title: 'Success',
        message: `${user.email} can ${!user.can_edit ? 'now' : 'no longer'} edit`,
        color: 'green',
      });
      loadUsers();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update user',
        color: 'red',
      });
    }
  };

  const handleToggleIsAdmin = async (user) => {
    if (!isSuperAdmin) return;

    try {
      await adminService.updateUserRole(user.user_id, {
        is_admin: !user.is_admin,
      });
      notifications.show({
        title: 'Success',
        message: `${user.email} is ${!user.is_admin ? 'now' : 'no longer'} an admin`,
        color: 'green',
      });
      loadUsers();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update user',
        color: 'red',
      });
    }
  };

  const handleCloseModal = () => {
    setEditModalOpen(false);
    setUserToEdit(null);
  };

  return (
    <>
      <Stack gap="md">
        {loading ? (
          <Center p="xl">
            <Loader size="lg" />
          </Center>
        ) : users.length === 0 ? (
          <Paper p="xl" withBorder>
            <Center>
              <Stack align="center" gap="sm">
                <IconUsers size={48} opacity={0.3} />
                <Text c="dimmed">No users found</Text>
              </Stack>
            </Center>
          </Paper>
        ) : (
          <Paper withBorder>
            <Table.ScrollContainer minWidth={600}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Display Name</Table.Th>
                    <Table.Th>Can Edit</Table.Th>
                    {isSuperAdmin && <Table.Th>Is Admin</Table.Th>}
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {users.map((user) => (
                    <Table.Tr key={user.user_id}>
                      <Table.Td>
                        <Text size="sm">{user.email}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c={user.display_name ? 'inherit' : 'dimmed'}>
                          {user.display_name || '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Checkbox
                          checked={user.can_edit}
                          onChange={() => handleToggleCanEdit(user)}
                        />
                      </Table.Td>
                      {isSuperAdmin && (
                        <Table.Td>
                          <Checkbox
                            checked={user.is_admin}
                            onChange={() => handleToggleIsAdmin(user)}
                            disabled={user.is_super_admin}
                          />
                        </Table.Td>
                      )}
                      <Table.Td>
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => handleEditClick(user)}
                          title="Edit User"
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        )}
      </Stack>

      {/* Edit User Modal */}
      <Modal
        opened={editModalOpen}
        onClose={handleCloseModal}
        title={
          <Group gap="xs">
            <IconEdit size={20} />
            <Text fw={600}>Edit User</Text>
          </Group>
        }
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Editing: {userToEdit?.email}
          </Text>

          <TextInput
            label="Display Name"
            placeholder="Enter display name"
            value={editForm.display_name}
            onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
          />

          <Checkbox
            label="Can Edit Queue"
            checked={editForm.can_edit}
            onChange={(e) => setEditForm({ ...editForm, can_edit: e.currentTarget.checked })}
          />

          {isSuperAdmin && (
            <Checkbox
              label="Is Admin"
              checked={editForm.is_admin}
              onChange={(e) => setEditForm({ ...editForm, is_admin: e.currentTarget.checked })}
              disabled={userToEdit?.is_super_admin}
            />
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleCloseModal} leftSection={<IconX size={16} />}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} loading={saving} leftSection={<IconCheck size={16} />}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default UserManager;
