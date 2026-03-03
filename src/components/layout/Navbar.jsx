import { Container, Group, Title, Burger, Drawer, Stack, Button, Box, Paper } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate, useLocation } from 'react-router-dom';
import IconMusic from '@tabler/icons-react/dist/esm/icons/IconMusic.mjs';
import IconPlaylist from '@tabler/icons-react/dist/esm/icons/IconPlaylist.mjs';
import IconHome from '@tabler/icons-react/dist/esm/icons/IconHome.mjs';
import LoginForm from '../LoginForm';
import ThemeToggle from './ThemeToggle';
import BranchSelector from './BranchSelector';
import NotificationCenter from './NotificationCenter';
import { useAuth } from '../../hooks/useAuth';
import './Navbar.css';

const Navbar = ({ onOpenPreferences }) => {
  const [opened, { toggle, close }] = useDisclosure(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { label: 'Home', icon: <IconHome size={18} />, path: '/' },
    { label: 'Songs', icon: <IconMusic size={18} />, path: '/songs' },
    { label: 'Playlist Feed', icon: <IconPlaylist size={18} />, path: '/shared-playlists' },
  ];

  const handleNavClick = (path) => {
    navigate(path);
    close();
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <Paper component="nav" className="navbar-container" withBorder={false}>
      <Container size="lg" h="100%">
        <Group justify="space-between" h="100%" wrap="nowrap">
          {/* Logo / Title */}
          <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Title order={1} className="navbar-title">
              maiPaQueueCheck
            </Title>
          </Group>

          {/* Desktop Navigation */}
          <Group gap="md" visibleFrom="md" className="desktop-nav">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={isActive(item.path) ? 'light' : 'subtle'}
                leftSection={item.icon}
                onClick={() => handleNavClick(item.path)}
                className={`nav-button ${isActive(item.path) ? 'active' : ''}`}
                size="sm"
              >
                {item.label}
              </Button>
            ))}
          </Group>

          {/* Desktop Controls */}
          <Group gap="sm" visibleFrom="sm">
            <BranchSelector size="sm" />
            {user && <NotificationCenter />}
            <ThemeToggle />
            <LoginForm onOpenPreferences={onOpenPreferences} />
          </Group>

          {/* Mobile Burger */}
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        </Group>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        opened={opened}
        onClose={close}
        size="75%"
        padding="md"
        title={
          <Title order={3} className="navbar-title">
            Menu
          </Title>
        }
        hiddenFrom="sm"
        zIndex={1000}
      >
        <Stack gap="md" mt="xl">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={isActive(item.path) ? 'light' : 'subtle'}
              leftSection={item.icon}
              onClick={() => handleNavClick(item.path)}
              fullWidth
              justify="flex-start"
              size="lg"
            >
              {item.label}
            </Button>
          ))}

          <Box mt="xl">
            <Stack gap="sm">
              <Group justify="space-between">
                <BranchSelector fullWidth />
              </Group>
              <Group justify="space-between">
                <ThemeToggle />
                <LoginForm onOpenPreferences={onOpenPreferences} />
              </Group>
            </Stack>
          </Box>
        </Stack>
      </Drawer>
    </Paper>
  );
};

export default Navbar;
