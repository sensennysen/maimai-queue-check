import { Modal, Stack, Text, SegmentedControl } from '@mantine/core';
import { useTheme } from '../../contexts/ThemeContext';

const PreferencesModal = ({ opened, onClose }) => {
  const { currentTheme, setTheme } = useTheme();

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600}>App Settings</Text>}
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
              { label: 'Festival', value: 'festival' },
              { label: 'Universe', value: 'universe' },
            ]}
            fullWidth
          />
        </Stack>
      </Stack>
    </Modal>
  );
};

export default PreferencesModal;
