import { useState, useEffect } from 'react';
import {
  Modal,
  Select,
  MultiSelect,
  Table,
  Group,
  Stack,
  Text,
  Badge,
  Loader,
  Center,
  Avatar,
  Box,
  LoadingOverlay,
  UnstyledButton,
} from '@mantine/core';
import IconHistory from '@tabler/icons-react/dist/esm/icons/IconHistory.mjs';
import { queueService } from '../../../services/supabase/queue';

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: 'numeric',
  hour12: true,
});

const statusColors = {
  waiting: 'gray',
  playing: 'blue',
  completed: 'green',
  cancelled: 'red',
};

/**
 * Modal component for viewing historical queue activity logs.
 * Supports filtering by time range and status.
 * @param {Object} props - Component props.
 * @param {boolean} props.opened - Whether the modal is visible.
 * @param {Function} props.onClose - Callback to close the modal.
 * @param {string} props.branchId - The ID of the branch to fetch logs for.
 * @returns {JSX.Element} The rendered logs modal.
 */
const QueueLogsModal = ({ opened, onClose, branchId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [timeFilter, setTimeFilter] = useState('past_hour');
  const [statusFilter, setStatusFilter] = useState(['waiting', 'playing', 'completed', 'cancelled']);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!opened || !branchId) return;

      setLoading(true);
      try {
        const data = await queueService.getQueueLogs({
          branchId,
          timeFilter,
          statusFilter,
        });
        setLogs(data);
      } catch (error) {
        console.error('Error fetching queue logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [opened, branchId, timeFilter, statusFilter]);

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    return timeFormatter.format(new Date(isoString));
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      aria-label="Recent Queue Logs"
      size="xl"
      centered
      padding={0}
      radius={24}
      withCloseButton={false}
      styles={{
        content: {
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 40px)'
        },
        body: {
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden'
        },
      }}
    >
      <LoadingOverlay visible={loading} zIndex={100} overlayProps={{ radius: 'md', blur: 2 }} />

      {/* ── Fixed Header ─────────────────────────────────────────── */}
      <Box
        className="app-modal-header"
        style={{
          background: 'linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary), var(--theme-secondary) 40%))',
          padding: '24px 24px 20px',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <Group gap="sm" style={{ position: 'relative', zIndex: 1 }}>
          <Box
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3)',
            }}
          >
            <IconHistory size={18} color="var(--theme-primary-contrast)" strokeWidth={2.2} />
          </Box>
          <Box>
            <Text
              size="lg"
              fw={800}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--theme-primary-contrast)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              Recent Queue Logs
            </Text>
            <Text size="xs" style={{ color: 'var(--theme-primary-contrast)', opacity: 0.8, marginTop: 2 }}>
              Historical activity for this branch
            </Text>
          </Box>
        </Group>

        <UnstyledButton
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            padding: '4px 12px',
            borderRadius: 20,
            background: 'rgba(255,255,255,0.2)',
            color: 'var(--theme-primary-contrast)',
            fontSize: 12,
            fontWeight: 700,
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s ease',
            zIndex: 10,
          }}
          aria-label="Close"
          className="header-close-pill"
        >
          Close
        </UnstyledButton>
      </Box>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <Stack gap="md" p="lg">
          {/* Filters Card */}
          <Box
            style={{
              borderRadius: 18,
              padding: '16px',
              background: 'var(--theme-surface)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              border: '1px solid var(--theme-border)',
            }}
          >
            <Group grow align="flex-start">
              <Select
                label={<Text size="xs" fw={700} mb={4}>Time Range</Text>}
                value={timeFilter}
                onChange={(val) => setTimeFilter(val || 'past_hour')}
                data={[
                  { value: 'past_hour', label: 'Past Hour' },
                  { value: 'past_3_hours', label: 'Past 3 Hours' },
                  { value: 'today', label: 'Today' },
                  { value: 'all_time', label: 'All Time' },
                ]}
                comboboxProps={{ withinPortal: false }}
                styles={{
                  input: { borderRadius: 10, minHeight: 40 }
                }}
              />
              <MultiSelect
                label={<Text size="xs" fw={700} mb={4}>Status Filter</Text>}
                value={statusFilter}
                onChange={setStatusFilter}
                data={[
                  { value: 'waiting', label: 'Waiting' },
                  { value: 'playing', label: 'Playing' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                clearable
                comboboxProps={{ withinPortal: false }}
                styles={{
                  input: { borderRadius: 10, minHeight: 40 }
                }}
              />
            </Group>
          </Box>

          {/* Table Container */}
          <Box
            style={{
              borderRadius: 18,
              background: 'var(--theme-surface)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              border: '1px solid var(--theme-border)',
              overflow: 'hidden'
            }}
          >
            {loading ? (
              <Center h={200}>
                <Loader color="var(--theme-primary)" />
              </Center>
            ) : logs.length === 0 ? (
              <Center h={200}>
                <Text size="sm" c="dimmed">No entries found.</Text>
              </Center>
            ) : (
              <Box style={{ overflowX: 'auto' }}>
                <Table
                  verticalSpacing="sm"
                  horizontalSpacing="md"
                  styles={{
                    th: {
                      borderBottom: '1px solid var(--theme-border)',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--theme-text-muted)',
                      paddingTop: '12px',
                      paddingBottom: '12px',
                    },
                    td: {
                      borderBottom: '1px solid var(--theme-border)',
                      fontSize: '13px',
                    }
                  }}
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Players</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Cab</Table.Th>
                      <Table.Th>Created</Table.Th>
                      <Table.Th>Started</Table.Th>
                      <Table.Th>Ended</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {logs.map((log) => (
                      <Table.Tr key={log.id}>
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            {log.created_by_profile?.display_photo_url && (
                              <Avatar
                                src={log.created_by_profile.display_photo_url}
                                size={24}
                                radius="xl"
                              />
                            )}
                            <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>
                              {log.player1} {log.player2 && `/ ${log.player2}`}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={statusColors[log.status]}
                            variant="light"
                            size="sm"
                            radius="sm"
                            style={{ fontWeight: 700 }}
                          >
                            {log.status.toUpperCase()}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600}>{log.cabinet_num || 1}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">{formatTime(log.created_at)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">{formatTime(log.started_at)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">{formatTime(log.ended_at)}</Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Box>
            )}
          </Box>
        </Stack>
      </Box>
    </Modal>
  );
};

export default QueueLogsModal;
