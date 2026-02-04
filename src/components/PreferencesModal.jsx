import { useState, useEffect, useCallback } from 'react';
import { Modal, Stack, Text, Group, Button, MultiSelect, Loader, TextInput, ThemeIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { userService, branchService, requestService } from '../services/supabase';
import { IconCheck, IconX, IconClock } from '@tabler/icons-react';

const PreferencesModal = ({ opened, onClose, userId, userRoles, initialPreferences = [], initialDisplayName = '', onSaveSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [displayName, setDisplayName] = useState(initialDisplayName);

  // Request state
  const [requests, setRequests] = useState([]);
  const [requesting, setRequesting] = useState({}); // { branchId: boolean }

  const loadBranches = useCallback(async () => {
    try {
      setLoading(true);
      const data = await branchService.getAllBranches();
      setBranches(data);
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to load branches',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      const data = await requestService.getUserRequests(userId);
      setRequests(data);
    } catch (e) {
      console.error("Failed to load requests", e);
    }
  }, [userId]);

  useEffect(() => {
    if (opened) {
      loadBranches();
      loadRequests();
      // Only set initial state once when the modal is opened
      setSelectedBranches(initialPreferences?.map(String) || []);
      setDisplayName(initialDisplayName || '');
    }
  }, [opened, initialDisplayName, loadRequests]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    try {
      setSaving(true);
      const branchIds = selectedBranches.map(Number);

      await userService.updatePreferences(userId, {
        branchIds,
        displayName: displayName.trim()
      });

      notifications.show({
        title: 'Success',
        message: 'Preferences updated',
        color: 'green',
      });

      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update preferences',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRequestAccess = async (branchId) => {
    try {
      setRequesting(prev => ({ ...prev, [branchId]: true }));
      await requestService.createRequest(userId, branchId);
      notifications.show({
        title: 'Request Sent',
        message: 'Admin has been notified.',
        color: 'green'
      });
      await loadRequests();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to send request',
        color: 'red'
      });
    } finally {
      setRequesting(prev => ({ ...prev, [branchId]: false }));
    }
  };

  const branchOptions = branches.map(b => ({
    value: String(b.id),
    label: b.arcade_name
  }));

  // Determine which branches need access requests
  // Filter selected branches that are NOT in can_edit_on
  const branchesNeedingAccess = selectedBranches
    .map(id => branches.find(b => String(b.id) === id))
    .filter(b => b && (!userRoles?.can_edit_on?.includes(b.id)));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600}>User Preferences</Text>}
      centered
      size="lg"
    >
      <Stack gap="md">
        <TextInput
          label="Display Name"
          placeholder="Enter your display name"
          value={displayName}
          onChange={(event) => setDisplayName(event.currentTarget.value)}
          required
          style={{ marginTop: '1rem' }}
        />

        {loading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" />
          </Group>
        ) : (
          <>
            <MultiSelect
              label="Preferred Branches"
              description="Select branches you frequently visit."
              placeholder="Select one or more branches"
              data={branchOptions}
              value={selectedBranches}
              onChange={setSelectedBranches}
              searchable
              clearable
              maxDropdownHeight={200}
            />

            {branchesNeedingAccess.length > 0 && (
              <Stack gap="xs" mt="sm">
                <Text size="sm" fw={500}>Request Edit Access</Text>
                <Text size="xs" c="dimmed">
                  Request edit access for your preferred branches if you are a local admin.
                </Text>
                {branchesNeedingAccess.map(branch => {
                  const existingRequest = requests.find(r => r.branch_id === branch.id);
                  const isPending = existingRequest?.status === 'pending';
                  const isRejected = existingRequest?.status === 'rejected';

                  return (
                    <Group key={branch.id} justify="space-between" p="xs" style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 4 }}>
                      <Text size="sm">{branch.arcade_name}</Text>
                      {isPending ? (
                        <Group gap={4}>
                          <ThemeIcon color="yellow" variant="light" size="sm"><IconClock size={12} /></ThemeIcon>
                          <Text size="xs" c="yellow">Pending</Text>
                        </Group>
                      ) : isRejected ? (
                        <Group gap={4}>
                          <ThemeIcon color="red" variant="light" size="sm"><IconX size={12} /></ThemeIcon>
                          <Text size="xs" c="red">Rejected</Text>
                        </Group>
                      ) : (
                        <Button
                          size="xs"
                          variant="light"
                          compact
                          onClick={() => handleRequestAccess(branch.id)}
                          loading={requesting[branch.id]}
                        >
                          Request Access
                        </Button>
                      )}
                    </Group>
                  );
                })}
              </Stack>
            )}
          </>
        )}

        <Group justify="flex-end" mt="md">
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={!displayName.trim()}
          >
            Save Preferences
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default PreferencesModal;
