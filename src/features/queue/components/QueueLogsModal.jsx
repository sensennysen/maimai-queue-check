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
  ScrollArea,
} from '@mantine/core';
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
      title="Recent Queue Logs"
      size="xl"
      centered
    >
      <Stack gap="md">
        <Group grow align="flex-start">
          <Select
            label="Time Range"
            value={timeFilter}
            onChange={(val) => setTimeFilter(val || 'past_hour')}
            data={[
              { value: 'past_hour', label: 'Past Hour' },
              { value: 'past_3_hours', label: 'Past 3 Hours' },
              { value: 'today', label: 'Today (Since Midnight)' },
              { value: 'all_time', label: 'All Time' },
            ]}
          />
          <MultiSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            data={[
              { value: 'waiting', label: 'Waiting' },
              { value: 'playing', label: 'Playing' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            clearable
          />
        </Group>

        <ScrollArea h={400} offsetScrollbars>
          {loading ? (
            <Center h={200}>
              <Loader />
            </Center>
          ) : logs.length === 0 ? (
            <Center h={200}>
              <Text c="dimmed">No logs found for the selected filters.</Text>
            </Center>
          ) : (
            <Table striped highlightOnHover>
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
                            size="sm"
                            radius="xl"
                          />
                        )}
                        <Text size="sm" style={{ whiteSpace: 'nowrap' }}>
                          {log.player1} {log.player2 && `/ ${log.player2}`}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={statusColors[log.status]} variant="light">
                        {log.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{log.cabinet_num || 1}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatTime(log.created_at)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatTime(log.started_at)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatTime(log.ended_at)}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </ScrollArea>
      </Stack>
    </Modal>
  );
};

export default QueueLogsModal;
