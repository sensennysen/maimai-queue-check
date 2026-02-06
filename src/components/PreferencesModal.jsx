import { useState, useEffect } from 'react';
import { Modal, Stack, Text, Group, Button, MultiSelect, Loader, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { userService } from '../services/supabase';
import { useBranch } from '../contexts/BranchContext';

const PreferencesModal = ({ opened, onClose, userId, initialPreferences = [], initialDisplayName = '', onSaveSuccess }) => {
  const { branches, loading } = useBranch();
  const [saving, setSaving] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [displayName, setDisplayName] = useState(initialDisplayName);

  useEffect(() => {
    if (opened) {
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
    >
      <Stack gap="md">
        <TextInput
          label="Display Name"
          placeholder="Enter your display name"
          value={displayName}
          onChange={(event) => {
            const val = event.currentTarget.value;
            if (/^[a-zA-Z0-9]*$/.test(val)) {
              setDisplayName(val);
            }
          }}
          required
          maxLength={10}
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
