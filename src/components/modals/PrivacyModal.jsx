import { Modal, Text, Stack, Title, List, Divider } from '@mantine/core';

function PrivacyModal({ opened, onClose }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Privacy Policy"
      size="lg"
      radius="md"
    >
      <Stack gap="md">
        <Text size="sm" style={{ marginTop: '1rem' }}>
          Your privacy is important to us. This page explains what data we collect and how it is used.
        </Text>

        <div>
          <Title order={4} mb="xs">Data Collection</Title>
          <List size="sm" withPadding spacing="xs">
            <List.Item>
              <Text span fw={700}>Player Names:</Text> When you join a queue, we store the player names you provide to manage the arcade queue.
            </List.Item>
            <List.Item>
              <Text span fw={700}>Account Information:</Text> If you sign in, we use Supabase Auth to manage your session. This may include your email or profile information from your login provider.
            </List.Item>
          </List>
        </div>

        <Divider />

        <div>
          <Title order={4} mb="xs">Tracking & Analytics</Title>
          <Text size="sm" mb="xs">
            We use <Text span fw={700}>Vercel Analytics</Text> to understand how our app is used and to improve the user experience. This service collects anonymous data about page views and interactions.
          </Text>
        </div>

        <Divider />

        <div>
          <Title order={4} mb="xs">Cookies & Local Storage</Title>
          <Text size="sm">
            We use <Text span fw={700}>Local Storage</Text> to keep you logged in and to remember your preferences (like your selected branch). No third-party advertising cookies are used.
          </Text>
        </div>

        <Text size="xs" c="secondary" mt="xs">
          Last updated: May 20, 2024
        </Text>
      </Stack>
    </Modal>
  );
}

export default PrivacyModal;
