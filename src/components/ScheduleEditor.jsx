import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Button,
  Group,
  Title,
  Text,
  Paper,
  Table,
  ScrollArea,
} from '@mantine/core';
import { IconCalendar, IconClock } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { adminService } from '../services/supabase';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ScheduleEditor = ({ opened, onClose, branch }) => {
  const [schedules, setSchedules] = useState(
    DAYS_OF_WEEK.map(day => ({
      day,
      time_open: '10:00',
      time_close: '22:00'
    }))
  );
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Load existing schedules when modal opens
  useEffect(() => {
    const loadSchedules = async () => {
      if (!branch) return;

      try {
        setLoadingData(true);
        const { schedules: existingSchedules } = await adminService.getBranchWithSchedules(branch.id);

        if (existingSchedules && existingSchedules.length > 0) {
          // Map existing schedules to our format
          // Convert HH:MM:SS to HH:MM if needed
          const convertTime = (time) => {
            if (!time) return '10:00';
            // If time is in HH:MM:SS format, strip the seconds
            return time.length > 5 ? time.substring(0, 5) : time;
          };

          const mappedSchedules = DAYS_OF_WEEK.map(day => {
            const existing = existingSchedules.find(s => s.day === day);
            return existing
              ? {
                day,
                time_open: convertTime(existing.time_open),
                time_close: convertTime(existing.time_close)
              }
              : { day, time_open: '10:00', time_close: '22:00' };
          });
          setSchedules(mappedSchedules);
        }
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: error.message || 'Failed to load schedules',
          color: 'red',
        });
      } finally {
        setLoadingData(false);
      }
    };

    if (opened && branch) {
      loadSchedules();
    }
  }, [opened, branch]);

  const handleScheduleChange = (index, field, value) => {
    const newSchedules = [...schedules];
    newSchedules[index][field] = value;
    setSchedules(newSchedules);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!branch) return;

    // Validation
    for (const schedule of schedules) {
      if (!schedule.time_open || !schedule.time_close) {
        notifications.show({
          title: 'Validation Error',
          message: `Please fill in both opening and closing times for ${schedule.day}`,
          color: 'red',
        });
        return;
      }

      // Validate time format (HH:MM or H:MM) - HTML time inputs can return either
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      const openTime = schedule.time_open.trim();
      const closeTime = schedule.time_close.trim();

      if (!timeRegex.test(openTime) || !timeRegex.test(closeTime)) {
        notifications.show({
          title: 'Validation Error',
          message: `Invalid time format for ${schedule.day}. Expected HH:MM format, got open: "${openTime}", close: "${closeTime}"`,
          color: 'red',
        });
        return;
      }
    }

    setLoading(true);
    try {
      await adminService.updateMallSchedules(branch.id, schedules);

      notifications.show({
        title: 'Success',
        message: `Schedule for ${branch.arcade_name} has been updated`,
        color: 'green',
      });

      onClose(true); // Pass true to indicate refresh needed
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update schedules',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconCalendar size={24} />
          <Title order={3}>Edit Schedule</Title>
        </Group>
      }
      size="lg"
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Text size="sm" c="dimmed" style={{ marginTop: '1rem' }}>
            {branch?.arcade_name}
          </Text>

          {loadingData ? (
            <Text ta="center" c="dimmed">Loading schedules...</Text>
          ) : (
            <Paper p="md" withBorder className="schedule-container">
              <ScrollArea>
                <Table minWidth={500}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Day</Table.Th>
                      <Table.Th style={{ textAlign: 'center' }}>Opening Time</Table.Th>
                      <Table.Th style={{ textAlign: 'center' }}>Closing Time</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {schedules.map((schedule, index) => (
                      <Table.Tr key={schedule.day}>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {schedule.day}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            type="time"
                            value={schedule.time_open}
                            onChange={(e) => handleScheduleChange(index, 'time_open', e.target.value)}
                            required
                            leftSection={<IconClock size={16} />}
                            styles={{ input: { textAlign: 'center' } }}
                          />
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            type="time"
                            value={schedule.time_close}
                            onChange={(e) => handleScheduleChange(index, 'time_close', e.target.value)}
                            required
                            leftSection={<IconClock size={16} />}
                            styles={{ input: { textAlign: 'center' } }}
                          />
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Paper>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={loadingData}>
              Update Schedule
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default ScheduleEditor;
