import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Container,
  Stack,
  Group,
  Paper,
  Text,
  Avatar,
  Button,
  Badge,
  Divider,
  SimpleGrid,
  LoadingOverlay,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useNavigate, useSearchParams } from 'react-router-dom';
import IconMusic from '@tabler/icons-react/dist/esm/icons/IconMusic.mjs';
import IconUsers from '@tabler/icons-react/dist/esm/icons/IconUsers.mjs';
import IconPlaylist from '@tabler/icons-react/dist/esm/icons/IconPlaylist.mjs';
import { useSongDatabaseContext } from '../hooks/useSongDatabaseContext';
import { userService, playlistService } from '../services/supabase';
import SongDetailModal from '../features/songs/components/SongDetailModal';
import { PlaylistDetailModal } from '../components/profile/PlaylistDetailModal';

const PROFILE_LIMIT = 12;
const SONG_LIMIT = 24;
const PLAYLIST_LIMIT = 12;

function buildSongMatchIds(song) {
  const ids = new Set();
  if (song?.cardId) ids.add(song.cardId);
  if (song?.songId) ids.add(song.songId);
  if (song?.songId) {
    ids.add(`${song.songId}-standard`);
    ids.add(`${song.songId}-dx`);
  }
  return Array.from(ids).filter(Boolean);
}

function normalizeSongId(songId) {
  if (!songId) return null;
  if (songId.endsWith('-dx')) return songId.replace('-dx', '');
  if (songId.endsWith('-standard')) return songId.replace('-standard', '');
  return songId;
}

