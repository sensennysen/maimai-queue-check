import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Container,
  Stack,
  Group,
  Paper,
  Text,
  Badge,
  SimpleGrid,
  LoadingOverlay,
  TextInput,
  SegmentedControl,
  ThemeIcon,
  Grid,
  Button,
  Popover,
  Divider,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useNavigate, useSearchParams } from 'react-router-dom';
import IconArrowRight from '@tabler/icons-react/dist/esm/icons/IconArrowRight.mjs';
import IconMusic from '@tabler/icons-react/dist/esm/icons/IconMusic.mjs';
import IconPlaylist from '@tabler/icons-react/dist/esm/icons/IconPlaylist.mjs';
import IconSearch from '@tabler/icons-react/dist/esm/icons/IconSearch.mjs';
import IconUsers from '@tabler/icons-react/dist/esm/icons/IconUsers.mjs';
import { useSongDatabaseContext } from '../hooks/useSongDatabaseContext';
import { useSearch } from '../hooks/useSearch';
import { useSearchSuggestions } from '../hooks/useSearchSuggestions';
import { ProfileResultCard } from '../components/search/ProfileResultCard';
import { SongResultCard } from '../components/search/SongResultCard';
import { PlaylistResultCard } from '../components/search/PlaylistResultCard';
import SongDetailModal from '../features/songs/components/SongDetailModal';
import { PlaylistDetailModal } from '../components/profile/PlaylistDetailModal';
import '../components/search/SearchAutocomplete.css';
import './SearchPage.css';

const PLAYLIST_LIMIT = 12;
const FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Songs', value: 'song' },
  { label: 'Profiles', value: 'profile' },
  { label: 'Playlists', value: 'playlist' },
];

function SearchSection({ icon: Icon, title, count, description, children, loading, error, empty, isEmpty = false, className = '' }) {
  return (
    <Paper withBorder radius="md" p="lg" className={`search-section ${className}`.trim()} pos="relative">
      <LoadingOverlay visible={loading} />
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" gap="md">
          <Group gap="sm" wrap="nowrap" align="flex-start">
            <ThemeIcon size={36} radius="md" variant="light" className="search-section-icon">
              <Icon size={20} />
            </ThemeIcon>
            <Stack gap={2}>
              <Text fw={800} size="lg" className="search-section-title">{title}</Text>
              {description ? (
                <Text size="sm" c="dimmed">{description}</Text>
              ) : null}
            </Stack>
          </Group>
          <Badge variant="light" size="lg" className="search-section-count">{count}</Badge>
        </Group>

        {error ? (
          <Text c="red" fw={600}>{error}</Text>
        ) : null}

        {!loading && !error && isEmpty ? (
          <Text c="dimmed">{empty}</Text>
        ) : children}
      </Stack>
    </Paper>
  );
}

