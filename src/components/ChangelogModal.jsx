import { Modal, Text, List, Stack, Group } from '@mantine/core';
import { changelogData } from '../data/changelog';

function ChangelogModal({ opened, onClose }) {

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} size="xl">Changelogs</Text>
      }
      size="lg"
      radius="md"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack gap="xl" py="sm">
        {changelogData.map((release, index) => (
          <div key={index}>
            <Group justify="space-between" mb="sm">
              <Text fw={600} size="lg" c="dimmed">
                Version {release.version}
              </Text>
              <Text size="md" c="dimmed">
                {release.date}
              </Text>
            </Group>

            <List
              spacing="lg"
              size="lg"
              withPadding
            >
              {release.changes.map((change, i) => (
                <List.Item key={i}>
                  <Stack gap={6}>
                    <Text fw={600} size="lg">{change.title}</Text>
                    <Text size="md" c="dimmed" lh={1.6} style={{ textAlign: 'justify' }}>
                      {change.description}
                    </Text>
                    {change.footnote && (
                      <Text size="sm" c="dimmed" fs="italic" mt={2} lh={1.5} style={{ textAlign: 'justify' }}>
                        * {change.footnote}
                      </Text>
                    )}
                  </Stack>
                </List.Item>
              ))}
            </List>
          </div>
        ))}
      </Stack>
    </Modal>
  );
}

export default ChangelogModal;
