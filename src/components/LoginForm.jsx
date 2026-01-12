import { Button, Group, Paper, Stack, Text, Avatar, Menu, ActionIcon, Loader } from '@mantine/core'
import { IconBrandGoogle, IconLogout, IconUser, IconChevronDown } from '@tabler/icons-react'
import { useAuth } from '../hooks/useAuth'
import { notifications } from '@mantine/notifications'
import './LoginForm.css'

const LoginForm = () => {
  const { user, loading, signInWithProvider, signOut } = useAuth()

  const handleSocialLogin = async (provider) => {
    try {
      await signInWithProvider(provider)
      notifications.show({
        title: 'Login Successful',
        message: `Welcome! You have been logged in with ${provider}.`,
        color: 'green',
      })
    } catch (error) {
      notifications.show({
        title: 'Login Failed',
        message: error.message || 'An error occurred during login.',
        color: 'red',
      })
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      notifications.show({
        title: 'Logged Out',
        message: 'You have been successfully logged out.',
        color: 'blue',
      })
    } catch (error) {
      notifications.show({
        title: 'Logout Failed',
        message: error.message || 'An error occurred during logout.',
        color: 'red',
      })
    }
  }

  if (loading) {
    return (
      <Paper className="login-form" p="md" withBorder radius="md">
        <Group justify="center">
          <Loader size="sm" />
          <Text size="sm">Loading...</Text>
        </Group>
      </Paper>
    )
  }

  if (user) {
    return (
      <Paper className="login-form" p="md" withBorder radius="md">
        <Group justify="space-between" align="center">
          <Group>
            <Avatar
              src={user.user_metadata?.avatar_url}
              alt={user.user_metadata?.full_name || user.email}
              size="sm"
              radius="xl"
            >
              <IconUser size={16} />
            </Avatar>
            <Stack gap={0}>
              <Text size="sm" fw={500}>
                {user.user_metadata?.full_name || user.email}
              </Text>
              <Text size="xs" c="dimmed">
                {user.email}
              </Text>
            </Stack>
          </Group>
          
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconChevronDown size={16} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconLogout size={16} />}
                onClick={handleLogout}
                color="red"
              >
                Sign Out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Paper>
    )
  }

  return (
    <Paper className="login-form" p="md" withBorder radius="md">
      <Stack gap="md">
        <Text size="sm" ta="center" fw={500}>
          Sign in to manage the queue
        </Text>
        
        <Stack gap="xs">
          <Button
            leftSection={<IconBrandGoogle size={16} />}
            onClick={() => handleSocialLogin('google')}
            variant="outline"
            color="red"
            fullWidth
            size="sm"
          >
            Continue with Google
          </Button>
        </Stack>
        
        <Text size="xs" c="dimmed" ta="center">
          Sign in to add, edit, and manage queue entries
        </Text>
      </Stack>
    </Paper>
  )
}

export default LoginForm