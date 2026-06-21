import { useEffect, useMemo, useState } from 'react';
import { Paper, Group, Text, Button, Box, TextInput, Container, ActionIcon, Popover, Stack, Badge } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useLocation, useNavigate } from 'react-router-dom';
import IconSearch from '@tabler/icons-react/dist/esm/icons/IconSearch.mjs';
import IconMusic from '@tabler/icons-react/dist/esm/icons/IconMusic.mjs';
import IconListDetails from '@tabler/icons-react/dist/esm/icons/IconListDetails.mjs';
import IconUsersGroup from '@tabler/icons-react/dist/esm/icons/IconUsersGroup.mjs';
import IconPlaylist from '@tabler/icons-react/dist/esm/icons/IconPlaylist.mjs';
import IconX from '@tabler/icons-react/dist/esm/icons/IconX.mjs';
import { useAuth } from '../../hooks/useAuth';
import { useSongDatabaseContext } from '../../hooks/useSongDatabaseContext';
import { useSearchSuggestions } from '../../hooks/useSearchSuggestions';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from './ThemeToggle';
import UserAccountMenu from '../UserAccountMenu';
import PreferencesModal from '../modals/PreferencesModal';
import '../search/SearchAutocomplete.css';
import './GlobalNavbar.css';

const navItems = [
  { label: 'Community', compactLabel: 'Community', mobileLabel: 'Feed', path: '/feed', icon: IconUsersGroup },
  { label: 'Queue', compactLabel: 'Queue', mobileLabel: 'Queue', path: '/queue', icon: IconListDetails },
  { label: 'Songs', compactLabel: 'Songs', mobileLabel: 'Songs', path: '/songs', icon: IconMusic },
  { label: 'Playlists', compactLabel: 'Lists', mobileLabel: 'Lists', path: '/shared-playlists', icon: IconPlaylist },
];

