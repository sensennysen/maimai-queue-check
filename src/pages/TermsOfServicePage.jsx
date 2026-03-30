import { Container, Title, Text, Stack, List, Divider, Paper, Group, Anchor } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import IconFileText from '@tabler/icons-react/dist/esm/icons/IconFileText.mjs';

export default function TermsOfServicePage() {
  const navigate = useNavigate();
  const lastUpdated = "March 30, 2026";

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Group gap="sm">
          <IconFileText size={32} color="var(--mantine-color-blue-6)" />
          <Title order={1}>Terms of Service</Title>
        </Group>

        <Paper withBorder p="xl" radius="md" style={{ backgroundColor: 'var(--mantine-color-body)' }}>
          <Stack gap="lg">
            <div>
              <Text size="sm" c="dimmed">Last Updated: {lastUpdated}</Text>
              <Text mt="md">
                Welcome to mPQCheckPH (the "App"). By using our service, you agree to the following terms and conditions. Please read them carefully.
              </Text>
            </div>

            <Divider />

            <section>
              <Title order={3} mb="sm">1. Acceptance of Terms</Title>
              <Text>
                By accessing or using the App, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, you must not use the App.
              </Text>
            </section>

            <section>
              <Title order={3} mb="sm">2. Eligibility</Title>
              <Text>
                You must be at least <b>13 years of age</b> to use our service. By using the App, you represent and warrant that you meet this requirement.
              </Text>
            </section>

            <section>
              <Title order={3} mb="sm">3. User Accounts</Title>
              <List withPadding spacing="xs">
                <List.Item>You are responsible for maintaining the confidentiality of your login credentials.</List.Item>
                <List.Item>You are responsible for all activities that occur under your account.</List.Item>
                <List.Item>We reserve the right to suspend or terminate accounts that violate these terms.</List.Item>
              </List>
            </section>

            <section>
              <Title order={3} mb="sm">4. Acceptable Use</Title>
              <Text>You agree NOT to:</Text>
              <List withPadding spacing="xs">
                <List.Item>Use the App for any illegal or unauthorized purpose.</List.Item>
                <List.Item>Disrupt or interfere with the security or servers of the App.</List.Item>
                <List.Item>Spam or harass other users within the community features.</List.Item>
                <List.Item>Automate or scrape data from the App without permission.</List.Item>
                <List.Item>Manipulate the queue system in a way that is unfair to others.</List.Item>
              </List>
            </section>

            <section>
              <Title order={3} mb="sm">5. Intellectual Property</Title>
              <Text>
                All content, trademarks, and logos associated with the App are the property of mPQCheckPH or its licensors. You may not use these without prior written consent.
              </Text>
            </section>

            <section>
              <Title order={3} mb="sm">6. Limitation of Liability</Title>
              <Text>
                The App is provided "as is" and "as available". We do not warrant that the service will be uninterrupted or error-free. To the fullest extent permitted by law, mPQCheckPH shall not be liable for any indirect, incidental, or consequential damages.
              </Text>
            </section>

            <section>
              <Title order={3} mb="sm">7. Governing Law</Title>
              <Text>
                These terms are governed by the laws of the Republic of the Philippines. Any disputes shall be subject to the exclusive jurisdiction of the courts in the Philippines.
              </Text>
            </section>

            <section>
              <Title order={3} mb="sm">8. Changes to Terms</Title>
              <Text>
                We may update these terms from time to time. We will notify you of any significant changes by posting the new terms on this page. Your continued use of the App after changes are posted constitutes your acceptance of the new terms.
              </Text>
            </section>

            <section>
              <Title order={3} mb="sm">9. Contact</Title>
              <Text>
                If you have any questions about these Terms, please contact us via our <Anchor href="/contact" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>Contact Page</Anchor>.
              </Text>
            </section>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
