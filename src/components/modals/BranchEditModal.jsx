import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  NumberInput,
  Button,
  Group,
  Text,
  Checkbox,
  Table,
  ScrollArea,
  Select,
  Box,
  UnstyledButton,
} from '@mantine/core';
import IconMapPin from '@tabler/icons-react/dist/esm/icons/IconMapPin.mjs';
import IconBuildingStore from '@tabler/icons-react/dist/esm/icons/IconBuildingStore.mjs';
import IconChevronLeft from '@tabler/icons-react/dist/esm/icons/IconChevronLeft.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconArrowRight from '@tabler/icons-react/dist/esm/icons/IconArrowRight.mjs';
import { notifications } from '@mantine/notifications';
import { adminService, supabase } from '../../services/supabase';
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
  const [regionId, setRegionId] = useState(null);
  const [regions, setRegions] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
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
      setLatitude(branchToEdit.latitude?.toString() || '');
      setLongitude(branchToEdit.longitude?.toString() || '');
      setCabCount(branchToEdit.cab_count);
      setEnabled(branchToEdit.enabled);
      setRegionId(branchToEdit.region_id?.toString() || null);
    } else if (opened && mode === 'create') {
      // Reset form for create mode
      resetForm();
    }
  }, [opened, mode, branchToEdit]);

  // Fetch regions on mount
  useEffect(() => {
    const fetchRegions = async () => {
      setLoadingRegions(true);
      try {
        const { data, error } = await supabase
          .from('places_regions')
          .select('id, name')
          .order('name');
        if (error) throw error;
        setRegions(data.map(r => ({ value: r.id.toString(), label: r.name })));
      } catch (error) {
        console.error('Failed to fetch regions:', error);
      } finally {
        setLoadingRegions(false);
      }
    };

    if (opened) {
      fetchRegions();
    }
  }, [opened]);

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
    e?.preventDefault();

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
      region_id: regionId ? parseInt(regionId, 10) : null,
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
        region_id: regionId ? parseInt(regionId, 10) : null,
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
    setRegionId(null);
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
      aria-label={mode === 'edit' ? 'Edit Branch' : 'Add Branch'}
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
            <IconBuildingStore size={18} color="var(--theme-primary-contrast)" strokeWidth={2.2} />
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
              {mode === 'edit' ? 'Edit Branch' : 'Add Branch'}
            </Text>
            <Text size="xs" style={{ color: 'var(--theme-primary-contrast)', opacity: 0.8, marginTop: 2 }}>
              {step === 1 ? 'Details & Location' : 'Operating Schedule'}
            </Text>
          </Box>
        </Group>

        <UnstyledButton
          onClick={() => handleClose(false)}
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
          {step === 1 ? (
            <Stack gap="md">
              {/* General Info */}
              <Box
                style={{
                  padding: '16px 20px',
                  borderRadius: 18,
                  background: 'var(--theme-surface)',
                  border: '1px solid var(--theme-border)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                }}
              >
                <Text size="xs" fw={700} c="dimmed" mb="md" style={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Branch Details
                </Text>
                <Stack gap="sm">
                  <TextInput
                    label="Arcade Name"
                    placeholder="e.g. Quantum Amusement"
                    value={arcadeName}
                    onChange={(e) => setArcadeName(e.target.value)}
                    required
                    styles={{ input: { borderRadius: 10, background: 'var(--theme-bg-soft)' } }}
                  />
                  <Group grow>
                    <TextInput
                      label="Short Name"
                      placeholder="e.g. SM North"
                      value={shortName}
                      onChange={(e) => setShortName(e.target.value)}
                      styles={{ input: { borderRadius: 10, background: 'var(--theme-bg-soft)' } }}
                    />
                    <TextInput
                      label="Acronym"
                      placeholder="e.g. SMN"
                      value={acronym}
                      onChange={(e) => setAcronym(e.target.value.toUpperCase())}
                      styles={{ input: { borderRadius: 10, textTransform: 'uppercase', background: 'var(--theme-bg-soft)' } }}
                    />
                  </Group>
                  <Group grow align="flex-end">
                    <Select
                      label="Region"
                      placeholder="Select region"
                      data={regions}
                      value={regionId}
                      onChange={setRegionId}
                      clearable
                      searchable
                      loading={loadingRegions}
                      comboboxProps={{ withinPortal: false, position: 'bottom' }}
                      styles={{ input: { borderRadius: 10, background: 'var(--theme-bg-soft)' } }}
                    />
                    <NumberInput
                      label="Cabinets"
                      value={cabCount}
                      onChange={(v) => setCabCount(v)}
                      min={1}
                      styles={{ input: { borderRadius: 10, background: 'var(--theme-bg-soft)' } }}
                    />
                  </Group>
                  <Checkbox
                    label="Active & Visible"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.currentTarget.checked)}
                    mt="xs"
                  />
                </Stack>
              </Box>

              {/* Location Info */}
              <Box
                style={{
                  padding: '16px 20px',
                  borderRadius: 18,
                  background: 'var(--theme-surface)',
                  border: '1px solid var(--theme-border)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                }}
              >
                <Group justify="space-between" mb="md">
                  <Text size="xs" fw={700} c="dimmed" style={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Coordinates
                  </Text>
                  <Button
                    size="compact-xs"
                    variant="light"
                    leftSection={<IconMapPin size={12} />}
                    loading={loadingLocation}
                    onClick={handleUseCurrentLocation}
                    radius="md"
                    style={{ fontWeight: 700 }}
                  >
                    Use Current
                  </Button>
                </Group>
                
                <Group grow>
                  <NumberInput
                    label="Latitude"
                    placeholder="e.g. 14.5995"
                    value={latitude}
                    onChange={(v) => setLatitude(v.toString())}
                    decimalScale={6}
                    hideControls
                    styles={{ input: { borderRadius: 10, background: 'var(--theme-bg-soft)' } }}
                  />
                  <NumberInput
                    label="Longitude"
                    placeholder="e.g. 120.9842"
                    value={longitude}
                    onChange={(v) => setLongitude(v.toString())}
                    decimalScale={6}
                    hideControls
                    styles={{ input: { borderRadius: 10, background: 'var(--theme-bg-soft)' } }}
                  />
                </Group>
                <Text size="xs" c="dimmed" mt="xs">
                  Required for region-based filtering and distance calculation.
                </Text>
              </Box>
            </Stack>
          ) : (
            <Stack gap="md">
              {/* Schedule Form */}
              <Box
                style={{
                  borderRadius: 18,
                  overflow: 'hidden',
                  background: 'var(--theme-surface)',
                  border: '1px solid var(--theme-border)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                }}
              >
                <ScrollArea h={400}>
                  <Table verticalSpacing="sm">
                    <Table.Thead style={{ background: 'var(--theme-bg-soft)' }}>
                      <Table.Tr>
                        <Table.Th style={{ paddingLeft: 20 }}>Day</Table.Th>
                        <Table.Th style={{ textAlign: 'center' }}>Open</Table.Th>
                        <Table.Th style={{ textAlign: 'center' }}>Close</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {schedules.map((schedule, index) => (
                        <Table.Tr key={schedule.day}>
                          <Table.Td style={{ paddingLeft: 20 }}>
                            <Text size="sm" fw={700}>{schedule.day}</Text>
                          </Table.Td>
                          <Table.Td>
                            <TextInput
                              type="time"
                              value={schedule.time_open}
                              onChange={(e) => handleScheduleChange(index, 'time_open', e.target.value)}
                              styles={{ input: { borderRadius: 8, height: 32, textAlign: 'center', background: 'var(--theme-bg-soft)' } }}
                            />
                          </Table.Td>
                          <Table.Td>
                            <TextInput
                              type="time"
                              value={schedule.time_close}
                              onChange={(e) => handleScheduleChange(index, 'time_close', e.target.value)}
                              styles={{ input: { borderRadius: 8, height: 32, textAlign: 'center', background: 'var(--theme-bg-soft)' } }}
                            />
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Box>
              <Text size="xs" c="dimmed" ta="center">
                Check-ins are allowed between these hours.
              </Text>
            </Stack>
          )}
        </Stack>
      </Box>

      {/* ── Footer Actions ───────────────────────────────────────── */}
      <Box 
        p="lg" 
        style={{ 
          borderTop: '1px solid var(--theme-border)',
          background: 'var(--theme-surface)',
          flexShrink: 0
        }}
      >
        <Group justify="space-between">
          {step === 2 ? (
            <Button
              variant="subtle"
              leftSection={<IconChevronLeft size={16} />}
              onClick={() => setStep(1)}
              radius="xl"
              style={{ fontWeight: 600 }}
            >
              Back to Details
            </Button>
          ) : (
            <Box />
          )}

          <Group gap="sm">
            <Button 
              variant="default" 
              onClick={() => handleClose(false)} 
              radius="xl"
              style={{ fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              onClick={step === 1 ? handleBranchSubmit : handleScheduleSubmit}
              loading={loading}
              radius="xl"
              rightSection={step === 1 && mode === 'create' ? <IconArrowRight size={18} /> : <IconCheck size={18} />}
              color="var(--theme-primary)"
              style={{ 
                fontWeight: 700,
                paddingLeft: 24,
                paddingRight: 24,
                boxShadow: '0 4px 12px rgba(var(--theme-primary-rgb), 0.2)'
              }}
            >
              {mode === 'edit' ? 'Save Changes' : step === 1 ? 'Next: Schedule' : 'Create Branch'}
            </Button>
          </Group>
        </Group>
      </Box>
    </Modal>
  );
};

export default BranchEditModal;
