import { useState, useEffect, useCallback } from 'react';
import { Modal, Stack, Text, Group, Button, MultiSelect, Loader, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { userService, branchService } from '../services/supabase';

const PreferencesModal = ({ opened, onClose, userId, initialPreferences = [], initialDisplayName = '', onSaveSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [displayName, setDisplayName] = useState(initialDisplayName);

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
      // Only set initial state once when the modal is opened
      setSelectedBranches(initialPreferences?.map(String) || []);
      setDisplayName(initialDisplayName || '');
    }
  }, [opened, initialDisplayName]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const branchOptions = branches.map(b => ({
    value: String(b.id),
    label: b.arcade_name
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600}>User Preferences</Text>}
      centered
      closeOnClickOutside={selectedBranches.length > 0}
      withCloseButton={selectedBranches.length > 0}
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
          <MultiSelect
            label="Preferred Branches"
            placeholder="Select one or more branches"
            data={branchOptions}
            value={selectedBranches}
            onChange={setSelectedBranches}
            searchable
            clearable
            maxDropdownHeight={200}
          />
        )}

        <Group justify="flex-end" mt="md">
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={selectedBranches.length === 0 || !displayName.trim()}
          >
            Save Preferences
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default PreferencesModal;
