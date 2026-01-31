import { useState, useEffect } from 'react';
import {
  Container,
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
  Modal,
  Collapse,
} from '@mantine/core';
import {
  IconBuildingStore,
  IconEdit,
  IconTrash,
  IconPlus,
  IconArrowLeft,
  IconChevronDown,
  IconChevronRight,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { adminService } from '../services/supabase';
import AdminPanel from './AdminPanel';
import ScheduleEditor from './ScheduleEditor';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import './BranchManagerPage.css';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const BranchManagerPage = ({ onBack }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBranches, setExpandedBranches] = useState(new Set());
  const [branchSchedules, setBranchSchedules] = useState({});
  const [loadingSchedules, setLoadingSchedules] = useState({});

  // Modal states
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Edit states
  const [editMode, setEditMode] = useState('create');
  const [branchToEdit, setBranchToEdit] = useState(null);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [branchForSchedule, setBranchForSchedule] = useState(null);

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
    loadBranches();
  }, []);

  const toggleBranchExpand = async (branchId) => {
    const newExpanded = new Set(expandedBranches);

    if (newExpanded.has(branchId)) {
      newExpanded.delete(branchId);
    } else {
      newExpanded.add(branchId);

      // Load schedules if not already loaded
      if (!branchSchedules[branchId]) {
        try {
          setLoadingSchedules(prev => ({ ...prev, [branchId]: true }));
          const { schedules } = await adminService.getBranchWithSchedules(branchId);
          setBranchSchedules(prev => ({ ...prev, [branchId]: schedules }));
        } catch (error) {
          notifications.show({
            title: 'Error',
            message: error.message || 'Failed to load schedules',
            color: 'red',
          });
        } finally {
          setLoadingSchedules(prev => ({ ...prev, [branchId]: false }));
        }
      }
    }

    setExpandedBranches(newExpanded);
  };

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

  const handleScheduleEditorClose = (shouldRefresh) => {
    setScheduleEditorOpen(false);
    if (shouldRefresh && branchForSchedule) {
      // Reload schedules for this branch
      setBranchSchedules(prev => {
        const newSchedules = { ...prev };
        delete newSchedules[branchForSchedule.id];
        return newSchedules;
      });
      if (expandedBranches.has(branchForSchedule.id)) {
        toggleBranchExpand(branchForSchedule.id);
      }
    }
    setBranchForSchedule(null);
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" align="center">
            <Group gap="md">
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={onBack}
                title="Back to Queue Manager"
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
              <Group gap="xs">
                <IconBuildingStore size={28} />
                <Title order={2}>Branch Manager</Title>
              </Group>
            </Group>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleAddBranch}
            >
              Add Branch
            </Button>
          </Group>
        </Paper>

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
          <Paper withBorder>
            <Table.ScrollContainer minWidth={800}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: '40px' }}></Table.Th>
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
                    <>
                      <Table.Tr key={branch.id}>
                        <Table.Td>
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            onClick={() => toggleBranchExpand(branch.id)}
                          >
                            {expandedBranches.has(branch.id) ? (
                              <IconChevronDown size={16} />
                            ) : (
                              <IconChevronRight size={16} />
                            )}
                          </ActionIcon>
                        </Table.Td>
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
                              color="red"
                              onClick={() => handleDeleteClick(branch)}
                              title="Delete"
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                      <Table.Tr key={`${branch.id}-schedule`}>
                        <Table.Td colSpan={7} style={{ padding: 0 }}>
                          <Collapse in={expandedBranches.has(branch.id)}>
                            <Paper p="md" bg="var(--mantine-color-gray-0)" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
                              <Stack gap="sm">
                                <Group justify="space-between">
                                  <Text fw={600} size="sm">Weekly Schedule</Text>
                                  <Button
                                    size="xs"
                                    variant="light"
                                    leftSection={<IconEdit size={14} />}
                                    onClick={() => handleEditSchedule(branch)}
                                  >
                                    Edit Schedule
                                  </Button>
                                </Group>
                                {loadingSchedules[branch.id] ? (
                                  <Center p="sm">
                                    <Loader size="sm" />
                                  </Center>
                                ) : branchSchedules[branch.id] && branchSchedules[branch.id].length > 0 ? (
                                  <Table size="sm">
                                    <Table.Thead>
                                      <Table.Tr>
                                        <Table.Th>Day</Table.Th>
                                        <Table.Th>Opening Time</Table.Th>
                                        <Table.Th>Closing Time</Table.Th>
                                      </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                      {DAYS_OF_WEEK.map(day => {
                                        const schedule = branchSchedules[branch.id].find(s => s.day === day);
                                        return (
                                          <Table.Tr key={day}>
                                            <Table.Td>
                                              <Text size="sm" fw={500}>{day}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                              <Text size="sm">{schedule?.time_open || '-'}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                              <Text size="sm">{schedule?.time_close || '-'}</Text>
                                            </Table.Td>
                                          </Table.Tr>
                                        );
                                      })}
                                    </Table.Tbody>
                                  </Table>
                                ) : (
                                  <Text size="sm" c="dimmed" ta="center">No schedule configured</Text>
                                )}
                              </Stack>
                            </Paper>
                          </Collapse>
                        </Table.Td>
                      </Table.Tr>
                    </>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        )}
      </Stack>

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
        branchName={branchToDelete?.arcade_name}
      />
    </Container>
  );
};

export default BranchManagerPage;
