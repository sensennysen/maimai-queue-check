import { useState, useEffect } from 'react';
import { Modal, Stack, Group, SimpleGrid, TextInput, Select, MultiSelect, Switch, Divider, Paper, Input, Box, Text, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSettings, IconCheck, IconLink } from '@tabler/icons-react';
import { userService } from '../../services/supabase';

const ProfileSettingsModal = ({ opened, onClose, userId, initialData, allBranches, onSuccess }) => {
  const [displayName, setDisplayName] = useState('');
  const [queueName, setQueueName] = useState('');
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [selectedMainBranch, setSelectedMainBranch] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [slug, setSlug] = useState('');
  const [privacySettings, setPrivacySettings] = useState({
    show_dx_rating: true,
    show_best_50: true,
    show_most_played: true,
    show_favorite_songs: true,
    show_playlists: true,
    show_main_branch: true,
    show_preferred_branches: true,
    show_introduction: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSlug, setIsSavingSlug] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDisplayName(initialData.display_name || '');
      setQueueName(initialData.user_roles?.queue_name || '');
      setSelectedBranches(initialData.preferred_branches?.map(String) || []);
      setSelectedMainBranch(initialData.main_branch ? String(initialData.main_branch) : null);
      setSlug(initialData.slug || '');
      setIsPublic(!!initialData.is_public);
      if (initialData.privacy_settings) {
        setPrivacySettings(initialData.privacy_settings);
      }
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
        main_branch: selectedMainBranch ? parseInt(selectedMainBranch, 10) : null,
        is_public: isPublic
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

  const handleUpdatePrivacy = async (key, value) => {
    const newSettings = { ...privacySettings, [key]: value };
    setPrivacySettings(newSettings);
    try {
      await userService.updatePrivacySettings(userId, newSettings);
      if (onSuccess) onSuccess();
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to update privacy settings', color: 'red' });
      setPrivacySettings(privacySettings);
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
              <Text fw={600} size="sm">Share Settings</Text>
            </Group>
          }
          labelPosition="center"
        />

        <Text size="xs" c="dimmed" ta="center" mt={-10}>
          Choose what to share in your public profile
        </Text>

        <Stack gap="md">
          <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
              <Switch
                label="Enable Public Profile"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.currentTarget.checked)}
                color="blue"
                description="Allows viewing of your profile even if they are not logged in"
              />

              <Input.Wrapper
                label="Custom Profile URL"
                mt="sm"
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
            </Stack>
          </Paper>

          <Box p="md" bg="var(--mantine-color-gray-light)" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
              <Stack gap="xs">
                <Text size="sm" fw={600}>Basics</Text>
                <Switch label="Home Branch" checked={privacySettings.show_main_branch} onChange={(e) => handleUpdatePrivacy('show_main_branch', e.currentTarget.checked)} />
                <Switch label="Preferred Branches" checked={privacySettings.show_preferred_branches} onChange={(e) => handleUpdatePrivacy('show_preferred_branches', e.currentTarget.checked)} />
                <Switch label="Introduction" checked={privacySettings.show_introduction !== false} onChange={(e) => handleUpdatePrivacy('show_introduction', e.currentTarget.checked)} />
              </Stack>
              <Stack gap="xs">
                <Text size="sm" fw={600}>Score Data</Text>
                <Switch label="Maimai Name" checked={privacySettings.show_maimai_name} onChange={(e) => handleUpdatePrivacy('show_maimai_name', e.currentTarget.checked)} />
                <Switch label="DX Rating" checked={privacySettings.show_dx_rating} onChange={(e) => handleUpdatePrivacy('show_dx_rating', e.currentTarget.checked)} />
                <Switch label="Best 50" checked={privacySettings.show_best_50} onChange={(e) => handleUpdatePrivacy('show_best_50', e.currentTarget.checked)} />
                <Switch label="Most Played" checked={privacySettings.show_most_played !== false} onChange={(e) => handleUpdatePrivacy('show_most_played', e.currentTarget.checked)} />
              </Stack>
              <Stack gap="xs">
                <Text size="sm" fw={600}>Collections</Text>
                <Switch label="Favorites" checked={privacySettings.show_favorite_songs} onChange={(e) => handleUpdatePrivacy('show_favorite_songs', e.currentTarget.checked)} />
                <Switch label="Playlists" checked={privacySettings.show_playlists} onChange={(e) => handleUpdatePrivacy('show_playlists', e.currentTarget.checked)} />
              </Stack>
            </SimpleGrid>
          </Box>
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
