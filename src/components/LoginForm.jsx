import { Button, Stack, Text, Avatar, Menu, ActionIcon, Loader, Divider } from '@mantine/core';
import { IconBrandGoogle, IconLogout, IconUser, IconLogin } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
// notifications removed: toasts suppressed per UX change
import './LoginForm.css';

const LoginForm = () => {
  const { user, loading, signInWithProvider, signOut } = useAuth();

  const handleSocialLogin = async (provider) => {
    try {
      await signInWithProvider(provider);
    } catch (error) {
      // swallow UI toasts; log for debugging
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
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
      <Menu shadow="md" width={250} position="bottom-end">
        <Menu.Target>
          <ActionIcon variant="subtle" size="xl" className="login-icon">
            <Avatar
              src={user.user_metadata?.avatar_url}
              alt={user.user_metadata?.full_name || user.email}
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
                {user.user_metadata?.full_name || 'User'}
              </Text>
              <Text size="xs" c="dimmed">
                {user.email}
              </Text>
            </Stack>
          </Menu.Label>
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
        fullWidth
      >
        Login with Google
      </Button>
    </div>
  );
};

export default LoginForm;