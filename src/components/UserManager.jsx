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
  Tabs,
  ThemeIcon
} from '@mantine/core';
import {
  IconUsers,
  IconEdit,
  IconCheck,
  IconX,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconUserPlus
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { adminService, branchService, requestService, rolesService } from '../services/supabase';
import './UserManager.css';

const AccessRequestsTab = ({ isSuperAdmin, currentUserRoles, keyProp }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const adminBranch = currentUserRoles?.admin_branch;
      const data = await requestService.getPendingRequests(isSuperAdmin ? null : adminBranch);
      setRequests(data);
    } catch (error) {
      console.error("Failed to load requests", error);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, currentUserRoles]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests, keyProp]);

  const handleAction = async (request, action) => {
    try {
      setProcessing(request.id);
      if (action === 'approve') {
        // Fetch current user roles to append permission
        const currentRoles = await rolesService.getUserRoles(request.user_id);
        let currentCanEditOn = currentRoles.can_edit_on || [];

        // Add branch if not present
        if (!currentCanEditOn.includes(request.branch_id)) {
          currentCanEditOn.push(request.branch_id);
          await adminService.updateUserRole(request.user_id, {
            can_edit_on: currentCanEditOn
          });
        }

        await requestService.updateRequestStatus(request.id, 'approved');
        notifications.show({ title: 'Approved', message: 'Access granted.', color: 'green' });
      } else {
        await requestService.updateRequestStatus(request.id, 'rejected');
        notifications.show({ title: 'Rejected', message: 'Request rejected.', color: 'gray' });
      }
      loadRequests();
    } catch (error) {
      notifications.show({ title: 'Error', message: error.message, color: 'red' });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <Stack gap="md" mt="md">
      {loading ? (
        <Center p="xl"><Loader /></Center>
      ) : requests.length === 0 ? (
        <Paper p="xl" withBorder>
          <Center>
            <Text c="dimmed">No pending access requests.</Text>
          </Center>
        </Paper>
      ) : (
        <Paper withBorder>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Branch</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {requests.map(r => (
                <Table.Tr key={r.id}>
                  <Table.Td>
                    <Stack gap={0}>
                      <Text size="sm">{r.user_roles?.display_name || 'Unknown'}</Text>
                      <Text size="xs" c="dimmed">{r.user_roles?.email}</Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Badge>{r.allowed_places?.short_name || r.allowed_places?.arcade_name}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{new Date(r.created_at).toLocaleDateString()}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        color="green"
                        variant="light"
                        loading={processing === r.id}
                        onClick={() => handleAction(r, 'approve')}
                        title="Approve"
                      >
                        <IconCheck size={16} />
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        variant="light"
                        loading={processing === r.id}
                        onClick={() => handleAction(r, 'reject')}
                        title="Reject"
                      >
                        <IconX size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
};

const UserManager = ({ isSuperAdmin = false, currentUserRoles = null, initialTab = 'users' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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
    can_edit_on: [],
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

  useEffect(() => {
    // Only load users if on users tab to save resources, or load initially?
    // Existing logic loaded on mount.
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [loadUsers, activeTab]);

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
      can_edit_on: Array.isArray(user.can_edit_on) ? user.can_edit_on.map(String) : [],
      is_admin: user.is_admin || false,
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

      if (isSuperAdmin) {
        updates.display_name = editForm.display_name;
        updates.is_admin = editForm.is_admin;
        updates.preferred_branches = editForm.preferred_branches.map(Number);
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
    label: b.arcade_name
  }));

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
      <Tabs value={activeTab} onChange={setActiveTab} mb="md">
        <Tabs.List>
          <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>
            Manage Users
          </Tabs.Tab>
          <Tabs.Tab value="requests" leftSection={<IconUserPlus size={16} />}>
            Access Requests
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="users">
          <Stack gap="md" mt="md">
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
                              <Text size="sm" c={user.display_name ? 'inherit' : 'dimmed'} lineClamp={1} title={user.display_name}>
                                {user.display_name || '-'}
                              </Text>
                            </Table.Td>
                            {isSuperAdmin && (
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
                                        const branchName = branch?.short_name || branch?.arcade_name;
                                        if (!branchName) return null;
                                        return (
                                          <Badge key={branchId} size="sm" variant="outline" color="green">
                                            {branchName}
                                          </Badge>
                                        );
                                      })
                                    ) : (
                                      <Text size="sm" c="dimmed">-</Text>
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

                <Text size="xs" c="dimmed" ta="center">
                  Showing {users.length} of {totalCount} users
                </Text>
              </Stack>
            )}
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="requests">
          <AccessRequestsTab
            isSuperAdmin={isSuperAdmin}
            currentUserRoles={currentUserRoles}
            keyProp={activeTab}
          />
        </Tabs.Panel>
      </Tabs>

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
            disabled={!isSuperAdmin}
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
