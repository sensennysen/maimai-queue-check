import { useState, useEffect, useCallback } from 'react';
import {
  Stack,
  Button,
  Group,
  Text,
  Table,
  ActionIcon,
  Checkbox,
  Badge,
  Loader,
  Center,
  Paper,
  Collapse,
  TextInput,
} from '@mantine/core';
import IconBuildingStore from '@tabler/icons-react/dist/esm/icons/IconBuildingStore.mjs';
import IconEdit from '@tabler/icons-react/dist/esm/icons/IconEdit.mjs';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import IconPlus from '@tabler/icons-react/dist/esm/icons/IconPlus.mjs';
import IconChevronDown from '@tabler/icons-react/dist/esm/icons/IconChevronDown.mjs';
import IconChevronRight from '@tabler/icons-react/dist/esm/icons/IconChevronRight.mjs';
import IconSearch from '@tabler/icons-react/dist/esm/icons/IconSearch.mjs';
import { notifications } from '@mantine/notifications';
import { adminService } from '../../../services/supabase';
import BranchEditModal from '../../../components/modals/BranchEditModal';
import ScheduleEditor from '../../../components/modals/ScheduleEditor';
import DeleteConfirmDialog from '../../../components/modals/DeleteConfirmDialog';
import { DAYS_OF_WEEK } from '../../../utils/constants';

// Utility function
const formatTime = (time24) => {
  if (!time24) return '-';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const BranchList = ({ isSuperAdmin }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchSearch, setBranchSearch] = useState('');
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
  const [deleting, setDeleting] = useState(false);

  const loadBranches = useCallback(async () => {
    if (!isSuperAdmin) return;
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
  }, [isSuperAdmin]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

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
    <Stack gap="md">
      <Group justify="space-between">
        <TextInput
          placeholder="Search branches..."
          leftSection={<IconSearch size={16} />}
          value={branchSearch}
          onChange={(e) => setBranchSearch(e.currentTarget.value)}
          style={{ flex: 1, maxWidth: 300 }}
        />
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
              <Text c="secondary" fw={500}>No branches found</Text>
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
                  <Table.Th style={{ width: '200px' }}>Arcade Name</Table.Th>
                  <Table.Th style={{ width: '160px' }}>Location</Table.Th>
                  <Table.Th style={{ width: '80px' }}>Cabinets</Table.Th>
                  <Table.Th style={{ width: '90px' }}>Status</Table.Th>
                  <Table.Th style={{ width: '70px' }}>Enabled</Table.Th>
                  <Table.Th style={{ width: '100px' }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {branches.filter(b => {
                  const q = branchSearch.toLowerCase();
                  if (!q) return true;
                  return (b.arcade_name?.toLowerCase().includes(q) ||
                    b.short_name?.toLowerCase().includes(q) ||
                    b.acronym?.toLowerCase().includes(q));
                }).map((branch) => (
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
                        <Text size="sm" c="secondary">
                          {branch.latitude?.toFixed(4)}, {branch.longitude?.toFixed(4)}
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
                          <Paper p="md" style={{
                            backgroundColor: 'color-mix(in srgb, var(--theme-surface), var(--theme-background) 50%)',
                            borderTop: '1px solid var(--theme-border)'
                          }}>
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
                                <div className="schedule-grid">
                                  {DAYS_OF_WEEK.map(day => {
                                    const schedule = branchSchedules[branch.id].find(s => s.day === day);
                                    const timeRange = schedule
                                      ? `${formatTime(schedule.time_open)} - ${formatTime(schedule.time_close)}`
                                      : 'Closed';

                                    return (
                                      <Paper key={day} p="md" withBorder className="schedule-day-card">
                                        <Stack gap="xs" align="center">
                                          <Text size="md" fw={600} c={schedule ? 'inherit' : 'secondary'}>
                                            {day}
                                          </Text>
                                          <Text size="sm" c={schedule ? 'secondary' : 'red'}>
                                            {timeRange}
                                          </Text>
                                        </Stack>
                                      </Paper>
                                    );
                                  })}
                                </div>
                              ) : (
                                <Text size="sm" c="secondary" ta="center">No schedule configured</Text>
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

      <BranchEditModal
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
        title="Delete Branch"
        message={
          <>
            <Text style={{ marginTop: '1rem' }}>Are you sure you want to delete <Text component="span" fw={700}>{branchToDelete?.arcade_name}</Text>?</Text>
            <Text size="sm" c="secondary" mt="xs">This action cannot be undone. All associated mall schedules will also be deleted.</Text>
          </>
        }
        loading={deleting}
        confirmLabel="Delete Branch"
      />
    </Stack>
  );
};

export default BranchList;
