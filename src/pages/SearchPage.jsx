import { useCallback, useState } from 'react';
import {
  Container,
  Stack,
  Group,
  Paper,
  Text,
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
import { useSearch } from '../hooks/useSearch';
import { ProfileResultCard } from '../components/search/ProfileResultCard';
import { SongResultCard } from '../components/search/SongResultCard';
import { PlaylistResultCard } from '../components/search/PlaylistResultCard';
import SongDetailModal from '../features/songs/components/SongDetailModal';
import { PlaylistDetailModal } from '../components/profile/PlaylistDetailModal';

const PLAYLIST_LIMIT = 12;

function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const typeFilter = searchParams.get('type') || '';
  const [selectedSong, setSelectedSong] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedPlaylistSongs, setSelectedPlaylistSongs] = useState([]);

  const { songs, songMapById, loading: songsLoading } = useSongDatabaseContext();
  const [debouncedQuery] = useDebouncedValue(initialQuery.trim(), 250);

  const {
    profileResults,
    profilesLoading,
    profilesError,
    songResults,
    playlistGroups,
    playlistsLoading,
    playlistsError,
  } = useSearch(debouncedQuery, typeFilter, songs);

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

  const handleProfileNavigate = (slug) => {
    navigate(`/p/${slug}`);
  };

  const handlePlaylistView = (playlist) => {
    setSelectedPlaylist(playlist);
    setSelectedPlaylistSongs(hydratePlaylistSongs(playlist));
  };

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
            {typeFilter !== 'song' && !selectedSong && (
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
                        <ProfileResultCard
                          key={profile.id}
                          profile={profile}
                          onNavigate={handleProfileNavigate}
                        />
                      ))}
                    </SimpleGrid>
                  </Paper>
                </Stack>

                <Divider my="md" />
              </>
            )}

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
                    <SongResultCard
                      key={song.songId}
                      song={song}
                      onSelect={setSelectedSong}
                    />
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
                            <PlaylistResultCard
                              key={playlist.id}
                              playlist={playlist}
                              song={song}
                              onView={handlePlaylistView}
                            />
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
