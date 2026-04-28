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
  Select,
  Badge,
  Pagination,
} from '@mantine/core';
import IconUsers from '@tabler/icons-react/dist/esm/icons/IconUsers.mjs';
import IconEdit from '@tabler/icons-react/dist/esm/icons/IconEdit.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconX from '@tabler/icons-react/dist/esm/icons/IconX.mjs';
import IconSearch from '@tabler/icons-react/dist/esm/icons/IconSearch.mjs';
import IconSortAscending from '@tabler/icons-react/dist/esm/icons/IconSortAscending.mjs';
import IconSortDescending from '@tabler/icons-react/dist/esm/icons/IconSortDescending.mjs';
import { notifications } from '@mantine/notifications';
import { Link } from 'react-router-dom';
import { adminService, subscribeToUserRoleChanges, supabase } from '../../../services/supabase';
import { useBranch } from '../../../contexts/BranchContext';
import './UserManager.css';

const UserTable = ({ isSuperAdmin, currentUserRoles }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { branches } = useBranch();

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
    queue_name: '',
    can_edit: false,
    can_edit_on: [],
    is_admin: false,
    admin_branch: null,
    preferred_branches: [],
  });
  const [saving, setSaving] = useState(false);

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
        adminBranch: isSuperAdmin ? null : currentUserRoles?.admin_branch
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
  }, [currentPage, searchQuery, sortField, sortDirection, isSuperAdmin, currentUserRoles?.admin_branch]);

  // Subscribe to user role changes
  useEffect(() => {
    const channel = subscribeToUserRoleChanges(() => {
      // Reload users when any user role changes
      loadUsers();
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadUsers]);

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
      queue_name: user.queue_name || '',
      can_edit: user.can_edit || false,
      can_edit_on: Array.isArray(user.can_edit_on) ? user.can_edit_on.map(String) : [],
      is_admin: user.is_admin || false,
      admin_branch: user.admin_branch ? String(user.admin_branch) : null,
      preferred_branches: user.preferred_branches ? user.preferred_branches.map(String) : [],
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!userToEdit) return;

    setSaving(true);
    const adminBranch = currentUserRoles?.admin_branch;

    // Check permission: Super Admin OR (Admin AND user in branch)
    const hasBranchPermission = isSuperAdmin || (adminBranch && userToEdit.preferred_branches?.includes(adminBranch));

    if (!hasBranchPermission) {
      notifications.show({
        title: 'Permission Denied',
        message: 'You can only manage users in your assigned branch.',
        color: 'red',
      });
      setSaving(false);
      return;
    }

    try {
      const updates = {};
      const profileUpdates = {};

      if (isSuperAdmin) {
        updates.queue_name = editForm.queue_name;
        updates.is_admin = editForm.is_admin;
        updates.admin_branch = editForm.admin_branch ? parseInt(editForm.admin_branch, 10) : null;
        profileUpdates.preferred_branches = editForm.preferred_branches.map(String);
        updates.can_edit = editForm.can_edit;
        updates.can_edit_on = editForm.can_edit_on.map(Number);
      } else {
        // Regular Admin Logic
        const originalBranches = userToEdit.can_edit_on || [];
        const newBranchesEncoded = editForm.can_edit_on.map(Number);

        // Ensure we only touched `adminBranch`
        const isOriginallyIn = originalBranches.includes(adminBranch);
        const isNowIn = newBranchesEncoded.includes(adminBranch);

        if (isOriginallyIn !== isNowIn) {
          let finalBranches = [...originalBranches];
          if (isNowIn) {
            if (!finalBranches.includes(adminBranch)) finalBranches.push(adminBranch);
          } else {
            finalBranches = finalBranches.filter(id => id !== adminBranch);
          }
          updates.can_edit_on = finalBranches;
        }
      }

      await adminService.updateUserRole(userToEdit.user_id, updates);

      if (isSuperAdmin) {
        await adminService.updateUserProfileAdmin(userToEdit.user_id, profileUpdates);
      }

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

  const handleToggleCanEditGlobal = async (user) => {
    if (!isSuperAdmin) return;
    try {
      await adminService.updateUserRole(user.user_id, {
        can_edit: !user.can_edit,
      });
      notifications.show({
        title: 'Success',
        message: `Updated global edit permission for ${user.email}`,
        color: 'green',
      });
      loadUsers();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
    }
  };

  const handleToggleCanEditBranch = async (user) => {
    const adminBranch = currentUserRoles?.admin_branch;
    if (!adminBranch) return;

    const hasBranchPermission = isSuperAdmin || (user.preferred_branches?.includes(adminBranch));
    if (!hasBranchPermission) {
      notifications.show({ title: 'Permission Denied', color: 'red' });
      return;
    }

    const currentBranches = user.can_edit_on || [];
    const isAllowed = currentBranches.includes(adminBranch);

    let newBranches;
    if (isAllowed) {
      newBranches = currentBranches.filter(id => id !== adminBranch);
    } else {
      newBranches = [...currentBranches, adminBranch];
    }

    try {
      await adminService.updateUserRole(user.user_id, {
        can_edit_on: newBranches,
      });
      notifications.show({
        title: 'Success',
        message: `Updated branch edit permission for ${user.email}`,
        color: 'green',
      });
      loadUsers();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message,
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

  const branchOptions = branches.map(b => ({
    value: String(b.id),
    label: b.short_name || b.arcade_name
  }));

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
      <Group justify="space-between">
        <TextInput
          placeholder="Search by email or queue name..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={handleSearchChange}
          style={{ flex: 1, maxWidth: 300 }}
        />
      </Group>

      {loading ? (
        <Center p="xl">
          <Loader size="lg" />
        </Center>
      ) : users.length === 0 ? (
        <Paper p="xl" withBorder mt="md">
          <Center>
            <Stack align="center" gap="sm">
              <IconUsers size={48} opacity={0.3} />
              <Text c="secondary" fw={500}>{searchQuery ? 'No users match your search' : 'No users found'}</Text>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <Stack gap="md" mt="md">
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
                      onClick={() => handleSort('queue_name')}
                    >
                      <Group gap="xs">
                        Queue Name
                        <SortIcon field="queue_name" />
                      </Group>
                    </Table.Th>
                    {isSuperAdmin && <Table.Th style={{ width: '30%' }}>Preferred Branches</Table.Th>}
                    {isSuperAdmin ? (
                      <>
                        <Table.Th style={{ width: '10%' }}>Global Edit</Table.Th>
                        <Table.Th style={{ width: '30%' }}>Edit on Branches</Table.Th>
                      </>
                    ) : (
                      <Table.Th style={{ width: '10%' }}>Can Edit</Table.Th>
                    )}

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
                        {user.slug ? (
                          <Text
                            size="sm"
                            component={Link}
                            to={`/p/${user.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            c="blue"
                            style={{ textDecoration: 'none', cursor: 'pointer' }}
                            lineClamp={1}
                            title={`View profile: ${user.queue_name || '-'}`}
                          >
                            {user.queue_name || '-'}
                          </Text>
                        ) : (
                          <Text size="sm" c={user.queue_name ? 'inherit' : 'secondary'} lineClamp={1} title={user.queue_name}>
                            {user.queue_name || '-'}
                          </Text>
                        )}
                      </Table.Td>
                      {isSuperAdmin && (
                        <Table.Td>
                          <Group gap={4}>
                            {user.preferred_branches && user.preferred_branches.length > 0 ? (
                              user.preferred_branches.map((branchId) => {
                                const branch = branches.find(b => b.id === branchId);
                                const branchName = branch?.acronym || branch?.short_name;
                                if (!branchName) return null;
                                return (
                                  <Badge key={branchId} size="sm" variant="light" color="blue">
                                    {branchName}
                                  </Badge>
                                );
                              })
                            ) : (
                              <Text size="sm" c="secondary">-</Text>
                            )}
                          </Group>
                        </Table.Td>
                      )}
                      {isSuperAdmin ? (
                        <>
                          <Table.Td>
                            <Checkbox
                              checked={user.can_edit}
                              onChange={() => handleToggleCanEditGlobal(user)}
                            />
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4}>
                              {user.can_edit_on && user.can_edit_on.length > 0 ? (
                                user.can_edit_on.map((branchId) => {
                                  const branch = branches.find(b => b.id === branchId);
                                  const branchName = branch?.acronym || branch?.short_name;
                                  if (!branchName) return null;
                                  return (
                                    <Badge key={branchId} size="sm" variant="outline" color="green">
                                      {branchName}
                                    </Badge>
                                  );
                                })
                              ) : (
                                <Text size="sm" c="secondary">-</Text>
                              )}
                            </Group>
                          </Table.Td>
                        </>
                      ) : (
                        <Table.Td>
                          <Checkbox
                            checked={user.can_edit_on?.includes(currentUserRoles?.admin_branch)}
                            onChange={() => handleToggleCanEditBranch(user)}
                          />
                        </Table.Td>
                      )}
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

          <Text size="sm" c="secondary" ta="center">
            Showing {users.length} of {totalCount} users
          </Text>
        </Stack>
      )}

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
          <Text size="sm" c="secondary" fw={500} style={{ marginTop: '1rem' }}>
            Editing: {userToEdit?.email}
          </Text>

          <TextInput
            label="Queue Name"
            placeholder="Enter queue name"
            value={editForm.queue_name}
            onChange={(e) => {
              const val = e.target.value;
              const filtered = val.replace(/[^a-zA-Z0-9 @#!\-_.,&'()]/g, '');
              setEditForm({ ...editForm, queue_name: filtered });
            }}
            disabled={!isSuperAdmin}
            maxLength={10}
          />

          {isSuperAdmin && (
            <MultiSelect
              label="Preferred Branches"
              placeholder="Select one or more branches"
              data={branchOptions}
              value={editForm.preferred_branches}
              onChange={(selected) => setEditForm({ ...editForm, preferred_branches: selected })}
              searchable
              clearable
              disabled={!isSuperAdmin}
              comboboxProps={{ withinPortal: false }}
            />
          )}

          <Group grow align="flex-start">
            {isSuperAdmin ? (
              <Stack gap="xs">
                <Checkbox
                  label="Can Edit Anywhere"
                  checked={editForm.can_edit}
                  onChange={(e) => setEditForm({ ...editForm, can_edit: e.currentTarget.checked })}
                />
                <MultiSelect
                  label="Can Edit on Branches"
                  placeholder="Select branches"
                  data={branchOptions}
                  value={editForm.can_edit_on.map(String)}
                  onChange={(selected) => setEditForm({ ...editForm, can_edit_on: selected.map(Number) })}
                  searchable
                  clearable
                  comboboxProps={{ withinPortal: false }}
                />
              </Stack>
            ) : (
              <Checkbox
                label="Can Edit Queue"
                checked={editForm.can_edit_on.includes(currentUserRoles?.admin_branch)}
                onChange={(e) => {
                  const checked = e.currentTarget.checked;
                  const adminBranch = currentUserRoles?.admin_branch;
                  let newBranches = [...editForm.can_edit_on];
                  if (checked) {
                    if (!newBranches.includes(adminBranch)) newBranches.push(adminBranch);
                  } else {
                    newBranches = newBranches.filter(id => id !== adminBranch);
                  }
                  setEditForm({ ...editForm, can_edit_on: newBranches });
                }}
              />
            )}

            {isSuperAdmin && (
              <Stack gap="xs">
                <Checkbox
                  label="Is Admin"
                  checked={editForm.is_admin}
                  onChange={(e) => setEditForm({ ...editForm, is_admin: e.currentTarget.checked })}
                  disabled={userToEdit?.is_super_admin}
                />
                {editForm.is_admin && (
                  <Select
                    label="Admin Branch"
                    placeholder="Select branch this user is admin of"
                    data={branchOptions}
                    value={editForm.admin_branch}
                    onChange={(val) => setEditForm({ ...editForm, admin_branch: val })}
                    searchable
                    clearable
                    comboboxProps={{ withinPortal: false }}
                  />
                )}
              </Stack>
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

export default UserTable;
