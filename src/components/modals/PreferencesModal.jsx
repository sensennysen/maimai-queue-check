import { useState, useEffect } from 'react';
import { Modal, Stack, Text, Group, Button, MultiSelect, Loader, TextInput, SegmentedControl } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { userService } from '../../services/supabase';
import { useBranch } from '../../contexts/BranchContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import MaimaiProfileSection from './MaimaiProfileSection';

const PreferencesModal = ({ opened, onClose, userId, initialPreferences = [], initialDisplayName = '', onSaveSuccess }) => {
  const { branches, loading } = useBranch();
  const { currentTheme, setTheme } = useTheme();
  const { userRoles } = useAuth(); // Get latest user data including maimai fields

  const [saving, setSaving] = useState(false);
  const [maimaiSaving, setMaimaiSaving] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);

  useEffect(() => {
    if (opened) {
      // Only set initial state once when the modal is opened
      setSelectedBranches(initialPreferences?.map(String) || []);
      setDisplayName(initialDisplayName || '');
      setSelectedTheme(currentTheme);
    }
  }, [opened, initialDisplayName, currentTheme]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    try {
      setSaving(true);

      // Update local theme state
      setTheme(selectedTheme);

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

  const handleMaimaiSave = async (newName) => {
    try {
      setMaimaiSaving(true);
      await userService.updateMaimaiProfile(userId, {
        maimaiDxName: newName
      });

      notifications.show({
        title: 'Success',
        message: 'Maimai profile updated',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update Maimai profile',
        color: 'red',
      });
    } finally {
      setMaimaiSaving(false);
    }
  };

  const branchOptions = branches.map(b => ({
    value: String(b.id),
    label: b.short_name || b.arcade_name
  }));

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
          onChange={(event) => {
            const val = event.currentTarget.value;
            const filtered = val.replace(/[^a-zA-Z0-9 @#!\-_.,&'()]/g, '');
            setDisplayName(filtered);
          }}
          required
          maxLength={10}
          style={{ marginTop: '1rem' }}
        />

        <Stack gap="xs">
          <Text size="sm" fw={500}>App Theme</Text>
          <SegmentedControl
            value={selectedTheme}
            onChange={setSelectedTheme}
            data={[
              { label: 'Circle', value: 'circle' },
              { label: 'Prism', value: 'prism' },
              { label: 'Buddies', value: 'buddies' },
            ]}
            fullWidth
          />
        </Stack>

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

        {/* Maimai Profile Section */}
        <MaimaiProfileSection
          maimaiDxName={userRoles?.maimai_dx_name}
          maimaiRating={userRoles?.maimai_rating}
          onSave={handleMaimaiSave}
          loading={maimaiSaving}
        />
      </Stack>
    </Modal>
  );
};

export default PreferencesModal;
