import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Stack,
  Button,
  Group,
  Title,
  Text,
  ActionIcon,
  Paper,
  Table,
  Select,
  TextInput,
  Modal,
  Badge,
  Center,
  Loader,
  Pagination,
  Grid,
  JsonInput,
} from '@mantine/core';
import IconDownload from '@tabler/icons-react/dist/esm/icons/IconDownload.mjs';
import IconEye from '@tabler/icons-react/dist/esm/icons/IconEye.mjs';
import { DatePickerInput } from '@mantine/dates';
import { useAuth } from '../hooks/useAuth';
import { auditService } from '../services/supabase/audit';
import './AuditLogsPage.css';

const OPERATIONS = ['INSERT', 'UPDATE', 'DELETE'];
const TABLES = [
  'queue_entries',
  'user_roles',
  'user_profiles',
  'allowed_places',
  'playlist_posts',
  'song_comments',
  'playlist_comments',
  'access_requests',
  'queue_rules'
];

const AuditLogsPage = () => {
  const { userRoles } = useAuth();
  const isSuperAdmin = userRoles?.is_super_admin || false;

  // State
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState(null);

  // Filters
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [selectedActorId, setSelectedActorId] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

  // Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [modalOpened, setModalOpened] = useState(false);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, count, error: fetchError } = await auditService.getAuditLogs({
        tableNames: selectedTable ? [selectedTable] : null,
        operation: selectedOperation,
        actorId: selectedActorId || null,
        recordId: selectedRecordId || null,
        fromDate,
        toDate,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      });

      if (fetchError) throw fetchError;

      setAuditLogs(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.message);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTable, selectedOperation, selectedActorId, selectedRecordId, fromDate, toDate, currentPage, pageSize]);

  // Refetch when filters change
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedTable, selectedOperation, selectedActorId, selectedRecordId, fromDate, toDate]);

  // Fetch when page or filters change
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Permission check
  if (!isSuperAdmin) {
    return (
      <Container size="xl" py="xl">
        <Paper p="xl" withBorder>
          <Stack align="center" gap="md">
            <Title order={3}>Access Denied</Title>
            <Text>Only super admins can view audit logs.</Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // Handle CSV export
  const handleExport = () => {
    const csv = auditService.exportToCSV(auditLogs);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Format timestamp
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  // Format operation badge color
  const getOperationColor = (operation) => {
    switch (operation) {
      case 'INSERT':
        return 'green';
      case 'UPDATE':
        return 'blue';
      case 'DELETE':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Header */}
        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" align="center">
            <Group gap="md">
              <Title order={2}>Audit Logs</Title>
            </Group>
            <Group gap="sm">
              <Text c="dimmed" size="sm">
                {totalCount} total entries
              </Text>
              <Button
                leftSection={<IconDownload size={16} />}
                onClick={handleExport}
                disabled={auditLogs.length === 0 || loading}
              >
                Export CSV
              </Button>
            </Group>
          </Group>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          <Stack gap="md">
            <Title order={4}>Filter Audit Logs</Title>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Select
                  label="Table"
                  placeholder="All tables"
                  data={TABLES}
                  value={selectedTable}
                  onChange={setSelectedTable}
                  clearable
                  searchable
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Select
                  label="Operation"
                  placeholder="All operations"
                  data={OPERATIONS}
                  value={selectedOperation}
                  onChange={setSelectedOperation}
                  clearable
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <TextInput
                  label="Actor ID"
                  placeholder="Filter by user ID"
                  value={selectedActorId}
                  onChange={(e) => setSelectedActorId(e.currentTarget.value)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <TextInput
                  label="Record ID"
                  placeholder="Filter by record ID"
                  value={selectedRecordId}
                  onChange={(e) => setSelectedRecordId(e.currentTarget.value)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <DatePickerInput
                  label="From Date"
                  placeholder="Start date"
                  value={fromDate}
                  onChange={setFromDate}
                  clearable
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <DatePickerInput
                  label="To Date"
                  placeholder="End date"
                  value={toDate}
                  onChange={setToDate}
                  clearable
                />
              </Grid.Col>
            </Grid>
            <Group>
              <Button
                variant="subtle"
                onClick={() => {
                  setSelectedTable(null);
                  setSelectedOperation(null);
                  setSelectedActorId('');
                  setSelectedRecordId('');
                  setFromDate(null);
                  setToDate(null);
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            </Group>
          </Stack>
        </Paper>

        <Paper p="md" radius="md" withBorder className="audit-summary-card">
          <Text>
            Showing {auditLogs.length} of {totalCount} audit logs
          </Text>
        </Paper>

        <Paper p="md" radius="md" withBorder>
          {error && (
            <Paper p="md" bg="red.0" mb="md">
              <Text c="red">Error: {error}</Text>
            </Paper>
          )}

          {loading ? (
            <Center py="xl">
              <Loader />
            </Center>
          ) : auditLogs.length === 0 ? (
            <Center py="xl">
              <Text c="dimmed">No audit logs found</Text>
            </Center>
          ) : (
            <>
              <Table striped highlightOnHover className="audit-logs-table">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Timestamp</Table.Th>
                    <Table.Th>Table</Table.Th>
                    <Table.Th>Operation</Table.Th>
                    <Table.Th>Record ID</Table.Th>
                    <Table.Th>Actor</Table.Th>
                    <Table.Th>Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {auditLogs.map((log) => (
                    <Table.Tr key={log.id}>
                      <Table.Td>{formatDate(log.created_at)}</Table.Td>
                      <Table.Td>{log.table_name}</Table.Td>
                      <Table.Td>
                        <Badge color={getOperationColor(log.operation)}>
                          {log.operation}
                        </Badge>
                      </Table.Td>
                      <Table.Td className="record-id-cell">
                        {log.record_id.length > 10 ? `${log.record_id.substring(0, 8)}...` : log.record_id}
                      </Table.Td>
                      <Table.Td className="record-id-cell">
                        {log.actor_id ? (log.actor_id.length > 10 ? log.actor_id.substring(0, 8) : log.actor_id) : 'System'}
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          title="View details"
                          onClick={() => {
                            setSelectedLog(log);
                            setModalOpened(true);
                          }}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {totalCount > pageSize && (
                <Group justify="center" mt="md">
                  <Pagination
                    value={currentPage}
                    onChange={setCurrentPage}
                    total={Math.ceil(totalCount / pageSize)}
                  />
                </Group>
              )}
            </>
          )}
        </Paper>
      </Stack>

      {/* Detail Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setSelectedLog(null);
        }}
        title="Audit Log Details"
        size="lg"
        scrollAreaComponent={Paper}
      >
        {selectedLog && (
          <Stack gap="md">
            <div>
              <Text fw={500} mb="xs">Basic Information</Text>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Paper p="md" bg="gray.0">
                    <Text size="sm" c="dimmed">Timestamp</Text>
                    <Text fw={500}>{formatDate(selectedLog.created_at)}</Text>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Paper p="md" bg="gray.0">
                    <Text size="sm" c="dimmed">Table</Text>
                    <Text fw={500}>{selectedLog.table_name}</Text>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Paper p="md" bg="gray.0">
                    <Text size="sm" c="dimmed">Operation</Text>
                    <Badge color={getOperationColor(selectedLog.operation)}>
                      {selectedLog.operation}
                    </Badge>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Paper p="md" bg="gray.0">
                    <Text size="sm" c="dimmed">Record ID</Text>
                    <Text fw={500} size="sm" style={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      {selectedLog.record_id}
                    </Text>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Paper p="md" bg="gray.0">
                    <Text size="sm" c="dimmed">Actor ID</Text>
                    <Text fw={500} size="sm" style={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      {selectedLog.actor_id || 'System'}
                    </Text>
                  </Paper>
                </Grid.Col>
              </Grid>
            </div>

            {selectedLog.context && (
              <div>
                <Text fw={500} mb="xs">Context</Text>
                <JsonInput
                  className="expandable-json-input"
                  value={JSON.stringify(selectedLog.context, null, 2)}
                  readOnly
                  formatJson
                  minRows={3}
                />
              </div>
            )}

            {selectedLog.operation !== 'INSERT' && selectedLog.old_values && (
              <div>
                <Text fw={500} mb="xs">Old Values</Text>
                <JsonInput
                  className="expandable-json-input"
                  value={JSON.stringify(selectedLog.old_values, null, 2)}
                  readOnly
                  formatJson
                  minRows={4}
                />
              </div>
            )}

            {(selectedLog.operation === 'INSERT' || selectedLog.operation === 'UPDATE') && selectedLog.new_values && (
              <div>
                <Text fw={500} mb="xs">New Values</Text>
                <JsonInput
                  className="expandable-json-input"
                  value={JSON.stringify(selectedLog.new_values, null, 2)}
                  readOnly
                  formatJson
                  minRows={4}
                />
              </div>
            )}
          </Stack>
        )}
      </Modal>
    </Container>
  );
};

export default AuditLogsPage;
