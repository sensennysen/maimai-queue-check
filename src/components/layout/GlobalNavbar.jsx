import { useEffect, useMemo, useState } from 'react';
import { Paper, Group, Text, Button, Box, TextInput, Container, ActionIcon, Tooltip, Menu, Popover, Stack, Divider, Avatar } from '@mantine/core';
import { useDebouncedValue, useMediaQuery } from '@mantine/hooks';
import { useLocation, useNavigate } from 'react-router-dom';
import IconSearch from '@tabler/icons-react/dist/esm/icons/IconSearch.mjs';
import IconMusic from '@tabler/icons-react/dist/esm/icons/IconMusic.mjs';
import IconListDetails from '@tabler/icons-react/dist/esm/icons/IconListDetails.mjs';
import IconUsersGroup from '@tabler/icons-react/dist/esm/icons/IconUsersGroup.mjs';
import IconPlaylist from '@tabler/icons-react/dist/esm/icons/IconPlaylist.mjs';
import IconX from '@tabler/icons-react/dist/esm/icons/IconX.mjs';
import IconMenu2 from '@tabler/icons-react/dist/esm/icons/IconMenu2.mjs';
import { useAuth } from '../../hooks/useAuth';
import { useSongDatabaseContext } from '../../hooks/useSongDatabaseContext';
import { userService } from '../../services/supabase';
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
  const { songs } = useSongDatabaseContext();
  const [searchTerm, setSearchTerm] = useState('');

  const visibleNavItems = useMemo(() => {
    if (user) return navItems;
    return navItems.filter(item => item.label === 'Queue' || item.label === 'Songs');
  }, [user]);
  const [debouncedQuery] = useDebouncedValue(searchTerm.trim(), 200);
  const [profileSuggestions, setProfileSuggestions] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const activePath = getActivePath(location.pathname);
  const isCompact = useMediaQuery('(max-width: 1000px)');
  const isMenu = useMediaQuery('(max-width: 690px)');

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchTerm.trim();
    if (!query) {
      navigate('/search');
      return;
    }
    navigate(`/search?query=${encodeURIComponent(query)}`);
    setSuggestionsOpen(false);
  };

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setProfileSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        setProfileLoading(true);
        const results = await userService.searchPublicProfiles(debouncedQuery, 5);
        if (!cancelled) {
          setProfileSuggestions(results);
        }
      } catch {
        if (!cancelled) {
          setProfileSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
          setSuggestionsOpen(true);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const songSuggestions = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return [];
    const query = debouncedQuery.toLowerCase();
    const seen = new Set();
    const matches = [];

    for (const song of songs) {
      if (!song?.title || !song.songId) continue;
      if (!song.title.toLowerCase().includes(query)) continue;
      if (seen.has(song.songId)) continue;
      seen.add(song.songId);
      matches.push(song);
      if (matches.length >= 5) break;
    }

    return matches;
  }, [songs, debouncedQuery]);

  const hasSuggestions = profileSuggestions.length > 0 || songSuggestions.length > 0 || profileLoading;

  if (location.pathname === '/view' || location.pathname === '/profile/export') return null;

  return (
    <>
      <Container size="xl" pt="xl" className="global-top-nav-wrap">
        <Paper p={0} radius="xl" withBorder className="global-top-nav">
          <Group justify="space-between" align="center" gap="md" wrap="nowrap" className="global-top-nav-inner">
            <Text fw={800} className="global-top-brand">mPQCheckPH</Text>

            <Group gap={8} wrap="nowrap" className="global-top-links desktop-only">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant="subtle"
                    size="md"
                    onClick={() => navigate(item.path)}
                    aria-current={activePath === item.path ? 'page' : undefined}
                    className={`global-top-link ${activePath === item.path ? 'is-active' : ''}`}
                    leftSection={<Icon size={18} />}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Group>

            <Group gap="xs" wrap="nowrap" className="global-top-controls">
              {user && (
                <div className="global-search-container">
                  <Popover
                    opened={suggestionsOpen && hasSuggestions && !showSearch}
                    onClose={() => setSuggestionsOpen(false)}
                    position="bottom-end"
                    width={230}
                    withinPortal
                    shadow="md"
                    radius="md"
                  >
                    <Popover.Target>
                      <Box component="form" onSubmit={handleSearchSubmit} className={`global-top-search-wrap ${isCompact ? 'compact' : ''}`}>
                        {!isCompact ? (
                          <TextInput
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.currentTarget.value)}
                            placeholder="Search players or songs..."
                            leftSection={<IconSearch size={16} />}
                            className="global-top-search"
                            onFocus={() => {
                              if (hasSuggestions) setSuggestionsOpen(true);
                            }}
                          />
                        ) : (
                          <ActionIcon
                            variant="subtle"
                            size="lg"
                            className="global-search-icon"
                            aria-label="Open search"
                            onClick={() => setShowSearch(true)}
                          >
                            <IconSearch size={22} />
                          </ActionIcon>
                        )}
                      </Box>
                    </Popover.Target>
                    <Popover.Dropdown p="sm">
                      <Stack gap="xs" align="stretch">
                        <Group gap={6} justify="flex-start" align="center">
                          <IconUsersGroup size={14} />
                          <Text size="xs" fw={700}>Profiles</Text>
                        </Group>
                        {profileLoading && <Text size="xs" c="dimmed">Searching profiles...</Text>}
                        {!profileLoading && profileSuggestions.length === 0 && (
                          <Text size="xs" c="dimmed">No profile matches.</Text>
                        )}
                        {profileSuggestions.map((profile) => (
                          <Button
                            key={profile.id}
                            variant="subtle"
                            size="sm"
                            fullWidth
                            styles={{
                              root: { justifyContent: 'flex-start' },
                              inner: { justifyContent: 'flex-start', width: '100%' },
                              label: { width: '100%', textAlign: 'left' },
                            }}
                            onClick={() => {
                              if (profile.slug) navigate(`/p/${profile.slug}`);
                              setSuggestionsOpen(false);
                            }}
                            leftSection={
                              <Avatar
                                src={profile.display_photo_url || profile.dx_display_photo_url || undefined}
                                radius="xl"
                                size={32}
                              >
                                {(profile.display_name || profile.slug || '?').slice(0, 2).toUpperCase()}
                              </Avatar>
                            }
                          >
                            {profile.display_name || profile.slug || 'Unnamed'}
                          </Button>
                        ))}

                        <Divider />

                        <Group gap={6} justify="flex-start" align="center">
                          <IconMusic size={14} />
                          <Text size="xs" fw={700}>Songs</Text>
                        </Group>
                        {songSuggestions.length === 0 && (
                          <Text size="xs" c="dimmed">No song matches.</Text>
                        )}
                        {songSuggestions.map((song) => (
                          <Button
                            key={song.songId}
                            variant="subtle"
                            size="sm"
                            fullWidth
                            styles={{
                              root: { justifyContent: 'flex-start' },
                              inner: { justifyContent: 'flex-start', width: '100%' },
                              label: { width: '100%', textAlign: 'left' },
                            }}
                            onClick={() => {
                              navigate(`/search?query=${encodeURIComponent(song.title)}&type=song`);
                              setSuggestionsOpen(false);
                            }}
                            leftSection={
                              <Avatar
                                src={song.imageUrl || undefined}
                                radius="sm"
                                size={32}
                              />
                            }
                          >
                            {song.title}
                          </Button>
                        ))}
                      </Stack>
                    </Popover.Dropdown>
                  </Popover>

                  {/* Mobile/Compact Search Overlay */}
                  {isCompact && showSearch && (
                    <Box className="global-mobile-search-overlay animate-fade-in">
                      <Group gap="xs" wrap="nowrap" w="100%">
                        <Box component="form" onSubmit={handleSearchSubmit} style={{ flex: 1 }}>
                          <TextInput
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.currentTarget.value)}
                            placeholder="Search songs, players..."
                            leftSection={<IconSearch size={18} />}
                            rightSection={
                              <ActionIcon size="sm" variant="subtle" onClick={() => setShowSearch(false)}>
                                <IconX size={16} />
                              </ActionIcon>
                            }
                            autoFocus
                            radius="xl"
                            size="md"
                            className="mobile-search-input"
                          />
                        </Box>
                      </Group>
                    </Box>
                  )}
                </div>
              )}
              {/* Mobile menu removed in favor of floating bottom dock */}
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

      {/* Floating Bottom Dock for Mobile */}
      <Box className="global-bottom-dock-wrap mobile-only">
        <Paper p="xs" radius="xl" className="global-bottom-dock">
          <Group justify="center" gap={8} wrap="nowrap">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <ActionIcon
                  key={item.path}
                  variant="subtle"
                  size="xl"
                  onClick={() => navigate(item.path)}
                  aria-current={activePath === item.path ? 'page' : undefined}
                  className={`global-bottom-link ${activePath === item.path ? 'is-active' : ''}`}
                >
                  <Icon size={24} />
                </ActionIcon>
              );
            })}
          </Group>
        </Paper>
      </Box>

      {user && (
        <PreferencesModal
          opened={showPreferencesModal}
          onClose={() => setShowPreferencesModal(false)}
        />
      )}
    </>
  );
}
