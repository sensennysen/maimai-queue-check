import { useState, useEffect, useCallback } from 'react';
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
  Badge,
  Pagination,
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

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

  // Load branches (once)
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const branchesData = await branchService.getAllBranches();
        setBranches(branchesData);
      } catch (error) {
        console.error('Failed to load branches:', error);
      }
    };
    loadBranches();
  }, []);

  // Load users (on any param change)
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { users: usersData, totalCount: count } = await adminService.getAllUsersForAdmin({
        page: currentPage,
        pageSize,
        searchQuery,
        sortField,
        sortDirection,
      });
      setUsers(usersData);
      setTotalCount(count);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to load users',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, sortField, sortDirection]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page on sort change
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1); // Reset to first page on search change
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
      const updates = {
        display_name: editForm.display_name,
        can_edit: editForm.can_edit,
        preferred_branches: editForm.preferred_branches.map(Number),
      };

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
      loadUsers(); // Reload current page
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
      loadUsers(); // Reload current page
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
      loadUsers(); // Reload current page
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

  const branchOptions = branches.map(b => ({
    value: String(b.id),
    label: b.arcade_name
  }));

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
      <Stack gap="md">
        <TextInput
          placeholder="Search by email or display name..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={handleSearchChange}
        />

        {loading ? (
          <Center p="xl">
            <Loader size="lg" />
          </Center>
        ) : users.length === 0 ? (
          <Paper p="xl" withBorder>
            <Center>
              <Stack align="center" gap="sm">
                <IconUsers size={48} opacity={0.3} />
                <Text c="dimmed">{searchQuery ? 'No users match your search' : 'No users found'}</Text>
              </Stack>
            </Center>
          </Paper>
        ) : (
          <Stack gap="md">
            <Paper withBorder>
              <Table.ScrollContainer minWidth={800}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th
                        style={{ cursor: 'pointer', width: '25%' }}
                        onClick={() => handleSort('email')}
                      >
                        <Group gap="xs">
                          Email
                          <SortIcon field="email" />
                        </Group>
                      </Table.Th>
                      <Table.Th
                        style={{ cursor: 'pointer', width: '20%' }}
                        onClick={() => handleSort('display_name')}
                      >
                        <Group gap="xs">
                          Display Name
                          <SortIcon field="display_name" />
                        </Group>
                      </Table.Th>
                      <Table.Th style={{ width: '35%' }}>Preferred Branches</Table.Th>
                      <Table.Th
                        style={{ cursor: 'pointer', width: '10%' }}
                        onClick={() => handleSort('can_edit')}
                      >
                        <Group gap="xs">
                          Can Edit
                          <SortIcon field="can_edit" />
                        </Group>
                      </Table.Th>
                      {isSuperAdmin && (
                        <Table.Th
                          style={{ cursor: 'pointer', width: '10%' }}
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
                    {users.map((user) => (
                      <Table.Tr key={user.user_id}>
                        <Table.Td>
                          <Text size="sm" lineClamp={1} title={user.email}>{user.email}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c={user.display_name ? 'inherit' : 'dimmed'} lineClamp={1} title={user.display_name}>
                            {user.display_name || '-'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            {user.preferred_branches && user.preferred_branches.length > 0 ? (
                              user.preferred_branches.map((branchId) => {
                                const branch = branches.find(b => b.id === branchId);
                                const branchName = branch?.short_name || branch?.arcade_name;
                                if (!branchName) return null;
                                return (
                                  <Badge key={branchId} size="sm" variant="light" color="blue">
                                    {branchName}
                                  </Badge>
                                );
                              })
                            ) : (
                              <Text size="sm" c="dimmed">-</Text>
                            )}
                          </Group>
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

            {totalPages > 1 && (
              <Group justify="center" mt="md">
                <Pagination
                  total={totalPages}
                  value={currentPage}
                  onChange={setCurrentPage}
                  withEdges
                />
              </Group>
            )}

            <Text size="xs" c="dimmed" ta="center">
              Showing {users.length} of {totalCount} users
            </Text>
          </Stack>
        )}
      </Stack>

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
