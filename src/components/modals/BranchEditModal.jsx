import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  NumberInput,
  Button,
  Group,
  Title,
  Text,
  Divider,
  Paper,
  Checkbox,
  Table,
  ScrollArea,
} from '@mantine/core';
import IconMapPin from '@tabler/icons-react/dist/esm/icons/IconMapPin.mjs';
import IconBuildingStore from '@tabler/icons-react/dist/esm/icons/IconBuildingStore.mjs';
import IconClock from '@tabler/icons-react/dist/esm/icons/IconClock.mjs';
import { notifications } from '@mantine/notifications';
import { adminService } from '../../services/supabase';
import { requestUserLocation } from '../../services/geolocation';
import './BranchEditModal.css';

import { DAYS_OF_WEEK } from '../../utils/constants';

const BranchEditModal = ({ opened, onClose, mode = 'create', branchToEdit = null }) => {
  // Branch form state
  const [arcadeName, setArcadeName] = useState('');
  const [shortName, setShortName] = useState('');
  const [acronym, setAcronym] = useState('');
  const [longitude, setLongitude] = useState('');
  const [latitude, setLatitude] = useState('');
  const [cabCount, setCabCount] = useState(1);
  const [enabled, setEnabled] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Schedule form state
  const [schedules, setSchedules] = useState(
    DAYS_OF_WEEK.map(day => ({
      day,
      time_open: '10:00',
      time_close: '22:00'
    }))
  );

  // UI state
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = branch form, 2 = schedule form

  // Pre-populate form when editing
  useEffect(() => {
    if (opened && mode === 'edit' && branchToEdit) {
      setArcadeName(branchToEdit.arcade_name);
      setShortName(branchToEdit.short_name || '');
      setAcronym(branchToEdit.acronym || '');
      setLatitude(branchToEdit.latitude.toString());
      setLongitude(branchToEdit.longitude.toString());
      setCabCount(branchToEdit.cab_count);
      setEnabled(branchToEdit.enabled);
    } else if (opened && mode === 'create') {
      // Reset form for create mode
      resetForm();
    }
  }, [opened, mode, branchToEdit]);

  const handleUseCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const location = await requestUserLocation();
      setLatitude(location.latitude.toString());
      setLongitude(location.longitude.toString());
      notifications.show({
        title: 'Location Retrieved',
        message: 'Your current location has been set',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Location Error',
        message: error.message || 'Failed to get your location',
        color: 'red',
      });
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleBranchSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!arcadeName.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Arcade name is required',
        color: 'red',
      });
      return;
    }

    if (latitude || longitude) {
      if (!latitude || !longitude) {
        notifications.show({
          title: 'Validation Error',
          message: 'Both latitude and longitude must be provided if you want to set coordinates',
          color: 'red',
        });
        return;
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        notifications.show({
          title: 'Validation Error',
          message: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180',
          color: 'red',
        });
        return;
      }
    }

    if (cabCount < 1) {
      notifications.show({
        title: 'Validation Error',
        message: 'Cabinet count must be at least 1',
        color: 'red',
      });
      return;
    }

    const branchData = {
      arcade_name: arcadeName.trim(),
      short_name: shortName.trim(),
      acronym: acronym.trim().toUpperCase(),
      longitude: longitude ? parseFloat(longitude) : null,
      latitude: latitude ? parseFloat(latitude) : null,
      cab_count: cabCount,
      enabled,
    };

    if (mode === 'edit' && branchToEdit) {
      // Update existing branch
      setLoading(true);
      try {
        await adminService.updateBranch(branchToEdit.id, branchData);
        notifications.show({
          title: 'Branch Updated',
          message: `${arcadeName} has been updated successfully`,
          color: 'green',
        });
        // Close and refresh parent
        handleClose(true);
      } catch (error) {
        notifications.show({
          title: 'Error',
          message: error.message || 'Failed to update branch',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Create mode: just advance to step 2 (no DB call yet)
      setStep(2);
    }
  };

  const handleScheduleChange = (index, field, value) => {
    const newSchedules = [...schedules];
    newSchedules[index][field] = value;
    setSchedules(newSchedules);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const validSchedules = [];
    for (const schedule of schedules) {
      // If both are empty, that means no schedule for this day (valid)
      if (!schedule.time_open && !schedule.time_close) {
        continue;
      }

      // If only one is provided
      if (!schedule.time_open || !schedule.time_close) {
        notifications.show({
          title: 'Validation Error',
          message: `Please fill in both opening and closing times for ${schedule.day}, or leave both blank if closed.`,
          color: 'red',
        });
        return;
      }

      // Validate time format (HH:MM or H:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(schedule.time_open.trim()) || !timeRegex.test(schedule.time_close.trim())) {
        notifications.show({
          title: 'Validation Error',
          message: `Invalid time format for ${schedule.day}. Use HH:MM format`,
          color: 'red',
        });
        return;
      }

      validSchedules.push(schedule);
    }

    setLoading(true);
    try {
      // Create branch first
      const branchData = {
        arcade_name: arcadeName.trim(),
        short_name: shortName.trim(),
        acronym: acronym.trim().toUpperCase(),
        longitude: longitude ? parseFloat(longitude) : null,
        latitude: latitude ? parseFloat(latitude) : null,
        cab_count: cabCount,
        enabled,
      };
      const newBranch = await adminService.createBranch(branchData);

      // Then create schedules with the new branch ID
      if (validSchedules.length > 0) {
        const scheduleData = validSchedules.map(schedule => ({
          branch_id: newBranch.id,
          day: schedule.day,
          time_open: schedule.time_open.trim(),
          time_close: schedule.time_close.trim(),
        }));
        await adminService.createMallSchedules(scheduleData);
      }

      notifications.show({
        title: 'Success',
        message: `${arcadeName} and its schedules have been created successfully`,
        color: 'green',
      });

      // Reset form and close, refresh parent
      handleClose(true);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to create branch',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setArcadeName('');
    setShortName('');
    setAcronym('');
    setLongitude('');
    setLatitude('');
    setCabCount(1);
    setEnabled(true);
    setSchedules(
      DAYS_OF_WEEK.map(day => ({
        day,
        time_open: '10:00',
        time_close: '22:00'
      }))
    );
    setStep(1);
  };

  const handleClose = (shouldRefresh = false) => {
    resetForm();
    onClose(shouldRefresh);
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconBuildingStore size={24} />
          <Title order={3}>{mode === 'edit' ? 'Edit Branch' : 'Add a Branch'}</Title>
        </Group>
      }
      size="lg"
      centered
    >
      <Stack gap="md">
        {step === 1 ? (
          // Branch Form
          <form onSubmit={handleBranchSubmit}>
            <Stack gap="md">
              <Text size="sm" c="secondary" fw={500} style={{ marginTop: '1rem' }}>
                {mode === 'edit' ? 'Edit Branch Information' : 'Step 1 of 2: Branch Information'}
              </Text>

              <TextInput
                label="Arcade Name"
                placeholder="Enter arcade name"
                value={arcadeName}
                onChange={(e) => setArcadeName(e.target.value)}
                required
                leftSection={<IconBuildingStore size={16} />}
              />

              <Group grow>
                <TextInput
                  label="Short Name"
                  placeholder="e.g. SM North"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  leftSection={<IconBuildingStore size={16} />}
                />
                <TextInput
                  label="Acronym"
                  placeholder="e.g. SMN"
                  value={acronym}
                  onChange={(e) => setAcronym(e.target.value.toUpperCase())}
                  leftSection={<IconBuildingStore size={16} />}
                />
              </Group>

              <Divider label="Location" labelPosition="center" />

              <Group grow>
                <NumberInput
                  label="Latitude"
                  placeholder="e.g., 14.5995"
                  value={latitude}
                  onChange={(value) => setLatitude(value === '' ? '' : value.toString())}
                  decimalScale={6}
                  step={0.000001}
                  hideControls
                />
                <NumberInput
                  label="Longitude"
                  placeholder="e.g., 120.9842"
                  value={longitude}
                  onChange={(value) => setLongitude(value === '' ? '' : value.toString())}
                  decimalScale={6}
                  step={0.000001}
                  hideControls
                />
              </Group>

              <Button
                variant="light"
                leftSection={<IconMapPin size={16} />}
                onClick={handleUseCurrentLocation}
                loading={loadingLocation}
                fullWidth
              >
                Use Current Location
              </Button>

              <NumberInput
                label="Cabinet Count"
                placeholder="Number of cabinets"
                value={cabCount}
                onChange={(value) => setCabCount(value)}
                required
                min={1}
                step={1}
              />

              <Checkbox
                label="Enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.currentTarget.checked)}
              />

              <Group justify="flex-end" mt="md">
                <Button variant="subtle" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  {mode === 'edit' ? 'Update Branch' : 'Next: Set Schedule'}
                </Button>
              </Group>
            </Stack>
          </form>
        ) : (
          // Schedule Form
          <form onSubmit={handleScheduleSubmit}>
            <Stack gap="md">
              <Text size="sm" c="secondary" fw={500} style={{ marginTop: '1rem' }}>
                {mode === 'edit' ? 'Editing Branch' : 'Creating Branch'}: {arcadeName}
              </Text>

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
                              leftSection={<IconClock size={16} />}
                              styles={{ input: { textAlign: 'center' } }}
                            />
                          </Table.Td>
                          <Table.Td>
                            <TextInput
                              type="time"
                              value={schedule.time_close}
                              onChange={(e) => handleScheduleChange(index, 'time_close', e.target.value)}
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

              <Group justify="space-between" mt="md">
                <Button variant="subtle" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Group>
                  <Button variant="subtle" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={loading}>
                    Create Branch
                  </Button>
                </Group>
              </Group>
            </Stack>
          </form>
        )}
      </Stack>
    </Modal>
  );
};

export default BranchEditModal;
