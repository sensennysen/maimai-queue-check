import { useState, useEffect } from 'react';
import { Modal, Stack, Text, Group, Button, MultiSelect, Loader, TextInput, SegmentedControl } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { userService } from '../../services/supabase';
import { useBranch } from '../../contexts/BranchContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { EXPERIMENTAL_FEATURES } from '../../constants/featureFlags';
import { Switch, Alert, Card } from '@mantine/core';
import IconFlask from '@tabler/icons-react/dist/esm/icons/IconFlask.mjs';

const ExperimentalFeaturesSection = () => {
  const { experimentalEnabled, flags, toggleExperimentalFeatures, toggleFlag, isLoading } = useFeatureFlags();

  if (isLoading) return <Loader size="sm" />;

  return (
    <Stack gap="sm" mt="md">
      <Group justify="space-between">
        <Group gap="xs">
          <IconFlask size={18} />
          <Text fw={600}>Experimental Features</Text>
        </Group>
        <Switch
          checked={experimentalEnabled}
          onChange={(event) => toggleExperimentalFeatures(event.currentTarget.checked)}
        />
      </Group>

      {experimentalEnabled && (
        <Stack gap="xs" pl="md" style={{ borderLeft: '2px solid var(--mantine-color-gray-3)' }}>
          <Alert variant="light" color="blue" title="Heads up!" icon={<IconFlask size={16} />}>
            These features are work-in-progress and may be unstable.
          </Alert>

          {EXPERIMENTAL_FEATURES.map(feature => (
            <Card key={feature.id} withBorder padding="sm" radius="md">
              <Group justify="space-between" align="start">
                <Stack gap={4} style={{ flex: 1 }}>
                  <Text fw={500} size="sm">{feature.label}</Text>
                  <Text size="xs" c="dimmed">{feature.description}</Text>
                </Stack>
                <Switch
                  checked={!!flags[feature.id]}
                  onChange={(event) => toggleFlag(feature.id, event.currentTarget.checked)}
                />
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
};

const PreferencesModal = ({ opened, onClose, userId, initialPreferences = [], initialDisplayName = '', onSaveSuccess }) => {
  const { branches, loading } = useBranch();
  const { currentTheme, setTheme } = useTheme();
  useAuth(); // Ensure auth context is available

  const [saving, setSaving] = useState(false);
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

        <ExperimentalFeaturesSection />

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
