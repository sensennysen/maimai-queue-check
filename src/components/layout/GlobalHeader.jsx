import { Group, Title, Paper, Stack } from '@mantine/core';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoginForm from '../LoginForm';
import ThemeToggle from './ThemeToggle';
import BranchSelector from './BranchSelector';
import NotificationCenter from './NotificationCenter';

const GlobalHeader = ({ onOpenPreferences }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <Stack gap="xs" mb="md">
      <Paper p="md" radius="md" withBorder className="app-header animate-fade-in">
        <Group justify="space-between" align="center" gap="md" wrap="wrap">
          <Group gap="md">
            <Title order={1} className="app-title" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
              maiPaQueueCheck PH
            </Title>
          </Group>
        </Group>
      </Paper>

      <Group justify="space-between" gap="sm" className="animate-fade-in delay-100">
        {isHomePage ? <BranchSelector /> : <div />}
        <Group gap="sm">
          {user && <NotificationCenter />}
          <ThemeToggle />
          <LoginForm onOpenPreferences={onOpenPreferences} />
        </Group>
      </Group>
    </Stack>
  );
};

export default GlobalHeader;
