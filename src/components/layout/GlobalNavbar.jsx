import { useState } from 'react';
import { Paper, Group, Text, Button, Box, TextInput, Container, ActionIcon, Tooltip, Menu } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useLocation, useNavigate } from 'react-router-dom';
import IconSearch from '@tabler/icons-react/dist/esm/icons/IconSearch.mjs';
import IconMusic from '@tabler/icons-react/dist/esm/icons/IconMusic.mjs';
import IconListDetails from '@tabler/icons-react/dist/esm/icons/IconListDetails.mjs';
import IconUsersGroup from '@tabler/icons-react/dist/esm/icons/IconUsersGroup.mjs';
import IconPlaylist from '@tabler/icons-react/dist/esm/icons/IconPlaylist.mjs';
import IconX from '@tabler/icons-react/dist/esm/icons/IconX.mjs';
import IconMenu2 from '@tabler/icons-react/dist/esm/icons/IconMenu2.mjs';
import { useAuth } from '../../hooks/useAuth';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from './ThemeToggle';
import LoginForm from '../LoginForm';
import PreferencesModal from '../modals/PreferencesModal';
import './GlobalNavbar.css';

const navItems = [
  { label: 'Community Feed', path: '/feed', icon: IconUsersGroup },
  { label: 'Queue', path: '/', icon: IconListDetails },
  { label: 'Songs', path: '/songs', icon: IconMusic },
  { label: 'Playlists', path: '/shared-playlists', icon: IconPlaylist },
];

function getActivePath(pathname) {
  if (pathname.startsWith('/p/') || pathname.startsWith('/profile')) return null;
  const exact = navItems.find((item) => pathname === item.path);
  if (exact) return exact.path;
  const startsWith = navItems.find((item) => item.path !== '/' && pathname.startsWith(item.path));
  return startsWith?.path || '/';
}

export default function GlobalNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const activePath = getActivePath(location.pathname);
  const isCompact = useMediaQuery('(max-width: 1000px)');
  const isMenu = useMediaQuery('(max-width: 690px)');

  if (location.pathname === '/view') return null;

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchTerm.trim();
    if (!query) {
      navigate('/songs');
      return;
    }
    navigate(`/songs?search=${encodeURIComponent(query)}`);
  };

  return (
    <>
      <Container size="xl" pt="xl" className="global-top-nav-wrap">
        <Paper p={0} radius="xl" withBorder className="global-top-nav">
          <Group justify="space-between" align="center" gap="md" wrap="nowrap" className="global-top-nav-inner">
            <Text fw={800} className="global-top-brand">mPQCheckPH</Text>

            <Group gap={4} wrap="nowrap" className="global-top-links">
              {!isMenu && navItems.map((item) => {
                const Icon = item.icon;
                return isCompact ? (
                  <Tooltip key={item.path} label={item.label} position="bottom" withArrow>
                    <ActionIcon
                      variant="subtle"
                      size="lg"
                      onClick={() => navigate(item.path)}
                      aria-current={activePath === item.path ? 'page' : undefined}
                      className={`global-top-link compact ${activePath === item.path ? 'is-active' : ''}`}
                    >
                      <Icon size={20} />
                    </ActionIcon>
                  </Tooltip>
                ) : (
                  <Button
                    key={item.path}
                    variant="subtle"
                    size="compact-sm"
                    onClick={() => navigate(item.path)}
                    aria-current={activePath === item.path ? 'page' : undefined}
                    className={`global-top-link ${activePath === item.path ? 'is-active' : ''}`}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Group>

            <Group gap="xs" wrap="nowrap" className="global-top-controls">
              <Box component="form" onSubmit={handleSearchSubmit} className={`global-top-search-wrap ${showSearch ? 'is-open' : ''} ${isCompact ? 'compact' : ''}`}>
                {(!isCompact || showSearch) && (
                  <TextInput
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.currentTarget.value)}
                    placeholder="Search title, artist..."
                    leftSection={<IconSearch size={16} />}
                    rightSection={
                      isCompact && (
                        <ActionIcon size="sm" variant="subtle" onClick={() => setShowSearch(false)} aria-label="Close search">
                          <IconX size={14} />
                        </ActionIcon>
                      )
                    }
                    className="global-top-search"
                    autoFocus={isCompact && showSearch}
                  />
                )}
                {isCompact && !showSearch && (
                  <ActionIcon
                    variant="subtle"
                    size="lg"
                    className="global-search-icon"
                    aria-label="Open search"
                    onClick={() => setShowSearch(true)}
                  >
                    <IconSearch size={18} />
                  </ActionIcon>
                )}
              </Box>
              {isMenu && (
                <Menu shadow="md" width={220} position="bottom-end">
                  <Menu.Target>
                    <ActionIcon variant="subtle" size="lg" aria-label="Open navigation">
                      <IconMenu2 size={20} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Menu.Item
                          key={item.path}
                          leftSection={<Icon size={16} />}
                          onClick={() => navigate(item.path)}
                        >
                          {item.label}
                        </Menu.Item>
                      );
                    })}
                  </Menu.Dropdown>
                </Menu>
              )}
              {user && <NotificationCenter />}
              {!isMenu && <ThemeToggle />}
              <LoginForm
                onOpenPreferences={() => setShowPreferencesModal(true)}
                showThemeToggleInMenu={isMenu}
              />
            </Group>
          </Group>
        </Paper>
      </Container>

      {user && (
        <PreferencesModal
          opened={showPreferencesModal}
          onClose={() => setShowPreferencesModal(false)}
        />
      )}
    </>
  );
}
