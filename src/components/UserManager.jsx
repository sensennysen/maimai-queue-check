import { useState, useEffect, useMemo } from 'react';
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
  MultiSelect,
} from '@mantine/core';
import {
  IconUsers,
  IconEdit,
  IconCheck,
  IconX,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { adminService, branchService } from '../services/supabase';
import './UserManager.css';

const UserManager = ({ isSuperAdmin = false }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);

  // Search and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('email');
  const [sortDirection, setSortDirection] = useState('asc');

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [editForm, setEditForm] = useState({
    display_name: '',
    can_edit: false,
    is_admin: false,
    preferred_branches: [],
  });
  const [saving, setSaving] = useState(false);

  // Load users and branches
  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, branchesData] = await Promise.all([
        adminService.getAllUsersForAdmin(),
        branchService.getAllBranches(),
      ]);
      setUsers(usersData);
      setBranches(branchesData);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to load data',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (user) =>
          user.email?.toLowerCase().includes(query) ||
          user.display_name?.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField] ?? '';
      let bVal = b[sortField] ?? '';

      // Handle boolean fields
      if (typeof aVal === 'boolean') {
        aVal = aVal ? 1 : 0;
        bVal = bVal ? 1 : 0;
      }

      // Handle string comparison
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchQuery, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <IconSortAscending size={14} />
    ) : (
      <IconSortDescending size={14} />
    );
  };

  const handleEditClick = (user) => {
    setUserToEdit(user);
    setEditForm({
      display_name: user.display_name || '',
      can_edit: user.can_edit || false,
      is_admin: user.is_admin || false,
      preferred_branches: user.preferred_branches ? user.preferred_branches.map(String) : [],
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
        preferred_branches: editForm.preferred_branches.map(Number), // Convert back to numbers
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

      // Reload users to get fresh data
      const usersData = await adminService.getAllUsersForAdmin();
      setUsers(usersData);
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

      // Reload users to get fresh data
      const usersData = await adminService.getAllUsersForAdmin();
      setUsers(usersData);
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

      // Reload users to get fresh data
      const usersData = await adminService.getAllUsersForAdmin();
      setUsers(usersData);
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

  // Helper to get branch names from IDs
  const getBranchNames = (branchIds) => {
    if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) return '-';

    return branchIds
      .map(id => branches.find(b => b.id === id)?.arcade_name)
      .filter(Boolean)
      .join(', ');
  };

  // Branch options for MultiSelect
  const branchOptions = branches.map(b => ({
    value: String(b.id),
    label: b.arcade_name
  }));

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
          <Stack gap="md">
            <TextInput
              placeholder="Search by email or display name..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Paper withBorder>
              <Table.ScrollContainer minWidth={800}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('email')}
                      >
                        <Group gap="xs">
                          Email
                          <SortIcon field="email" />
                        </Group>
                      </Table.Th>
                      <Table.Th
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleSort('display_name')}
                      >
                        <Group gap="xs">
                          Display Name
                          <SortIcon field="display_name" />
                        </Group>
                      </Table.Th>
                      <Table.Th>Preferred Branches</Table.Th>
                      <Table.Th
                        style={{ cursor: 'pointer', width: '100px' }}
                        onClick={() => handleSort('can_edit')}
                      >
                        <Group gap="xs">
                          Can Edit
                          <SortIcon field="can_edit" />
                        </Group>
                      </Table.Th>
                      {isSuperAdmin && (
                        <Table.Th
                          style={{ cursor: 'pointer', width: '100px' }}
                          onClick={() => handleSort('is_admin')}
                        >
                          <Group gap="xs">
                            Is Admin
                            <SortIcon field="is_admin" />
                          </Group>
                        </Table.Th>
                      )}
                      <Table.Th style={{ width: '80px' }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredAndSortedUsers.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={isSuperAdmin ? 6 : 5}>
                          <Center py="md">
                            <Text c="dimmed">No users match your search</Text>
                          </Center>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      filteredAndSortedUsers.map((user) => (
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
                            <Text size="sm" lineClamp={2} title={getBranchNames(user.preferred_branches)}>
                              {getBranchNames(user.preferred_branches)}
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
                      ))
                    )}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Paper>
          </Stack>
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
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed" style={{ marginTop: '1rem' }}>
            Editing: {userToEdit?.email}
          </Text>

          <TextInput
            label="Display Name"
            placeholder="Enter display name"
            value={editForm.display_name}
            onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
          />

          <MultiSelect
            label="Preferred Branches"
            placeholder="Select one or more branches"
            data={branchOptions}
            value={editForm.preferred_branches}
            onChange={(selected) => setEditForm({ ...editForm, preferred_branches: selected })}
            searchable
            clearable
          />

          <Group grow>
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
          </Group>

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
