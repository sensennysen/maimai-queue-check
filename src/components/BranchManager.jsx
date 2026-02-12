import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Button,
  Group,
  Title,
  Text,
  Table,
  ActionIcon,
  Checkbox,
  Badge,
  Loader,
  Center,
  Paper,
} from '@mantine/core';
import {
  IconBuildingStore,
  IconEdit,
  IconCalendar,
  IconTrash,
  IconPlus,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { adminService } from '../services/supabase';
import AdminPanel from './AdminPanel';
import ScheduleEditor from './ScheduleEditor';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import './BranchManager.css';

const BranchManager = ({ opened, onClose }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Edit states
  const [editMode, setEditMode] = useState('create'); // 'create' or 'edit'
  const [branchToEdit, setBranchToEdit] = useState(null);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [branchForSchedule, setBranchForSchedule] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load branches
  const loadBranches = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllBranchesForAdmin();
      setBranches(data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to load branches',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (opened) {
      loadBranches();
    }
  }, [opened]);

  const handleAddBranch = () => {
    setEditMode('create');
    setBranchToEdit(null);
    setAdminPanelOpen(true);
  };

  const handleEditBranch = (branch) => {
    setEditMode('edit');
    setBranchToEdit(branch);
    setAdminPanelOpen(true);
  };

  const handleEditSchedule = (branch) => {
    setBranchForSchedule(branch);
    setScheduleEditorOpen(true);
  };

  const handleDeleteClick = (branch) => {
    setBranchToDelete(branch);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!branchToDelete) return;

    try {
      setDeleting(true);
      await adminService.deleteBranch(branchToDelete.id);
      notifications.show({
        title: 'Success',
        message: `${branchToDelete.arcade_name} has been deleted`,
        color: 'green',
      });
      setDeleteDialogOpen(false);
      setBranchToDelete(null);
      loadBranches();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to delete branch',
        color: 'red',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleEnabled = async (branch) => {
    try {
      await adminService.updateBranch(branch.id, {
        enabled: !branch.enabled,
      });
      notifications.show({
        title: 'Success',
        message: `${branch.arcade_name} ${!branch.enabled ? 'enabled' : 'disabled'}`,
        color: 'green',
      });
      loadBranches();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update branch',
        color: 'red',
      });
    }
  };

  const handleAdminPanelClose = (shouldRefresh) => {
    setAdminPanelOpen(false);
    setBranchToEdit(null);
    if (shouldRefresh) {
      loadBranches();
    }
  };

  const handleScheduleEditorClose = () => {
    setScheduleEditorOpen(false);
    setBranchForSchedule(null);
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <Group gap="xs">
            <IconBuildingStore size={24} />
            <Title order={3}>Branch Manager</Title>
          </Group>
        }
        size="xl"
        centered
      >
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Manage all branches and their schedules
            </Text>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleAddBranch}
            >
              Add Branch
            </Button>
          </Group>

          {loading ? (
            <Center p="xl">
              <Loader size="lg" />
            </Center>
          ) : branches.length === 0 ? (
            <Paper p="xl" withBorder>
              <Center>
                <Stack align="center" gap="sm">
                  <IconBuildingStore size={48} opacity={0.3} />
                  <Text c="dimmed">No branches found</Text>
                  <Button
                    variant="light"
                    leftSection={<IconPlus size={16} />}
                    onClick={handleAddBranch}
                  >
                    Add Your First Branch
                  </Button>
                </Stack>
              </Center>
            </Paper>
          ) : (
            <Table.ScrollContainer minWidth={800}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Arcade Name</Table.Th>
                    <Table.Th>Location</Table.Th>
                    <Table.Th>Cabinets</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Enabled</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {branches.map((branch) => (
                    <Table.Tr key={branch.id}>
                      <Table.Td>
                        <Text fw={500}>{branch.arcade_name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {branch.latitude.toFixed(4)}, {branch.longitude.toFixed(4)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{branch.cab_count}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={branch.enabled ? 'green' : 'gray'}>
                          {branch.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Checkbox
                          checked={branch.enabled}
                          onChange={() => handleToggleEnabled(branch)}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => handleEditBranch(branch)}
                            title="Edit Details"
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="violet"
                            onClick={() => handleEditSchedule(branch)}
                            title="Edit Schedule"
                          >
                            <IconCalendar size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => handleDeleteClick(branch)}
                            title="Delete"
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Stack>
      </Modal>

      <AdminPanel
        opened={adminPanelOpen}
        onClose={handleAdminPanelClose}
        mode={editMode}
        branchToEdit={branchToEdit}
      />

      <ScheduleEditor
        opened={scheduleEditorOpen}
        onClose={handleScheduleEditorClose}
        branch={branchForSchedule}
      />

      <DeleteConfirmDialog
        opened={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        message={
          <>
            <Text>Are you sure you want to delete <Text component="span" fw={700}>{branchToDelete?.arcade_name}</Text>?</Text>
            <Text size="sm" c="dimmed" mt="xs">This action cannot be undone. All associated mall schedules will also be deleted.</Text>
          </>
        }
        loading={deleting}
        confirmLabel="Delete Branch"
      />
    </>
  );
};

export default BranchManager;