function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const initialType = searchParams.get('type') || 'all';
  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState(FILTER_OPTIONS.some((option) => option.value === initialType) ? initialType : 'all');
  const [selectedSong, setSelectedSong] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedPlaylistSongs, setSelectedPlaylistSongs] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setActiveType(FILTER_OPTIONS.some((option) => option.value === initialType) ? initialType : 'all');
  }, [initialType]);

  const { songs, songMapById, loading: songsLoading } = useSongDatabaseContext();
  const [debouncedQuery] = useDebouncedValue(query.trim(), 250);

  const {
    profileResults,
    profilesLoading,
    profilesError,
    songResults,
    playlistGroups,
    playlistsLoading,
    playlistsError,
  } = useSearch(debouncedQuery, activeType, songs);

  const {
    profileSuggestions,
    profileLoading: suggestionsLoading,
    songSuggestions,
    hasSuggestions,
    canSuggest,
  } = useSearchSuggestions(query, songs);

  useEffect(() => {
    if (!isSearchFocused || !canSuggest) {
      setSuggestionsOpen(false);
      return;
    }

    setSuggestionsOpen(hasSuggestions);
  }, [canSuggest, hasSuggestions, isSearchFocused]);

  const hydratePlaylistSongs = useCallback((playlist) => {
    if (!playlist?.songs) return [];
    return playlist.songs
      .map((entry) => {
        const direct = songMapById?.get(entry.song_id);
        if (direct) return { ...direct, level: entry.level };
        return null;
      })
      .filter(Boolean);
  }, [songMapById]);

  const commitSearchParams = useCallback((nextQuery, nextType, replace = true) => {
    const params = new URLSearchParams();
    const trimmedQuery = nextQuery.trim();

    if (trimmedQuery) {
      params.set('query', trimmedQuery);
    }

    if (nextType && nextType !== 'all') {
      params.set('type', nextType);
    }

    setSearchParams(params, { replace });
  }, [setSearchParams]);

  useEffect(() => {
    const normalizedType = activeType === 'all' ? 'all' : activeType;
    const currentType = (searchParams.get('type') || 'all');

    if (debouncedQuery === initialQuery.trim() && normalizedType === currentType) {
      return;
    }

    commitSearchParams(debouncedQuery, normalizedType);
  }, [activeType, commitSearchParams, debouncedQuery, initialQuery, searchParams]);

  const handleSearchSubmit = useCallback((event) => {
    event.preventDefault();
    commitSearchParams(query, activeType, false);
    setSuggestionsOpen(false);
  }, [activeType, commitSearchParams, query]);

  const handleTypeChange = useCallback((value) => {
    setActiveType(value);
    commitSearchParams(query, value);
  }, [commitSearchParams, query]);

  const handleProfileNavigate = useCallback((slug) => {
    if (!slug) return;
    navigate(`/p/${slug}`);
  }, [navigate]);

  const handlePlaylistView = useCallback((playlist) => {
    setSelectedPlaylist(playlist);
    setSelectedPlaylistSongs(hydratePlaylistSongs(playlist));
  }, [hydratePlaylistSongs]);

  const playlistMatchCount = useMemo(() => {
    const ids = new Set();
    Object.values(playlistGroups).forEach((playlists) => {
      playlists.forEach((playlist) => {
        ids.add(playlist.id);
      });
    });
    return ids.size;
  }, [playlistGroups]);

  const showSongs = activeType === 'all' || activeType === 'song';
  const showProfiles = activeType === 'all' || activeType === 'profile';
  const showPlaylists = activeType === 'all' || activeType === 'playlist';

  return (
    <Container size="xl" py="lg" pb="xl" className="search-page-shell">
      <Stack gap="xl">
        <Paper withBorder radius="md" p="lg" className="search-hero">
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start" gap="md" className="search-hero-top">
              <Stack gap="xs" className="search-hero-copy">
                <Text fw={800} className="search-hero-title">
                  Search
                </Text>
                <Text size="sm" c="dimmed" className="search-hero-subtitle">
                  Find songs, public profiles, and related playlists in one place.
                </Text>
              </Stack>
              {debouncedQuery ? (
                <Text size="sm" c="dimmed" className="search-summary-text">
                  {songResults.length} songs, {profileResults.length} profiles, {playlistMatchCount} playlists
                </Text>
              ) : null}
            </Group>

            <Stack gap="md">
              <Popover
                opened={suggestionsOpen && hasSuggestions}
                onClose={() => setSuggestionsOpen(false)}
                width="target"
                position="bottom-start"
                offset={10}
                shadow="md"
                radius="lg"
                withinPortal
              >
                <Popover.Target>
                  <form onSubmit={handleSearchSubmit} className="search-toolbar">
                    <TextInput
                      value={query}
                      onChange={(event) => setQuery(event.currentTarget.value)}
                      placeholder="Search songs, artists, or player names..."
                      size="lg"
                      radius="xl"
                      leftSection={<IconSearch size={18} />}
                      className="search-toolbar-input"
                      onFocus={() => {
                        setIsSearchFocused(true);
                        if (canSuggest && hasSuggestions) {
                          setSuggestionsOpen(true);
                        }
                      }}
                      onBlur={() => {
                        setIsSearchFocused(false);
                        setTimeout(() => setSuggestionsOpen(false), 150);
                      }}
                    />
                    <Button
                      type="submit"
                      size="lg"
                      radius="xl"
                      className="search-toolbar-submit"
                      rightSection={<IconArrowRight size={16} />}
                    >
                      Search
                    </Button>
                  </form>
                </Popover.Target>

                <Popover.Dropdown p="sm" className="search-autocomplete-dropdown">
                  <Stack gap="sm">
                    <Group justify="space-between" align="center">
                      <Text size="xs" fw={800} className="search-autocomplete-label">Quick matches</Text>
                      <Text size="xs" c="dimmed">
                        {suggestionsLoading ? 'Searching...' : 'Press Enter for full results'}
                      </Text>
                    </Group>

                    <Stack gap="xs" className="search-autocomplete-section">
                      <Group justify="space-between" align="center">
                        <Group gap={6}>
                          <IconUsers size={14} />
                          <Text size="sm" fw={700}>Profiles</Text>
                        </Group>
                        <Badge variant="light">{profileSuggestions.length}</Badge>
                      </Group>
                      {!suggestionsLoading && profileSuggestions.length === 0 ? (
                        <Text size="sm" c="dimmed">No profile matches yet.</Text>
                      ) : null}
                      {profileSuggestions.map((profile) => (
                        <button
                          key={profile.id}
                          type="button"
                          className="search-autocomplete-item"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setSuggestionsOpen(false);
                            handleProfileNavigate(profile.slug);
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
                        <Group gap={6}>
                          <IconMusic size={14} />
                          <Text size="sm" fw={700}>Songs</Text>
                        </Group>
                        <Badge variant="light">{songSuggestions.length}</Badge>
                      </Group>
                      {songSuggestions.length === 0 ? (
                        <Text size="sm" c="dimmed">No song matches yet.</Text>
                      ) : null}
                      {songSuggestions.map((song) => (
                        <button
                          key={song.songId}
                          type="button"
                          className="search-autocomplete-item"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setQuery(song.title);
                            setActiveType('song');
                            commitSearchParams(song.title, 'song', false);
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
                      rightSection={<IconArrowRight size={14} />}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        commitSearchParams(query, activeType, false);
                        setSuggestionsOpen(false);
                      }}
                    >
                      View full results
                    </Button>
                  </Stack>
                </Popover.Dropdown>
              </Popover>

              <Group justify="space-between" align="center" gap="md" className="search-toolbar-footer">
                <SegmentedControl
                  value={activeType}
                  onChange={handleTypeChange}
                  radius="xl"
                  size="md"
                  data={FILTER_OPTIONS}
                  className="search-filter-control"
                />
                <Text size="sm" c="dimmed" className="search-toolbar-hint">
                  Search by title, artist, or player name.
                </Text>
              </Group>
            </Stack>
          </Stack>
        </Paper>

        {!debouncedQuery ? (
          <Paper withBorder radius="md" p="lg" className="search-prompt-card">
            <Stack gap="xs">
              <Text fw={700}>Start typing to search</Text>
              <Text size="sm" c="dimmed">
                Search by song title, artist, or player name. Use the scope switcher to narrow results if needed.
              </Text>
            </Stack>
          </Paper>
        ) : (
          <>
            {activeType === 'all' ? (
              <Grid gutter="lg">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Stack gap="lg">
                    <Paper withBorder radius="md" p="lg" className="search-side-summary">
                      <Stack gap="sm">
                        <Text fw={700} size="lg">Results</Text>
                        <Text size="sm" c="dimmed">
                          Showing matches for <Text span fw={700} c="inherit">"{debouncedQuery}"</Text>.
                        </Text>
                        <Divider />
                        <Group justify="space-between">
                          <Text size="sm">Songs</Text>
                          <Badge variant="light">{songResults.length}</Badge>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm">Profiles</Text>
                          <Badge variant="light">{profileResults.length}</Badge>
                        </Group>
                        <Group justify="space-between">
                          <Text size="sm">Playlists</Text>
                          <Badge variant="light">{playlistMatchCount}</Badge>
                        </Group>
                      </Stack>
                    </Paper>

                    {showProfiles ? (
                      <SearchSection
                        icon={IconUsers}
                        title="Profiles"
                        count={profileResults.length}
                        description="Public player pages that match your search."
                        loading={profilesLoading}
                        error={profilesError ? 'Failed to load profiles.' : ''}
                        empty="No public profiles matched this query."
                        isEmpty={profileResults.length === 0}
                      >
                        <Stack gap="sm">
                          {profileResults.map((profile) => (
                            <ProfileResultCard
                              key={profile.id}
                              profile={profile}
                              onNavigate={handleProfileNavigate}
                            />
                          ))}
                        </Stack>
                      </SearchSection>
                    ) : null}
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 8 }}>
                  {showSongs ? (
                      <SearchSection
                        icon={IconMusic}
                        title="Songs"
                        count={songResults.length}
                        description="Open song details directly from here."
                        loading={songsLoading}
                        empty="No songs matched that search."
                        isEmpty={songResults.length === 0}
                      >
                        <Stack gap="lg">
                          <Stack gap="md">
                            {songResults.map((song) => (
                              <SongResultCard
                                key={song.songId}
                                song={song}
                                onSelect={setSelectedSong}
                              />
                            ))}
                          </Stack>

                          {showPlaylists ? (
                            <>
                              <Divider />
                              <Stack gap="lg">
                                <Group justify="space-between" align="center">
                                  <Text fw={700} size="lg">Related Playlists</Text>
                                  <Badge variant="light">{playlistMatchCount}</Badge>
                                </Group>
                                {playlistsLoading ? null : null}
                                {playlistsError ? (
                                  <Text c="red" fw={600}>Failed to load playlists.</Text>
                                ) : null}
                                {!playlistsLoading && !playlistsError && playlistMatchCount === 0 ? (
                                  <Text c="dimmed">No public playlists were linked to the matched songs.</Text>
                                ) : null}
                                {songResults.map((song) => {
                                  const playlists = playlistGroups[song.songId] || [];
                                  if (playlists.length === 0) return null;

                                  return (
                                    <Paper key={song.songId} withBorder radius="md" p="md" className="search-playlist-cluster">
                                      <Stack gap="sm">
                                        <Group justify="space-between" align="center">
                                          <Text fw={700} className="search-playlist-cluster-title">{song.title}</Text>
                                          <Badge variant="light">{playlists.length}</Badge>
                                        </Group>
                                        <SimpleGrid cols={1} spacing="sm">
                                          {playlists.slice(0, PLAYLIST_LIMIT).map((playlist) => (
                                            <PlaylistResultCard
                                              key={playlist.id}
                                              playlist={playlist}
                                              song={song}
                                              onView={handlePlaylistView}
                                            />
                                          ))}
                                        </SimpleGrid>
                                      </Stack>
                                    </Paper>
                                  );
                                })}
                              </Stack>
                            </>
                          ) : null}
                        </Stack>
                      </SearchSection>
                    ) : null}
                  </Grid.Col>
                </Grid>
              ) : null}

            {activeType === 'song' ? (
              <SearchSection
                icon={IconMusic}
                title="Songs"
                count={songResults.length}
                description="Open song details directly from here."
                loading={songsLoading}
                empty="No songs matched that search."
                isEmpty={songResults.length === 0}
              >
                <Stack gap="md">
                  {songResults.map((song) => (
                    <SongResultCard
                      key={song.songId}
                      song={song}
                      onSelect={setSelectedSong}
                    />
                  ))}
                </Stack>
              </SearchSection>
            ) : null}

            {activeType === 'profile' ? (
              <SearchSection
                icon={IconUsers}
                title="Profiles"
                count={profileResults.length}
                description="Public player pages that match your search."
                loading={profilesLoading}
                error={profilesError ? 'Failed to load profiles.' : ''}
                empty="No public profiles matched this query."
                isEmpty={profileResults.length === 0}
              >
                <Stack gap="sm">
                  {profileResults.map((profile) => (
                    <ProfileResultCard
                      key={profile.id}
                      profile={profile}
                      onNavigate={handleProfileNavigate}
                    />
                  ))}
                </Stack>
              </SearchSection>
            ) : null}

            {activeType === 'playlist' ? (
              <SearchSection
                icon={IconPlaylist}
                title="Related Playlists"
                count={playlistMatchCount}
                description="Playlists grouped under the songs that surfaced them."
                loading={playlistsLoading}
                error={playlistsError ? 'Failed to load playlists.' : ''}
                empty="No public playlists were linked to the matched songs."
                isEmpty={playlistMatchCount === 0}
              >
                <Stack gap="lg">
                  {songResults.map((song) => {
                    const playlists = playlistGroups[song.songId] || [];
                    if (playlists.length === 0) return null;

                    return (
                      <Paper key={song.songId} withBorder radius="md" p="md" className="search-playlist-cluster">
                        <Stack gap="sm">
                          <Group justify="space-between" align="center">
                            <Text fw={700} className="search-playlist-cluster-title">{song.title}</Text>
                            <Badge variant="light">{playlists.length}</Badge>
                          </Group>
                          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                            {playlists.slice(0, PLAYLIST_LIMIT).map((playlist) => (
                              <PlaylistResultCard
                                key={playlist.id}
                                playlist={playlist}
                                song={song}
                                onView={handlePlaylistView}
                              />
                            ))}
                          </SimpleGrid>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </SearchSection>
            ) : null}
          </>
        )}
      </Stack>

      <SongDetailModal
        opened={!!selectedSong}
        song={selectedSong}
        onClose={() => setSelectedSong(null)}
      />

      <PlaylistDetailModal
        opened={!!selectedPlaylist}
        playlist={selectedPlaylist}
        songs={selectedPlaylistSongs}
        isOwnProfile={false}
        hideShareDelete
        onClose={() => {
          setSelectedPlaylist(null);
          setSelectedPlaylistSongs([]);
        }}
        onEdit={() => {}}
        onDelete={async () => {}}
      />
    </Container>
  );
}

export default SearchPage;
