import { useState } from 'react';
import { Button, Stack, Text, Avatar, Menu, ActionIcon, Loader, Divider, Badge, Group } from '@mantine/core';
import { IconBrandGoogle, IconLogout, IconUser, IconLogin, IconSettings } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useBranch } from '../hooks/useBranch';
import { useFeatureFlags } from '../contexts/FeatureFlagContext';
import './LoginForm.css';

const LoginForm = ({ onOpenPreferences }) => {
  const { user, loading, signInWithProvider, signOut, userRoles } = useAuth();
  const { branches } = useBranch();
  const { flags } = useFeatureFlags();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSocialLogin = async (provider) => {
    try {
      setIsLoading(true);
      await signInWithProvider(provider);
    } catch {
      setIsLoading(false);
      // Error handled silently
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // Error handled silently
    }
  };

  // Helper to render preferred branch badges
  const renderPreferredBranches = () => {
    if (!userRoles?.preferred_branches?.length || !branches.length) return null;

    return (
      <Group gap={4} mt={4} style={{ flexWrap: 'wrap', maxWidth: '100%' }}>
        {userRoles.preferred_branches.map(branchId => {
          const branch = branches.find(b => b.id === branchId);
          if (!branch) return null;
          return (
            <Badge key={branchId} size="xs" variant="light" color="blue">
              {branch.acronym || branch.short_name}
            </Badge>
          );
        })}
      </Group>
    );
  };

  if (loading) {
    return (
      <ActionIcon variant="subtle" size="xl" className="login-icon">
        <Loader size="sm" />
      </ActionIcon>
    );
  }

  if (user) {
    return (
      <Menu shadow="md" width={280} position="bottom-end">
        <Menu.Target>
          <ActionIcon variant="subtle" size="xl" className="login-icon">
            <Avatar
              src={user.user_metadata?.avatar_url}
              alt={userRoles?.display_name || user.user_metadata?.full_name || user.email}
              size={40}
              radius="xl"
            >
              <IconUser size={24} />
            </Avatar>
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>
            <Stack gap={2}>
              <Text size="sm" fw={500}>
                {userRoles?.display_name || user.user_metadata?.full_name || 'User'}
              </Text>
              <Text size="xs" c="dimmed">
                {user.email}
              </Text>
              {renderPreferredBranches()}
            </Stack>
          </Menu.Label>
          <Divider />
          {flags['profile_tab'] && (
            <Menu.Item
              leftSection={<IconUser size={16} />}
              onClick={() => navigate('/profile')}
            >
              Profile
            </Menu.Item>
          )}
          <Menu.Item
            leftSection={<IconSettings size={16} />}
            onClick={onOpenPreferences}
          >
            Preferences
          </Menu.Item>
          {(userRoles?.is_admin || userRoles?.is_super_admin) && (
            <>
              <Menu.Item
                leftSection={<IconSettings size={16} />}
                onClick={() => navigate('/admin')}
              >
                Admin Panel
              </Menu.Item>
            </>
          )}
          <Divider />
          <Menu.Item
            leftSection={<IconLogout size={16} />}
            onClick={handleLogout}
            color="red"
          >
            Sign Out
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
  }

  // When not authenticated, show a prominent login button.
  return (
    <div className="login-button-container">
      <Button
        leftSection={<IconBrandGoogle size={16} />}
        onClick={() => handleSocialLogin('google')}
        variant="light"
        color="red"
        className="google-login-button"
        loading={isLoading}
      >
        <span className="login-button-text">Login with Google</span>
      </Button>
    </div>
  );
};

export default LoginForm;