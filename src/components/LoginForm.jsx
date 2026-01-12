import { Button, Stack, Text, Avatar, Menu, ActionIcon, Loader, Divider } from '@mantine/core';
import { IconBrandGoogle, IconLogout, IconUser, IconLogin } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { notifications } from '@mantine/notifications';
import './LoginForm.css';

const LoginForm = () => {
  const { user, loading, signInWithProvider, signOut } = useAuth();

  const handleSocialLogin = async (provider) => {
    try {
      await signInWithProvider(provider);
    } catch (error) {
      notifications.show({
        title: 'Login Failed',
        message: error.message || 'An error occurred during login.',
        color: 'red',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      notifications.show({
        title: 'Logged Out',
        message: 'You have been successfully logged out.',
        color: 'blue',
      });
    } catch (error) {
      notifications.show({
        title: 'Logout Failed',
        message: error.message || 'An error occurred during logout.',
        color: 'red',
      });
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

  return (
    <Menu shadow="md" width={280} position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="subtle" size="xl" className="login-icon">
          <IconBrandGoogle size={24} stroke={2} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>
          <Text size="sm" fw={500}>
            Sign in to manage the queue
          </Text>
        </Menu.Label>
        <Divider mb="xs" />
        <Stack gap="xs" p="xs">
          <Button
            leftSection={<IconBrandGoogle size={16} />}
            onClick={() => handleSocialLogin('google')}
            variant="light"
            color="red"
            fullWidth
          >
            Continue with Google
          </Button>
          <Text size="xs" c="dimmed" ta="center">
            Sign in to add, edit, and manage queue entries
          </Text>
        </Stack>
      </Menu.Dropdown>
    </Menu>
  );
};

export default LoginForm;