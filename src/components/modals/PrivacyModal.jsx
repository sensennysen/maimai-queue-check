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
        <Text size="sm" mt="xs">
          We respect your privacy and are committed to protecting your personal data in accordance with the <b>Data Privacy Act of 2012 (RA 10173)</b> of the Philippines. This policy explains what information we collect and how it is used.
        </Text>

        <Divider />

        <div>
          <Title order={5} mb="xs">1. Information We Collect</Title>
          <List size="sm" withPadding spacing="xs">
            <List.Item>
              <Text span fw={700}>Account Data:</Text> If you sign in, we collect your email address, name, and profile picture from your login provider (Google, Discord, etc.) to manage your session via Supabase Auth.
            </List.Item>
            <List.Item>
              <Text span fw={700}>Profile Data:</Text> You may voluntarily provide your Maimai DX Name, best scores, preferred branches, and display photos to personalize your profile.
            </List.Item>
            <List.Item>
              <Text span fw={700}>Usage Data:</Text> When you join a queue, create playlists, or favorite songs, we store this data to provide the application's core functionality.
            </List.Item>
          </List>
        </div>

        <div>
          <Title order={5} mb="xs">2. How We Use Your Data</Title>
          <Text size="sm">
            Your data is used solely to facilitate the arcade queuing system, personalize your gaming profile, and improve the user experience through anonymous analytics provided by Vercel.
          </Text>
        </div>

        <div>
          <Title order={5} mb="xs">3. Data Sharing & Disclosure</Title>
          <Text size="sm">
            We do not sell your personal data. Your information is stored securely on <b>Supabase</b>. Public profiles are visible to others based on your privacy settings in the account dashboard.
          </Text>
        </div>

        <div>
          <Title order={5} mb="xs">4. Your Rights</Title>
          <Text size="sm">
            Under RA 10173, you have the right to access, correct, or request the erasure of your personal data. You can update your profile directly in the settings or contact us to request account deletion.
          </Text>
        </div>

        <div>
          <Title order={5} mb="xs">5. Cookies & Local Storage</Title>
          <Text size="sm">
            We use <b>Local Storage</b> to maintain your login session and remember your branch preferences. We do not use third-party advertising cookies.
          </Text>
        </div>

        <Text size="xs" c="dimmed" mt="xs">
          Last updated: February 19, 2026
        </Text>
      </Stack>
    </Modal>
  );
}

export default PrivacyModal;
