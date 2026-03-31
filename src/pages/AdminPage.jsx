import { useState } from 'react';
import {
  Container,
  Stack,
  Button,
  Group,
  Title,
  Text,
  Paper,
  Tabs,
  ThemeIcon,
} from '@mantine/core';
import IconBuildingStore from '@tabler/icons-react/dist/esm/icons/IconBuildingStore.mjs';
import IconUsers from '@tabler/icons-react/dist/esm/icons/IconUsers.mjs';
import IconMessageReport from '@tabler/icons-react/dist/esm/icons/IconMessageReport.mjs';
import IconFileText from '@tabler/icons-react/dist/esm/icons/IconFileText.mjs';
import IconHistory from '@tabler/icons-react/dist/esm/icons/IconHistory.mjs';
import IconTags from '@tabler/icons-react/dist/esm/icons/IconTags.mjs';
import IconSettings from '@tabler/icons-react/dist/esm/icons/IconSettings.mjs';
import IconShieldLock from '@tabler/icons-react/dist/esm/icons/IconShieldLock.mjs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import BranchList from '../features/admin/components/BranchList';
import UserManager from '../features/admin/components/UserManager';
import ReportsManager from '../features/admin/components/ReportsManager';
import QueueRuleManager from '../features/admin/components/QueueRuleManager';
import TagManager from '../features/admin/components/TagManager';
import './AdminPage.css';

const AdminPage = () => {
  const { userRoles } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetTab = searchParams.get('tab');
  const isSuperAdmin = userRoles?.is_super_admin || false;

  const adminSections = [
    {
      value: 'branches',
      label: 'Branch Control',
      icon: IconBuildingStore,
      visible: isSuperAdmin,
    },
    {
      value: 'users',
      label: 'People Access',
      icon: IconUsers,
      visible: true,
    },
    {
      value: 'reports',
      label: 'Report Desk',
      icon: IconMessageReport,
      visible: isSuperAdmin,
    },
    {
      value: 'rules',
      label: 'Queue Rules',
      icon: IconFileText,
      visible: true,
    },
    {
      value: 'tags',
      label: 'Tag Library',
      icon: IconTags,
      visible: isSuperAdmin,
    },
  ].filter(section => section.visible);

  const [activeTab, setActiveTab] = useState(() => {
    // If target is requests, we need to show users tab
    if (targetTab === 'requests') return 'users';
    return isSuperAdmin ? 'branches' : 'users';
  });

  if (!userRoles?.is_admin && !isSuperAdmin) {
    return (
      <Container size="xl" py="xl" className="admin-page">
        <Paper className="admin-page__denied">
          <Stack align="center" gap="md">
            <ThemeIcon size={54} radius="xl" variant="light" color="red">
              <IconShieldLock size={28} />
            </ThemeIcon>
            <Title order={3}>Access Denied</Title>
            <Text ta="center" maw={420}>
              You do not have permission to view this page.
            </Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl" className="admin-page">
      <Stack gap="lg">
        <Paper className="admin-page__hero">
          <Group justify="space-between" align="center">
            <Stack gap="xs" className="admin-page__hero-copy">
              <Group gap="sm" wrap="wrap">
                <Text className="admin-page__eyebrow">
                  <IconSettings size={14} />
                  Administration
                </Text>
              </Group>
            </Stack>

            {isSuperAdmin && (
              <Group gap="sm" className="admin-page__hero-badges">
                <Button
                  variant="subtle"
                  leftSection={<IconHistory size={16} />}
                  onClick={() => navigate('/audit-logs')}
                  title="View audit logs"
                >
                  Audit Logs
                </Button>
              </Group>
            )}
          </Group>
        </Paper>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Paper className="admin-page__tabs-shell">
            <Tabs.List className="admin-page__tabs-list">
              {adminSections.map((section) => {
                const SectionIcon = section.icon;
                return (
                  <Tabs.Tab
                    key={section.value}
                    value={section.value}
                    className="admin-page__tab"
                    leftSection={<SectionIcon size={18} />}
                  >
                    <span className="admin-page__tab-body">
                      <span className="admin-page__tab-label">{section.label}</span>
                    </span>
                  </Tabs.Tab>
                );
              })}
            </Tabs.List>
          </Paper>

          <Paper className="admin-page__panel">
            {isSuperAdmin && (
              <Tabs.Panel value="branches">
                <BranchList isSuperAdmin={isSuperAdmin} />
              </Tabs.Panel>
            )}

            <Tabs.Panel value="users">
              <UserManager
                isSuperAdmin={isSuperAdmin}
                currentUserRoles={userRoles}
                initialTab={(targetTab === 'requests' || activeTab === 'requests') ? 'requests' : 'users'}
                key={(targetTab === 'requests' || activeTab === 'requests') ? 'requests' : 'users'}
              />
            </Tabs.Panel>

            {isSuperAdmin && (
              <Tabs.Panel value="reports">
                <ReportsManager />
              </Tabs.Panel>
            )}

            <Tabs.Panel value="rules">
              <QueueRuleManager
                isSuperAdmin={isSuperAdmin}
                currentUserRoles={userRoles}
              />
            </Tabs.Panel>

            {isSuperAdmin && (
              <Tabs.Panel value="tags">
                <TagManager isSuperAdmin={isSuperAdmin} />
              </Tabs.Panel>
            )}
          </Paper>
        </Tabs>
      </Stack>
    </Container>
  );
};

export default AdminPage;
