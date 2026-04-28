import { Container, Title, Text, Stack, List, Divider, Paper, Group, Anchor } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import IconShieldLock from '@tabler/icons-react/dist/esm/icons/IconShieldLock.mjs';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const lastUpdated = "March 30, 2026";

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Group gap="sm">
          <IconShieldLock size={32} color="var(--mantine-color-blue-6)" />
          <Title order={1}>Privacy Policy</Title>
        </Group>

        <Paper withBorder p="xl" radius="md" style={{ backgroundColor: 'var(--mantine-color-body)' }}>
          <Stack gap="lg">
            <div>
              <Text size="sm" c="dimmed">Last Updated: {lastUpdated}</Text>
              <Text mt="md">
                At mPQCheckPH (the "App"), we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service, in compliance with global standards including the <b>General Data Protection Regulation (GDPR)</b>, the <b>California Consumer Privacy Act (CCPA)</b>, and the <b>Data Privacy Act of 2012 (RA 10173)</b> of the Philippines.
              </Text>
            </div>

            <Divider />

            <section>
              <Title order={3} mb="sm">1. Information We Collect</Title>
              <Stack gap="xs">
                <Text fw={600}>A. Information You Provide to Us</Text>
                <List withPadding spacing="xs">
                  <List.Item>
                    <Text span fw={500}>Account Data:</Text> When you sign in via Google or Discord, we receive your email, name, and profile picture to manage your session.
                  </List.Item>
                  <List.Item>
                    <Text span fw={500}>Profile Data:</Text> Voluntary information such as your Maimai DX Name, best scores, preferred branches, and introduction text.
                  </List.Item>
                </List>

                <Text fw={600} mt="sm">B. Information Collected Automatically</Text>
                <List withPadding spacing="xs">
                  <List.Item>
                    <Text span fw={500}>Usage Data:</Text> We log interactions with the queue system, song favorites, and playlist creations to provide core functionality.
                  </List.Item>
                  <List.Item>
                    <Text span fw={500}>Analytics:</Text> We use Vercel Analytics to collect anonymous data about site traffic and usage patterns. No personal identifiers are linked to this data.
                  </List.Item>
                </List>
              </Stack>
            </section>

            <section>
              <Title order={3} mb="sm">2. Legal Basis for Processing (GDPR)</Title>
              <Text>
                If you are from the European Economic Area (EEA), our legal basis for collecting and using your personal information depends on the context:
              </Text>
              <List withPadding spacing="xs" mt="xs">
                <List.Item><b>Contract:</b> To provide the service you requested (e.g., managing your queue position).</List.Item>
                <List.Item><b>Legitimate Interests:</b> To improve our service and ensure security.</List.Item>
                <List.Item><b>Consent:</b> Where you have given us explicit permission for specific processing.</List.Item>
              </List>
            </section>

            <section>
              <Title order={3} mb="sm">3. How We Use Your Data</Title>
              <Text>We use your information to:</Text>
              <List withPadding spacing="xs">
                <List.Item>Operate and maintain the arcade queuing system.</List.Item>
                <List.Item>Personalize your gaming profile and community interactions.</List.Item>
                <List.Item>Analyze usage to improve App performance and user experience.</List.Item>
                <List.Item>Communicate important updates regarding the service.</List.Item>
              </List>
            </section>

            <section>
              <Title order={3} mb="sm">4. Data Sharing & Third Parties</Title>
              <Text>
                We do <b>not</b> sell your personal data. We share information only with:
              </Text>
              <List withPadding spacing="xs">
                <List.Item><b>Supabase:</b> For database storage and authentication services.</List.Item>
                <List.Item><b>Vercel:</b> For hosting and anonymous analytics.</List.Item>
                <List.Item><b>Public Users:</b> Your profile data is visible to other users based on your <b>Privacy Settings</b>.</List.Item>
              </List>
            </section>

            <section>
              <Title order={3} mb="sm">5. Your Rights & Choices</Title>
              <Text>Depending on your location, you have the following rights:</Text>
              <List withPadding spacing="xs">
                <List.Item><b>Access & Portability:</b> Request a copy of your personal data.</List.Item>
                <List.Item><b>Rectification:</b> Correct inaccurate or incomplete data.</List.Item>
                <List.Item><b>Erasure ("Right to be Forgotten"):</b> Request deletion of your account and data.</List.Item>
                <List.Item><b>Withdraw Consent:</b> Opt-out of analytics via the App settings or consent banner.</List.Item>
                <List.Item><b>CCPA (California):</b> Right to opt-out of the "sale" of information (note: we do not sell data).</List.Item>
              </List>
            </section>

            <section>
              <Title order={3} mb="sm">6. Data Retention</Title>
              <Text>
                We retain your account and profile data for as long as your account is active. If you request account deletion, we will remove your personal identifiers from our production systems within 30 days.
              </Text>
            </section>

            <section>
              <Title order={3} mb="sm">7. Children's Privacy</Title>
              <Text>
                Our service is not intended for individuals under the age of 13. We do not knowingly collect personal information from children under 13.
              </Text>
            </section>

            <section>
              <Title order={3} mb="sm">8. Contact Us</Title>
              <Text>
                For any privacy-related inquiries or to exercise your rights, please contact us via our <Anchor href="/contact" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>Contact Page</Anchor> or email us at <b>privacy@mPQCheckPH.com</b>.
              </Text>
            </section>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
