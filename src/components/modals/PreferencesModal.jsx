import { useState, useEffect } from 'react';
import { Modal, Stack, Text, SegmentedControl, TextInput, Button, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/supabase';

const PreferencesModal = ({ opened, onClose }) => {
  const { currentTheme, setTheme } = useTheme();
  const { user } = useAuth();
  const [queueName, setQueueName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [originalQueueName, setOriginalQueueName] = useState('');

  // Fetch current queue_name when modal opens
  useEffect(() => {
    if (opened && user) {
      userService.getOwnProfile(user.id).then((profile) => {
        const name = profile?.user_roles?.queue_name || '';
        setQueueName(name);
        setOriginalQueueName(name);
      }).catch(console.error);
    }
    // user?.id is the correct dep — no need to re-run when user object ref changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, user?.id]);

  const handleSaveQueueName = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await userService.updatePreferences(user.id, { queue_name: queueName.trim() || null });
      setOriginalQueueName(queueName.trim());
      notifications.show({ title: 'Saved', message: 'Queue name updated', color: 'green' });
    } catch (e) {
      notifications.show({ title: 'Error', message: e.message || 'Failed to save', color: 'red' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600}>Preferences</Text>}
      centered
      size="sm"
    >
      <Stack gap="lg" style={{ marginTop: '1rem' }}>
        <Stack gap="xs">
          <Text fw={600} size="sm">App Theme</Text>
          <SegmentedControl
            value={currentTheme}
            onChange={(val) => setTheme(val)}
            data={[
              { label: 'Circle', value: 'circle' },
              { label: 'Prism', value: 'prism' },
              { label: 'Buddies', value: 'buddies' },
            ]}
            fullWidth
          />
        </Stack>

        {user && (
          <Stack gap="xs">
            <Text fw={600} size="sm">Queue Name</Text>
            <Text size="xs" c="dimmed">Name shown in queue autocomplete (max 10 chars)</Text>
            <Group gap="xs" align="flex-end">
              <TextInput
                placeholder="Your queue name"
                value={queueName}
                onChange={(e) => setQueueName(e.currentTarget.value.slice(0, 10))}
                maxLength={10}
                style={{ flex: 1 }}
              />
              <Button
                onClick={handleSaveQueueName}
                loading={isSaving}
                disabled={queueName.trim() === originalQueueName}
                size="sm"
              >
                Save
              </Button>
            </Group>
          </Stack>
        )}
      </Stack>
    </Modal>
  );
};

export default PreferencesModal;
