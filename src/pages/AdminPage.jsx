import { useState } from 'react';
import {
  Container,
  Stack,
  Button,
  Group,
  Title,
  Text,
  ActionIcon,
  Paper,
  Tabs,
} from '@mantine/core';
import IconBuildingStore from '@tabler/icons-react/dist/esm/icons/IconBuildingStore.mjs';
import IconArrowLeft from '@tabler/icons-react/dist/esm/icons/IconArrowLeft.mjs';
import IconUsers from '@tabler/icons-react/dist/esm/icons/IconUsers.mjs';
import IconMessageReport from '@tabler/icons-react/dist/esm/icons/IconMessageReport.mjs';
import IconFileText from '@tabler/icons-react/dist/esm/icons/IconFileText.mjs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import BranchList from '../features/admin/components/BranchList';
import UserManager from '../features/admin/components/UserManager';
import ReportsManager from '../features/admin/components/ReportsManager';
import QueueRuleManager from '../features/admin/components/QueueRuleManager';
import './AdminPage.css';

const AdminPage = () => {
  const { userRoles } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetTab = searchParams.get('tab');
  const isSuperAdmin = userRoles?.is_super_admin || false;

  const [activeTab, setActiveTab] = useState(() => {
    // If target is requests, we need to show users tab
    if (targetTab === 'requests') return 'users';
    return isSuperAdmin ? 'branches' : 'users';
  });


  if (!userRoles?.is_admin && !isSuperAdmin) {
    return (
      <Container size="sm" py="xl">
        <Paper p="xl" withBorder>
          <Stack align="center" gap="md">
            <Title order={3}>Access Denied</Title>
            <Text>You do not have permission to view this page.</Text>
            <Button onClick={() => navigate('/')}>Go Back</Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" align="center">
            <Group gap="md">
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={() => navigate('/')}
                title="Back to Queue Manager"
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
              <Title order={2}>Admin Panel</Title>
            </Group>
          </Group>
        </Paper>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            {isSuperAdmin && (
              <Tabs.Tab value="branches" leftSection={<IconBuildingStore size={16} />}>
                Branch Management
              </Tabs.Tab>
            )}
            <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>
              User Management
            </Tabs.Tab>
            {isSuperAdmin && (
              <Tabs.Tab value="reports" leftSection={<IconMessageReport size={16} />}>
                Reports
              </Tabs.Tab>
            )}
            <Tabs.Tab value="rules" leftSection={<IconFileText size={16} />}>
              Queue Rule
            </Tabs.Tab>
          </Tabs.List>

          {isSuperAdmin && (
            <Tabs.Panel value="branches" pt="md">
              <BranchList isSuperAdmin={isSuperAdmin} />
            </Tabs.Panel>
          )}

          <Tabs.Panel value="users" pt="md">
            <UserManager
              isSuperAdmin={isSuperAdmin}
              currentUserRoles={userRoles}
              initialTab={(targetTab === 'requests' || activeTab === 'requests') ? 'requests' : 'users'}
              key={(targetTab === 'requests' || activeTab === 'requests') ? 'requests' : 'users'}
            />
          </Tabs.Panel>

          {isSuperAdmin && (
            <Tabs.Panel value="reports" pt="md">
              <ReportsManager />
            </Tabs.Panel>
          )}

          <Tabs.Panel value="rules" pt="md">
            <QueueRuleManager
              isSuperAdmin={isSuperAdmin}
              currentUserRoles={userRoles}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
};

export default AdminPage;
