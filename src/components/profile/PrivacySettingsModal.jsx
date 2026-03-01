import { useState, useEffect } from 'react';
import { Modal, Stack, Group, SimpleGrid, Switch, Paper, Box, Text, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconLock, IconCheck } from '@tabler/icons-react';
import { userService } from '../../services/supabase';

const PrivacySettingsModal = ({ opened, onClose, userId, initialData, onSuccess }) => {
  const [isPublic, setIsPublic] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    show_dx_rating: true,
    show_best_50: true,
    show_best_50_details: false,
    show_most_played: true,
    show_most_played_details: false,
    show_favorite_songs: true,
    show_playlists: true,
    show_main_branch: true,
    show_preferred_branches: true,
    show_introduction: true,
    show_play_count: true,
    show_maimai_name: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData && opened) {
      setIsPublic(!!initialData.is_public);
      if (initialData.privacy_settings) {
        setPrivacySettings({
          ...privacySettings,
          ...initialData.privacy_settings
        });
      }
    }
  }, [initialData, opened]);

  const handleUpdatePrivacy = (key, value) => {
    setPrivacySettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);

      // Update privacy settings
      await userService.updatePrivacySettings(userId, privacySettings);

      // Update is_public flag
      await userService.updatePreferences(userId, {
        is_public: isPublic
      });

      notifications.show({
        title: 'Success',
        message: 'Privacy settings updated successfully',
        color: 'green',
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (e) {
      notifications.show({
        title: 'Error',
        message: e.message || 'Failed to update privacy settings',
        color: 'red',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Group gap="xs"><IconLock size={18} /><Text fw={600}>Privacy Settings</Text></Group>}
      size="lg"
      centered
    >
      <Stack gap="md" pt="md">
        <Paper withBorder p="md" radius="md">
          <Switch
            label="Enable Public Profile"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.currentTarget.checked)}
            color="blue"
            description="Allows viewing of your profile even if they are not logged in"
          />
        </Paper>

        <Box p="md" bg="var(--mantine-color-gray-light)" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
          <Text size="xs" c="dimmed" ta="center" mb="md">
            Choose what to share in your profile
          </Text>
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
              <Switch label="Play Count" checked={privacySettings.show_play_count !== false} onChange={(e) => handleUpdatePrivacy('show_play_count', e.currentTarget.checked)} />
              <Switch label="Best 50" checked={privacySettings.show_best_50} onChange={(e) => handleUpdatePrivacy('show_best_50', e.currentTarget.checked)} />
              {privacySettings.show_best_50 && (
                <Switch
                  label="Allow song details"
                  description="Visitors can click cards for more info"
                  size="xs"
                  ml="md"
                  checked={privacySettings.show_best_50_details === true}
                  onChange={(e) => handleUpdatePrivacy('show_best_50_details', e.currentTarget.checked)}
                />
              )}
              <Switch label="Most Played" checked={privacySettings.show_most_played !== false} onChange={(e) => handleUpdatePrivacy('show_most_played', e.currentTarget.checked)} />
              {privacySettings.show_most_played !== false && (
                <Switch
                  label="Allow song details"
                  description="Visitors can click cards for more info"
                  size="xs"
                  ml="md"
                  checked={privacySettings.show_most_played_details === true}
                  onChange={(e) => handleUpdatePrivacy('show_most_played_details', e.currentTarget.checked)}
                />
              )}
            </Stack>
            <Stack gap="xs">
              <Text size="sm" fw={600}>Collections</Text>
              <Switch label="Favorites" checked={privacySettings.show_favorite_songs} onChange={(e) => handleUpdatePrivacy('show_favorite_songs', e.currentTarget.checked)} />
              <Switch label="Playlists" checked={privacySettings.show_playlists} onChange={(e) => handleUpdatePrivacy('show_playlists', e.currentTarget.checked)} />
            </Stack>
          </SimpleGrid>
        </Box>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSavePreferences} loading={isSaving} leftSection={<IconCheck size={18} />}>
            Save Privacy Settings
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default PrivacySettingsModal;
