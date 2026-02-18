import { Modal, Stack, Text, Group, Loader } from '@mantine/core';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { EXPERIMENTAL_FEATURES } from '../../constants/featureFlags';
import { Switch, Alert, Card, SegmentedControl, Divider } from '@mantine/core';
import { useTheme } from '../../contexts/ThemeContext';
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
                  <Text size="xs" c="secondary">{feature.description}</Text>
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

const PreferencesModal = ({ opened, onClose }) => {
  const { currentTheme, setTheme } = useTheme();


  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={600}>Experimental Features</Text>}
      centered
      size="lg"
    >
      <Stack gap="md">
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
        <Divider />
        <ExperimentalFeaturesSection />
      </Stack>
    </Modal>
  );
};

export default PreferencesModal;
