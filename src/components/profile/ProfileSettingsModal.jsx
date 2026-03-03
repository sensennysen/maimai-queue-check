import { useState, useEffect } from 'react';
import { Modal, Stack, Group, SimpleGrid, TextInput, Select, MultiSelect, Divider, Paper, Input, Text, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSettings, IconCheck, IconLink } from '@tabler/icons-react';
import { userService } from '../../services/supabase';

const ProfileSettingsModal = ({ opened, onClose, userId, initialData, allBranches, onSuccess }) => {
  const [displayName, setDisplayName] = useState('');
  const [queueName, setQueueName] = useState('');
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [selectedMainBranch, setSelectedMainBranch] = useState(null);
  const [slug, setSlug] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSlug, setIsSavingSlug] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDisplayName(initialData.display_name || '');
      setQueueName(initialData.user_roles?.queue_name || '');
      setSelectedBranches(initialData.preferred_branches?.map(String) || []);
      setSelectedMainBranch(initialData.main_branch ? String(initialData.main_branch) : null);
      setSlug(initialData.slug || '');
    }
  }, [initialData, opened]);

  const handleSavePreferences = async () => {
    if (!displayName.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Display name cannot be empty',
        color: 'red',
      });
      return;
    }

    try {
      setIsSaving(true);
      await userService.updatePreferences(userId, {
        display_name: displayName.trim(),
        queue_name: queueName.trim() || null,
        branch_ids: selectedBranches.map(Number),
        main_branch: selectedMainBranch ? parseInt(selectedMainBranch, 10) : null
      });

      notifications.show({
        title: 'Success',
        message: 'Preferences updated successfully',
        color: 'green',
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (e) {
      notifications.show({
        title: 'Error',
        message: e.message || 'Failed to update preferences',
        color: 'red',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSlug = async () => {
    setIsSavingSlug(true);
    try {
      await userService.updateProfileSlug(userId, slug);
      notifications.show({
        title: 'Success',
        message: 'Profile URL updated successfully',
        color: 'green',
      });
      if (onSuccess) onSuccess(slug);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update profile URL',
        color: 'red'
      });
    } finally {
      setIsSavingSlug(false);
    }
  };



  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Group gap="xs"><IconSettings size={18} /><Text fw={600}>Profile Settings</Text></Group>}
      size="lg"
      centered
    >
      <Stack gap="md" pt="md">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" align="flex-start">
          <TextInput
            label="Display Name"
            placeholder="Enter your display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.currentTarget.value)}
            maxLength={20}
            description="Shown as your profile heading"
          />
          <TextInput
            label="Queue Name"
            placeholder="Enter your queue name"
            value={queueName}
            onChange={(e) => setQueueName(e.currentTarget.value.slice(0, 10))}
            maxLength={10}
            description="Used in queue autocomplete (max 10 chars)"
          />
          <Select
            label="Home Branch"
            placeholder="Select your main branch"
            data={allBranches.map(b => ({ value: String(b.id), label: b.short_name || b.arcade_name }))}
            value={selectedMainBranch}
            onChange={setSelectedMainBranch}
            searchable
            description="Your primary arcade branch"
            clearable
          />
        </SimpleGrid>

        <MultiSelect
          label="Preferred Branches"
          placeholder="Select one or more branches"
          data={allBranches.map(b => ({ value: String(b.id), label: b.short_name || b.arcade_name }))}
          value={selectedBranches}
          onChange={setSelectedBranches}
          searchable
          clearable
        />

        <Divider
          label={
            <Group gap="xs">
              <Text fw={600} size="sm">Profile URL</Text>
            </Group>
          }
          labelPosition="center"
        />

        <Stack gap="md">
          <Paper withBorder p="md" radius="md">
            <Input.Wrapper
              label="Custom Profile URL"
              description={initialData?.slug ? "Profile URL can be changed once every 60 days." : "Set a permanent custom URL for your profile (min 3 chars)."}
            >
              <Group gap="xs" align="flex-start" mt={5}>
                <TextInput
                  placeholder="my-cool-profile"
                  value={slug}
                  onChange={(e) => setSlug(e.currentTarget.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  maxLength={20}
                  leftSection={<IconLink size={16} />}
                  style={{ flex: 1 }}
                  disabled={!!initialData?.slug_updated_at}
                />
                {!initialData?.slug_updated_at && (
                  <Button
                    onClick={handleUpdateSlug}
                    loading={isSavingSlug}
                    disabled={slug === (initialData?.slug || '') || slug.length < 3}
                  >
                    Save URL
                  </Button>
                )}
              </Group>
            </Input.Wrapper>
          </Paper>
        </Stack>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSavePreferences} loading={isSaving} leftSection={<IconCheck size={18} />}>
            Save Preferences
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default ProfileSettingsModal;