function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const [selectedSong, setSelectedSong] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedPlaylistSongs, setSelectedPlaylistSongs] = useState([]);

  const { songs, songMapById, loading: songsLoading } = useSongDatabaseContext();
  const [debouncedQuery] = useDebouncedValue(initialQuery.trim(), 250);

  const [profileResults, setProfileResults] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState(null);

  const [playlistGroups, setPlaylistGroups] = useState({});
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [playlistsError, setPlaylistsError] = useState(null);

  useEffect(() => {
    if (!debouncedQuery) {
      setProfileResults([]);
      setProfilesError(null);
      return;
    }

    let isCancelled = false;
    const run = async () => {
      try {
        setProfilesLoading(true);
        const results = await userService.searchPublicProfiles(debouncedQuery, PROFILE_LIMIT);
        if (!isCancelled) {
          setProfileResults(results);
          setProfilesError(null);
        }
      } catch (error) {
        if (!isCancelled) {
          setProfilesError(error);
        }
      } finally {
        if (!isCancelled) {
          setProfilesLoading(false);
        }
      }
    };

    run();
    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery]);

  const songResults = useMemo(() => {
    if (!debouncedQuery) return [];
    const query = debouncedQuery.toLowerCase();
    const seen = new Set();
    const matches = [];

    for (const song of songs) {
      if (!song?.title || !song.songId) continue;
      if (!song.title.toLowerCase().includes(query)) continue;
      if (seen.has(song.songId)) continue;
      seen.add(song.songId);
      matches.push(song);
      if (matches.length >= SONG_LIMIT) break;
    }

    return matches;
  }, [songs, debouncedQuery]);

  useEffect(() => {
    if (!debouncedQuery || songResults.length === 0) {
      setPlaylistGroups({});
      setPlaylistsError(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        setPlaylistsLoading(true);
        const ids = Array.from(new Set(songResults.flatMap(buildSongMatchIds)));
        const playlists = await playlistService.getPublicPlaylistsBySongIds(ids, 40);

        const groups = {};
        playlists.forEach((playlist) => {
          (playlist.songs || []).forEach((songEntry) => {
            const baseId = normalizeSongId(songEntry.song_id);
            if (!baseId) return;
            if (!groups[baseId]) groups[baseId] = [];
            groups[baseId].push(playlist);
          });
        });

        if (!cancelled) {
          setPlaylistGroups(groups);
          setPlaylistsError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setPlaylistsError(error);
          setPlaylistGroups({});
        }
      } finally {
        if (!cancelled) {
          setPlaylistsLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, songResults]);

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

  return (
    <Container size="xl" py="lg" pb="xl">
      <Stack gap="lg">
        {!debouncedQuery && (
          <Paper withBorder radius="md" p="lg">
            <Stack gap="xs">
              <Text fw={600}>Start typing to search</Text>
              <Text size="sm" c="dimmed">Use the top search bar to find public profiles and songs.</Text>
            </Stack>
          </Paper>
        )}

        {debouncedQuery && (
          <>
            <Stack gap="sm">
              <Group gap="xs" align="center">
                <IconUsers size={18} />
                <Text fw={700}>Profiles</Text>
                <Badge variant="light">{profileResults.length}</Badge>
              </Group>
              <Paper withBorder radius="md" p="md" pos="relative">
                <LoadingOverlay visible={profilesLoading} />
                {profilesError && (
                  <Text c="red" fw={600}>Failed to load profiles.</Text>
                )}
                {!profilesLoading && !profilesError && profileResults.length === 0 && (
                  <Text c="dimmed">No public profiles found.</Text>
                )}
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                  {profileResults.map((profile) => (
                    <Paper key={profile.id} withBorder radius="md" p="sm">
                      <Group align="center" justify="space-between" wrap="nowrap">
                        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                          <Avatar
                            src={profile.display_photo_url || profile.dx_display_photo_url || undefined}
                            radius="xl"
                            color="blue"
                          >
                            {(profile.display_name || profile.slug || '?').slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Stack gap={2} style={{ minWidth: 0 }}>
                            <Text fw={600} lineClamp={1}>{profile.display_name || profile.slug || 'Unnamed'}</Text>
                            <Text size="xs" c="dimmed" lineClamp={1}>@{profile.slug || 'no-slug'}</Text>
                          </Stack>
                        </Group>
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => profile.slug && navigate(`/p/${profile.slug}`)}
                          disabled={!profile.slug}
                        >
                          View
                        </Button>
                      </Group>
                    </Paper>
                  ))}
                </SimpleGrid>
              </Paper>
            </Stack>

            <Divider my="md" />

            <Stack gap="sm">
              <Group gap="xs" align="center">
                <IconMusic size={18} />
                <Text fw={700}>Songs</Text>
                <Badge variant="light">{songResults.length}</Badge>
              </Group>
              <Paper withBorder radius="md" p="md" pos="relative">
                <LoadingOverlay visible={songsLoading} />
                {!songsLoading && songResults.length === 0 && (
                  <Text c="dimmed">No songs found for that title.</Text>
                )}
                <Stack gap="md">
                  {songResults.map((song) => (
                      <Paper key={song.songId} withBorder radius="md" p="md">
                        <Group justify="space-between" align="center" wrap="nowrap">
                          <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
                            <Avatar
                              src={song.imageUrl || undefined}
                              radius="md"
                              size={64}
                            />
                            <Stack gap={2} style={{ minWidth: 0 }}>
                              <Text fw={700} lineClamp={1}>{song.title}</Text>
                              <Text size="sm" c="dimmed" lineClamp={1}>{song.artist || 'Unknown artist'}</Text>
                              {song.version && (
                                <Badge size="xs" variant="light">{song.version}</Badge>
                              )}
                            </Stack>
                          </Group>
                          <Group gap="xs" wrap="nowrap">
                            <Button size="xs" variant="light" onClick={() => setSelectedSong(song)}>
                              Song Info
                            </Button>
                          </Group>
                        </Group>
                      </Paper>
                  ))}
                </Stack>
              </Paper>
            </Stack>

            <Divider my="md" />

            <Stack gap="sm">
              <Group gap="xs" align="center">
                <IconPlaylist size={18} />
                <Text fw={700}>Playlists</Text>
                <Badge variant="light">{Object.keys(playlistGroups).length}</Badge>
              </Group>
              <Paper withBorder radius="md" p="md" pos="relative">
                <LoadingOverlay visible={playlistsLoading} />
                {playlistsError && (
                  <Text c="red" fw={600}>Failed to load playlists.</Text>
                )}
                {!playlistsLoading && !playlistsError && Object.keys(playlistGroups).length === 0 && (
                  <Text c="dimmed">No public playlists found for matched songs.</Text>
                )}
                <Stack gap="lg">
                  {songResults.map((song) => {
                    const playlists = playlistGroups[song.songId] || [];
                    if (playlists.length === 0) return null;
                    return (
                      <Stack key={song.songId} gap="sm">
                        <Group gap="xs" align="center">
                          <Text fw={600}>{song.title}</Text>
                          <Badge size="xs" variant="light">{playlists.length}</Badge>
                        </Group>
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                          {playlists.slice(0, PLAYLIST_LIMIT).map((playlist) => (
                            <Paper key={playlist.id} withBorder radius="md" p="sm">
                              <Stack gap={4}>
                                <Text fw={600} lineClamp={1}>{playlist.title}</Text>
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                  by {playlist.author?.display_name || playlist.author?.slug || 'Unknown'}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {(playlist.songs || []).length} matched song{(playlist.songs || []).length !== 1 ? 's' : ''}
                                </Text>
                                <Button
                                  size="xs"
                                  variant="light"
                                  onClick={() => {
                                    setSelectedPlaylist(playlist);
                                    setSelectedPlaylistSongs(hydratePlaylistSongs(playlist));
                                  }}
                                >
                                  View Playlist
                                </Button>
                              </Stack>
                            </Paper>
                          ))}
                        </SimpleGrid>
                      </Stack>
                    );
                  })}
                </Stack>
              </Paper>
            </Stack>
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
