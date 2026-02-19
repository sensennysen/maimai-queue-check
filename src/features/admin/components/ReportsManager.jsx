import { useState, useEffect, useCallback } from 'react';
import {
  Stack,
  Button,
  Text,
  Table,
  ActionIcon,
  Badge,
  Loader,
  Center,
  Paper,
} from '@mantine/core';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import IconMessageReport from '@tabler/icons-react/dist/esm/icons/IconMessageReport.mjs';
import IconPaperclip from '@tabler/icons-react/dist/esm/icons/IconPaperclip.mjs';
import { notifications } from '@mantine/notifications';
import { contactService } from '../../../services/supabase';
import DeleteConfirmDialog from '../../../components/modals/DeleteConfirmDialog';

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
            <Text c="secondary" fw={500}>No reports found</Text>
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
                  <Text size="xs" c="secondary">{new Date(report.created_at).toLocaleTimeString()}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color={report.report_type === 'bug' ? 'red' : 'blue'}>
                    {report.report_type}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" fw={500}>{report.user_display}</Text>
                  <Text size="xs" c="secondary">{report.user_email}</Text>
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
        message={
          <>
            <Text style={{ marginTop: '1rem' }}>Are you sure you want to delete this report?</Text>
            <Text size="sm" c="secondary" mt="xs">This action cannot be undone.</Text>
          </>
        }
        confirmLabel="Delete Report"
        loading={deleting}
      />
    </Paper>
  );
};

export default ReportsManager;
