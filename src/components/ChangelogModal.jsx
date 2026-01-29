import { Modal, Text, List, Stack, Group } from '@mantine/core';

function ChangelogModal({ opened, onClose }) {
  const changelogData = [
    {
      version: 'v0.0.7',
      date: 'January 29, 2026',
      changes: [
        {
          type: 'feature',
          title: 'Branch Selection',
          description: 'Added the ability for users to select specific branches/locations for queue viewing.',
          footnote: 'Currently, we have 2 branches but we will soon add more as I connect to communities and continue to develop it to handle branches that have multiple cabinets.',
        },
        {
          type: 'feature',
          title: 'Geolocation Support',
          description: 'Integrated user geolocation to filter and display nearby places automatically.',
          footnote: 'Gelocation accuracy depends on your device and browser settings.'
        },
        {
          type: 'fix',
          title: 'Session & CSS Fixes',
          description: 'Resolved issues with session transitions and fixed UI glitches in queue item displays and disabled buttons.',
        }
      ]
    }
  ];

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