function getActivePath(pathname) {
  if (pathname.startsWith('/p/') || pathname.startsWith('/profile')) return null;
  const exact = navItems.find((item) => pathname === item.path);
  if (exact) return exact.path;
  const startsWith = navItems.find((item) => pathname.startsWith(item.path));
  return startsWith?.path || null;
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
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const activePath = getActivePath(location.pathname);
  const isDense = useMediaQuery('(max-width: 1280px)');
  const isCompact = useMediaQuery('(max-width: 1060px)');
  const isMenu = useMediaQuery('(max-width: 768px)');
  const navMode = isMenu ? 'mobile' : isCompact ? 'compact' : isDense ? 'dense' : 'full';

  const {
    profileSuggestions,
    profileLoading,
    songSuggestions,
    hasSuggestions,
    canSuggest,
  } = useSearchSuggestions(searchTerm, songs, { includeProfiles: !!user });

  useEffect(() => {
    if (!isFocused || !canSuggest) {
      setSuggestionsOpen(false);
      return;
    }

    setSuggestionsOpen(hasSuggestions);
  }, [canSuggest, hasSuggestions, isFocused]);

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

  if (location.pathname === '/profile/export') return null;

  return (
    <>
      <Container size="xl" pt={40} className="global-top-nav-wrap">
        <Paper p={0} radius="xl" withBorder className="global-top-nav">
          <Group justify="space-between" align="center" gap="md" wrap="nowrap" className="global-top-nav-inner">
            <Text fw={800} className="global-top-brand">mPQCheckPH</Text>

            <Group gap={8} wrap="nowrap" className={`global-top-links desktop-only nav-${navMode}`}>
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const navLabel = navMode === 'compact'
                  ? (item.compactLabel || item.desktopLabel || item.label)
                  : (item.desktopLabel || item.label);

                return (
                  <Button
                    key={item.path}
                    variant="subtle"
                    size="md"
                    onClick={() => navigate(item.path)}
                    aria-current={activePath === item.path ? 'page' : undefined}
                    className={`global-top-link nav-${navMode} ${activePath === item.path ? 'is-active' : ''}`}
                    leftSection={navMode === 'full' || navMode === 'compact' ? <Icon size={17} /> : null}
                  >
                    <span className="global-top-link-label">{navLabel}</span>
                  </Button>
                );
              })}
            </Group>

            <Group gap="xs" wrap="nowrap" className="global-top-controls">
              {user && (
                <div className="global-search-container">
                  <Popover
                    opened={suggestionsOpen && hasSuggestions}
                    onClose={() => setSuggestionsOpen(false)}
                    position="bottom-end"
                    width={isCompact && showSearch ? "target" : 230}
                    withinPortal
                    shadow="md"
                    radius="md"
                  >
                    <Popover.Target>
                      <Box component="form" onSubmit={handleSearchSubmit} className={`global-top-search-wrap ${isCompact ? 'compact' : ''} ${showSearch ? 'is-open' : ''}`}>
                        {!isCompact ? (
                          <TextInput
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.currentTarget.value)}
                            placeholder="Search players or songs..."
                            leftSection={<IconSearch size={16} />}
                            className="global-top-search"
                            onFocus={() => {
                              setIsFocused(true);
                              if (canSuggest && hasSuggestions) setSuggestionsOpen(true);
                            }}
                            onBlur={() => {
                              setIsFocused(false);
                              // Small delay to allow clicking suggestions
                              setTimeout(() => setSuggestionsOpen(false), 200);
                            }}
                          />
                        ) : (
                          <>
                            {!showSearch ? (
                              <ActionIcon
                                variant="subtle"
                                size="lg"
                                className="global-search-icon"
                                aria-label="Open search"
                                onClick={() => setShowSearch(true)}
                              >
                                <IconSearch size={22} />
                              </ActionIcon>
                            ) : (
                              <TextInput
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.currentTarget.value)}
                                placeholder="Search players or songs..."
                                leftSection={<IconSearch size={16} />}
                                rightSection={
                                  <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    aria-label="Close search"
                                    onClick={() => {
                                      setShowSearch(false);
                                      setSuggestionsOpen(false);
                                    }}
                                  >
                                    <IconX size={16} />
                                  </ActionIcon>
                                }
                                autoFocus
                                className="global-top-search"
                                style={{ flex: 1, width: '100%' }}
                                onFocus={() => {
                                  setIsFocused(true);
                                  if (canSuggest && hasSuggestions) setSuggestionsOpen(true);
                                }}
                                onBlur={() => {
                                  setIsFocused(false);
                                  setTimeout(() => setSuggestionsOpen(false), 200);
                                }}
                              />
                            )}
                          </>
                        )}
                      </Box>
                    </Popover.Target>
                    <Popover.Dropdown p="sm" className="search-autocomplete-dropdown global-search-dropdown">
                      <Stack gap="sm" align="stretch">
                        <Group justify="space-between" align="center">
                          <Text size="xs" fw={800} className="search-autocomplete-label">Quick matches</Text>
                          <Text size="xs" c="dimmed">
                            {profileLoading ? 'Searching...' : 'Press Enter for full results'}
                          </Text>
                        </Group>

                        <Stack gap="xs" className="search-autocomplete-section">
                          <Group justify="space-between" align="center">
                            <Group gap={6} justify="flex-start" align="center">
                              <IconUsersGroup size={14} />
                              <Text size="sm" fw={700}>Profiles</Text>
                            </Group>
                            <Badge variant="light">{profileSuggestions.length}</Badge>
                          </Group>
                          {!profileLoading && profileSuggestions.length === 0 && (
                            <Text size="sm" c="dimmed">No profile matches.</Text>
                          )}
                          {profileSuggestions.map((profile) => (
                            <button
                              key={profile.id}
                              type="button"
                              className="search-autocomplete-item"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                if (profile.slug) navigate(`/p/${profile.slug}`);
                                setSuggestionsOpen(false);
                              }}
                            >
                              <span className="search-autocomplete-item-copy">
                                <span className="search-autocomplete-item-title">
                                  {profile.display_name || profile.slug || 'Unnamed'}
                                </span>
                                <span className="search-autocomplete-item-meta">
                                  @{profile.slug || 'no-slug'}
                                </span>
                              </span>
                              <span className="search-autocomplete-item-tag">Player</span>
                            </button>
                          ))}
                        </Stack>

                        <Stack gap="xs" className="search-autocomplete-section">
                          <Group justify="space-between" align="center">
                            <Group gap={6} justify="flex-start" align="center">
                              <IconMusic size={14} />
                              <Text size="sm" fw={700}>Songs</Text>
                            </Group>
                            <Badge variant="light">{songSuggestions.length}</Badge>
                          </Group>
                          {songSuggestions.length === 0 && (
                            <Text size="sm" c="dimmed">No song matches.</Text>
                          )}
                          {songSuggestions.map((song) => (
                            <button
                              key={song.songId}
                              type="button"
                              className="search-autocomplete-item"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                navigate(`/search?query=${encodeURIComponent(song.title)}&type=song`);
                                setSuggestionsOpen(false);
                              }}
                            >
                              <span className="search-autocomplete-item-copy">
                                <span className="search-autocomplete-item-title">{song.title}</span>
                                <span className="search-autocomplete-item-meta">{song.artist || 'Unknown artist'}</span>
                              </span>
                              <span className="search-autocomplete-item-tag">Song</span>
                            </button>
                          ))}
                        </Stack>

                        <Button
                          variant="light"
                          radius="xl"
                          fullWidth
                          rightSection={<IconSearch size={14} />}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            const query = searchTerm.trim();
                            if (!query) return;
                            navigate(`/search?query=${encodeURIComponent(query)}`);
                            setSuggestionsOpen(false);
                          }}
                        >
                          View full results
                        </Button>
                      </Stack>
                    </Popover.Dropdown>
                  </Popover>

                </div>
              )}
              {/* Mobile menu removed in favor of floating bottom dock */}
              {user && <NotificationCenter />}
              {!isCompact && <ThemeToggle />}
              <UserAccountMenu
                onOpenPreferences={() => setShowPreferencesModal(true)}
                showThemeToggleInMenu={isCompact}
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
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  aria-label={item.label}
                  aria-current={activePath === item.path ? 'page' : undefined}
                  className={`global-bottom-link ${activePath === item.path ? 'is-active' : ''}`}
                >
                  <Icon size={20} />
                  <span className="global-bottom-link-label">{item.mobileLabel || item.label}</span>
                </button>
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
