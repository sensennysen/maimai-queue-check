import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Button,
  Group,
  Text,
  Table,
  Box,
  UnstyledButton,
  Loader
} from '@mantine/core';
import IconClock from '@tabler/icons-react/dist/esm/icons/IconClock.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import { notifications } from '@mantine/notifications';
import { adminService } from '../../services/supabase';

import { DAYS_OF_WEEK } from '../../utils/constants';

const ScheduleEditor = ({ opened, onClose, branch }) => {
  const [schedules, setSchedules] = useState(
    DAYS_OF_WEEK.map(day => ({
      day,
      time_open: '',
      time_close: ''
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
              : { day, time_open: '', time_close: '' };
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
    e?.preventDefault();

    if (!branch) return;

    // Validation
    const validSchedules = [];
    for (const schedule of schedules) {
      if (!schedule.time_open && !schedule.time_close) {
        continue;
      }

      if (!schedule.time_open || !schedule.time_close) {
        notifications.show({
          title: 'Validation Error',
          message: `Please fill in both opening and closing times for ${schedule.day}, or leave both blank if closed.`,
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

      validSchedules.push({
        ...schedule,
        time_open: openTime,
        time_close: closeTime
      });
    }

    setLoading(true);
    try {
      await adminService.updateMallSchedules(branch.id, validSchedules);

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
      aria-label="Edit Schedule"
      size="lg"
      radius={24}
      padding={0}
      withCloseButton={false}
      centered
      styles={{
        content: {
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 60px)'
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
            <IconClock size={18} color="var(--theme-primary-contrast)" strokeWidth={2.2} />
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
              Edit Schedule
            </Text>
            <Text size="xs" style={{ color: 'var(--theme-primary-contrast)', opacity: 0.8, marginTop: 2 }}>
              {branch?.arcade_name || 'Operating Hours'}
            </Text>
          </Box>
        </Group>

        <UnstyledButton
          onClick={() => onClose(false)}
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
          Cancel
        </UnstyledButton>
      </Box>

      {/* ── Scrollable Body ──────────────────────────────────────── */}
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <Stack gap="lg" p="lg">
          {loadingData ? (
            <Group justify="center" p="xl">
              <Loader size="sm" color="var(--theme-primary)" />
              <Text size="sm" fw={500}>Fetching schedule details…</Text>
            </Group>
          ) : (
            <Box
              style={{
                borderRadius: 18,
                overflow: 'hidden',
                background: 'var(--theme-surface)',
                border: '1px solid var(--theme-border)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
              }}
            >
              <Table verticalSpacing="sm">
                <Table.Thead style={{ background: 'var(--theme-bg-soft)' }}>
                  <Table.Tr>
                    <Table.Th style={{ paddingLeft: 24 }}>Day</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>Open</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>Close</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {schedules.map((schedule, index) => (
                    <Table.Tr key={schedule.day}>
                      <Table.Td style={{ paddingLeft: 24 }}>
                        <Text size="sm" fw={700}>{schedule.day}</Text>
                      </Table.Td>
                      <Table.Td>
                        <TextInput
                          type="time"
                          value={schedule.time_open}
                          onChange={(e) => handleScheduleChange(index, 'time_open', e.target.value)}
                          styles={{ input: { borderRadius: 8, height: 32, textAlign: 'center' } }}
                        />
                      </Table.Td>
                      <Table.Td>
                        <TextInput
                          type="time"
                          value={schedule.time_close}
                          onChange={(e) => handleScheduleChange(index, 'time_close', e.target.value)}
                          styles={{ input: { borderRadius: 8, height: 32, textAlign: 'center' } }}
                        />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          )}

          <Text size="xs" c="dimmed" ta="center">
            Set the operating hours for this branch. Leave blank if closed on a specific day.
          </Text>
        </Stack>
      </Box>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <Box 
        p="lg" 
        style={{ 
          borderTop: '1px solid var(--theme-border)',
          background: 'var(--theme-surface)',
          flexShrink: 0
        }}
      >
        <Group justify="flex-end">
          <Button 
            variant="default" 
            onClick={() => onClose(false)}
            radius="xl"
            style={{ fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={loadingData}
            radius="xl"
            leftSection={<IconCheck size={18} />}
            color="var(--theme-primary)"
            style={{ 
              fontWeight: 700,
              paddingLeft: 24,
              paddingRight: 24,
              boxShadow: '0 4px 12px rgba(var(--theme-primary-rgb), 0.2)'
            }}
          >
            Update Schedule
          </Button>
        </Group>
      </Box>
    </Modal>
  );
};

export default ScheduleEditor;
