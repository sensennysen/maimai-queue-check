import { useState } from 'react';
import { Container, Title, Paper, Group, Stack, Avatar, Text, Tabs, Textarea, Button, Alert, Code } from '@mantine/core';
import { IconUser, IconUpload, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';

const ProfilePage = () => {
  const { user, userRoles } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [jsonInput, setJsonInput] = useState('');
  const [validationResult, setValidationResult] = useState(null); // { success: boolean, message: string }

  const handleValidation = () => {
    try {
      const data = JSON.parse(jsonInput);
      
      // Basic Validation: Check for 'profile' and 'scores' keys
      if (!data.profile || !data.scores) {
        setValidationResult({
          success: false,
          message: 'Invalid JSON format. Missing "profile" or "scores" keys.'
        });
        return;
      }

      if (!Array.isArray(data.scores)) {
        setValidationResult({
          success: false,
          message: 'Invalid JSON format. "scores" must be an array.'
        });
        return;
      }

      setValidationResult({
        success: true,
        message: `Valid JSON! Found ${data.scores.length} scores. (Import logic coming in Phase 3)`
      });

    } catch (e) {
      setValidationResult({
        success: false,
        message: 'Invalid JSON syntax. Please check your input.'
      });
    }
  };

  if (!user) {
    return (
      <Container size="md" py="xl">
        <Text>Please log in to view your profile.</Text>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {/* Profile Header */}
        <Paper p="lg" radius="md" withBorder>
          <Group>
            <Avatar 
              src={user.user_metadata?.avatar_url} 
              size={80} 
              radius={80} 
            >
              <IconUser size={40} />
            </Avatar>
            <Stack gap={0}>
              <Title order={2}>{userRoles?.display_name || user.user_metadata?.full_name || 'User'}</Title>
              <Text c="dimmed">{user.email}</Text>
              {userRoles?.maimai_dx_name && (
                <Text size="sm" mt="xs">
                  Maimai Name: <Text span fw={700}>{userRoles.maimai_dx_name}</Text>
                </Text>
              )}
            </Stack>
          </Group>
        </Paper>

        {/* Tabs */}
        <Paper p="md" radius="md" withBorder>
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="overview" leftSection={<IconUser size={16} />}>
                Overview
              </Tabs.Tab>
              <Tabs.Tab value="import" leftSection={<IconUpload size={16} />}>
                Import Scores
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="overview" pt="md">
              <Text>Best 50 Scores will be displayed here in Phase 4.</Text>
            </Tabs.Panel>

            <Tabs.Panel value="import" pt="md">
              <Stack>
                <Alert variant="light" color="blue" title="Import Instructions">
                  Paste the JSON export from the Maimai DX bookmarklet tool below.
                </Alert>
                
                <Textarea
                  placeholder='Paste JSON here... {"profile": {...}, "scores": [...]}'
                  minRows={10}
                  maxRows={20}
                  autosize
                  value={jsonInput}
                  onChange={(event) => setJsonInput(event.currentTarget.value)}
                />

                <Group justify="flex-end">
                  <Button onClick={handleValidation}>
                    Validate JSON
                  </Button>
                </Group>

                {validationResult && (
                  <Alert 
                    icon={validationResult.success ? <IconCheck size={16} /> : <IconAlertCircle size={16} />}
                    title={validationResult.success ? "Validation Success" : "Validation Error"}
                    color={validationResult.success ? "green" : "red"}
                    variant="filled"
                  >
                    {validationResult.message}
                  </Alert>
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Stack>
    </Container>
  );
};

export default ProfilePage;
