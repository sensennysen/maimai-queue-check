import { useState, useEffect, useCallback } from 'react';
import { Modal, Stack, Text, Group, Button, MultiSelect, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { userService, branchService } from '../services/supabase';

const PreferredBranchesModal = ({ opened, onClose, userId, initialPreferences = [], onSaveSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);

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

  useEffect(() => {
    if (opened) {
      loadBranches();
      // Only set initial selection once when the modal is opened
      setSelectedBranches(initialPreferences?.map(String) || []);
    }
    // We explicitly only want to run this when the modal is opened or initialPreferences reference changes from parent
    // but the crash occurs because initialPreferences=[''] (or undefined) is recreated on every render of the modal.
    // By only using 'opened' as a trigger, we avoid the loop caused by internal re-renders.
  }, [opened]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    try {
      setSaving(true);
      // Convert selected strings back to numbers
      const branchIds = selectedBranches.map(Number);

      await userService.updatePreferences(userId, branchIds);

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

  const branchOptions = branches.map(b => ({
    value: String(b.id),
    label: b.arcade_name
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600}>Select Preferred Branches</Text>}
      centered
      closeOnClickOutside={selectedBranches.length > 0} // Prevent closing if forced (empty)
      withCloseButton={selectedBranches.length > 0}     // Prevent closing if forced (empty) - optional, based on UX
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Choose the branches you frequent. This helps us customize your experience.
        </Text>

        {loading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" />
          </Group>
        ) : (
          <MultiSelect
            label="Preferred Branches"
            placeholder="Select one or more branches"
            data={branchOptions}
            value={selectedBranches}
            onChange={setSelectedBranches}
            searchable
            clearable
            maxDropdownHeight={200}
            required
            error={selectedBranches.length === 0 ? 'Please select at least one branch' : null}
          />
        )}

        <Group justify="flex-end" mt="md">
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={selectedBranches.length === 0}
          >
            Save Preferences
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default PreferredBranchesModal;
