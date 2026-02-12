import { useState, useEffect, useCallback } from 'react';

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
  Tabs,
  TextInput,
} from '@mantine/core';
import {
  IconBuildingStore,
  IconEdit,
  IconTrash,
  IconPlus,
  IconArrowLeft,
  IconChevronDown,
  IconChevronRight,
  IconUsers,
  IconMessageReport,
  IconPaperclip,
  IconSearch,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminService, contactService } from '../services/supabase';
import AdminPanel from './AdminPanel';
import ScheduleEditor from './ScheduleEditor';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import UserManager from './UserManager';
import { useAuth } from '../hooks/useAuth';
import './AdminPanelPage.css';
import { DAYS_OF_WEEK } from '../utils/constants';

const ReportsManager = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteReport, setDeleteReport] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await contactService.getReports();
      setReports(data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to load reports',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const confirmDeleteReport = async () => {
    if (!deleteReport) return;
    try {
      setDeleting(true);
      await contactService.deleteReport(deleteReport.id, deleteReport.attachment_path);
      notifications.show({
        title: 'Success',
        message: 'Report deleted',
        color: 'green'
      });
      loadReports();
      setDeleteReport(null);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: `Failed to delete report. ${error.message}`,
        color: 'red'
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (report, newStatus) => {
    try {
      await contactService.updateReportStatus(report.id, newStatus);
      notifications.show({
        title: 'Success',
        message: 'Report status updated',
        color: 'green'
      });
      loadReports();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: `Failed to update status. ${error.message}`,
        color: 'red',
      });
    }
  };

  const handleViewAttachment = async (path) => {
    try {
      const url = await contactService.getAttachmentUrl(path);
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: `Failed to open attachment. ${error.message}`,
        color: 'red',
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'blue';
      case 'resolved':
      case 'closed':
        return 'green';
      case 'investigating':
        return 'orange';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <Center p="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  if (reports.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Center>
          <Stack align="center" gap="sm">
            <IconMessageReport size={48} opacity={0.3} />
            <Text c="dimmed">No reports found</Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Paper withBorder>
      <Table.ScrollContainer minWidth={800}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: '120px' }}>Date</Table.Th>
              <Table.Th style={{ width: '80px' }}>Type</Table.Th>
              <Table.Th style={{ width: '160px' }}>User/Email</Table.Th>
              <Table.Th style={{ width: '300px' }}>Description</Table.Th>
              <Table.Th style={{ width: '80px' }}>Attachment</Table.Th>
              <Table.Th style={{ width: '100px' }}>Status</Table.Th>
              <Table.Th style={{ width: '120px' }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {reports.map((report) => (
              <Table.Tr key={report.id}>
                <Table.Td>
                  <Text size="sm">{new Date(report.created_at).toLocaleDateString()}</Text>
                  <Text size="xs" c="dimmed">{new Date(report.created_at).toLocaleTimeString()}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color={report.report_type === 'bug' ? 'red' : 'blue'}>
                    {report.report_type}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={500}>{report.user_display}</Text>
                  <Text size="xs" c="dimmed">{report.user_email}</Text>
                </Table.Td>
                <Table.Td style={{ maxWidth: '300px' }}>
                  <Text size="sm" lineClamp={3} title={report.description}>
                    {report.description}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {report.attachment_path && (
                    <Button
                      size="xs"
                      variant="subtle"
                      leftSection={<IconPaperclip size={14} />}
                      onClick={() => handleViewAttachment(report.attachment_path)}
                      title={report.attachment_name}
                    >
                      View
                    </Button>
                  )}
                </Table.Td>
                <Table.Td>
                  <Badge color={getStatusColor(report.status)}>{report.status}</Badge>
                </Table.Td>
                <Table.Td>
                  {report.status !== 'resolved' && (
                    <Button size="xs" color="green" variant="light" onClick={() => handleStatusChange(report, 'resolved')}>
                      Resolve
                    </Button>
                  )}
                  {report.status === 'resolved' && (
                    <Button size="xs" color="gray" variant="light" onClick={() => handleStatusChange(report, 'open')}>
                      Re-open
                    </Button>
                  )}
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    size="sm"
                    ml="xs"
                    onClick={() => setDeleteReport(report)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <DeleteConfirmDialog
        opened={!!deleteReport}
        onClose={() => setDeleteReport(null)}
        onConfirm={confirmDeleteReport}
        title="Delete Report"
        message="Are you sure you want to delete this report? This action cannot be undone."
        loading={deleting}
      />
    </Paper>
  );
};

// Utility function to format time from 24-hour to 12-hour AM/PM format
const formatTime = (time24) => {
  if (!time24) return '-';

  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;

  return `${hour12}:${minutes} ${ampm}`;
};

const AdminPanelPage = () => {
  const { userRoles } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetTab = searchParams.get('tab');
  const isSuperAdmin = userRoles?.is_super_admin || false;

  const [activeTab, setActiveTab] = useState(() => {
    // If target is requests, we need to show users tab
    if (targetTab === 'requests') return 'users';
    return isSuperAdmin ? 'branches' : 'users';
  });

  // React to URL search param changes
  useEffect(() => {
    if (targetTab === 'requests') {
      setActiveTab('users');
    }
  }, [targetTab]);

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

  // Load branches
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
  }, [isSuperAdmin, loadBranches]);

  if (!userRoles?.is_admin && !isSuperAdmin) {
    return (
      <Container size="sm" py="xl">
        <Paper p="xl" withBorder>
          <Stack align="center" gap="md">
            <Title order={3}>Access Denied</Title>
            <Text>You do not have permission to view this page.</Text>
            <Button onClick={() => navigate('/')}>Go Back</Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

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
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" align="center">
            <Group gap="md">
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={() => navigate('/')}
                title="Back to Queue Manager"
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
              <Title order={2}>Admin Panel</Title>
            </Group>
          </Group>
        </Paper>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            {isSuperAdmin && (
              <Tabs.Tab value="branches" leftSection={<IconBuildingStore size={16} />}>
                Branch Management
              </Tabs.Tab>
            )}
            <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>
              User Management
            </Tabs.Tab>
            {isSuperAdmin && (
              <Tabs.Tab value="reports" leftSection={<IconMessageReport size={16} />}>
                Reports
              </Tabs.Tab>
            )}
          </Tabs.List>

          {isSuperAdmin && (
            <Tabs.Panel value="branches" pt="md">
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
                                          <div className="schedule-grid">
                                            {DAYS_OF_WEEK.map(day => {
                                              const schedule = branchSchedules[branch.id].find(s => s.day === day);
                                              const timeRange = schedule
                                                ? `${formatTime(schedule.time_open)} - ${formatTime(schedule.time_close)}`
                                                : 'Closed';

                                              return (
                                                <Paper key={day} p="md" withBorder className="schedule-day-card">
                                                  <Stack gap="xs" align="center">
                                                    <Text size="md" fw={600} c={schedule ? 'inherit' : 'dimmed'}>
                                                      {day}
                                                    </Text>
                                                    <Text size="sm" c={schedule ? 'dimmed' : 'red'}>
                                                      {timeRange}
                                                    </Text>
                                                  </Stack>
                                                </Paper>
                                              );
                                            })}
                                          </div>
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
            </Tabs.Panel>
          )}

          <Tabs.Panel value="users" pt="md">
            <UserManager
              isSuperAdmin={isSuperAdmin}
              currentUserRoles={userRoles}
              initialTab={(targetTab === 'requests' || activeTab === 'requests') ? 'requests' : 'users'}
            />
          </Tabs.Panel>

          {isSuperAdmin && (
            <Tabs.Panel value="reports" pt="md">
              <ReportsManager />
            </Tabs.Panel>
          )}
        </Tabs>
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
        title="Delete Branch"
        message={
          <>
            <Text>Are you sure you want to delete <Text component="span" fw={700}>{branchToDelete?.arcade_name}</Text>?</Text>
            <Text size="sm" c="dimmed" mt="xs">This action cannot be undone. All associated mall schedules will also be deleted.</Text>
          </>
        }
        loading={deleting}
      />
    </Container>
  );
};

export default AdminPanelPage;
