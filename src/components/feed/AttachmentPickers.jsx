import { useState, useCallback, useMemo } from 'react';
import { 
  Modal, TextInput, Stack, Text, Group, UnstyledButton, 
  Avatar, ScrollArea, Loader, ActionIcon, Paper
} from '@mantine/core';
import { 
  IconSearch, IconMusic, IconPlaylist, IconX,
  IconChevronRight 
} from '@tabler/icons-react';
import { useSongDatabaseContext } from '../../hooks/useSongDatabaseContext';
import { playlistService } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';

export function SongPicker({ opened, onClose, onSelect }) {
  const { songs, loading } = useSongDatabaseContext();
  const [query, setQuery] = useState('');

  const filteredSongs = useMemo(() => {
    if (!query.trim() || !songs) return [];
    const q = query.toLowerCase();
    return songs
      .filter(s => s.title?.toLowerCase().includes(q) || s.artist?.toLowerCase().includes(q))
      .slice(0, 15);
  }, [songs, query]);

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title="Attach a Song" 
      size="md"
      radius="md"
    >
      <Stack gap="md" style={{marginTop: '2rem'}}>
        <TextInput
          placeholder="Search by title or artist..."
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          autoFocus
        />

        <ScrollArea h={300}>
          {loading ? (
            <Group justify="center" py="xl"><Loader size="sm" /></Group>
          ) : query.trim() === '' ? (
            <Text c="dimmed" size="sm" ta="center" py="xl">Type to search for a song</Text>
          ) : filteredSongs.length === 0 ? (
            <Text c="dimmed" size="sm" ta="center" py="xl">No songs found</Text>
          ) : (
            <Stack gap={4}>
              {filteredSongs.map(song => (
                <UnstyledButton
                  key={song.id || song.songId}
                  p="xs"
                  className="hover-card"
                  onClick={() => {
                    onSelect(song);
                    onClose();
                  }}
                  style={{ borderRadius: 'var(--mantine-radius-sm)', width: '100%' }}
                >
                  <Group wrap="nowrap">
                    {song.imageUrl ? (
                      <Avatar src={song.imageUrl} radius="sm" size="md" />
                    ) : (
                      <Avatar radius="sm" size="md"><IconMusic size={20} /></Avatar>
                    )}
                    <Stack gap={0} style={{ flex: 1 }}>
                      <Text size="sm" fw={600} lineClamp={1}>{song.title}</Text>
                      <Text size="xs" c="dimmed" lineClamp={1}>{song.artist}</Text>
                    </Stack>
                    <IconChevronRight size={14} c="dimmed" />
                  </Group>
                </UnstyledButton>
              ))}
            </Stack>
          )}
        </ScrollArea>
      </Stack>
    </Modal>
  );
}

export function PlaylistPicker({ opened, onClose, onSelect }) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPlaylists = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await playlistService.getPlaylists(user.id);
      // Only show public or own playlists (usually all returned from getPlaylists are own)
      setPlaylists(data || []);
    } catch (err) {
      console.error('Failed to fetch playlists:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useMemo(() => {
    if (opened) fetchPlaylists();
  }, [opened, fetchPlaylists]);

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title="Attach a Playlist" 
      size="md"
      radius="md"
    >
      <Stack gap="md" style={{ marginTop: '2rem' }}>
        <ScrollArea h={300}>
          {loading ? (
            <Group justify="center" py="xl"><Loader size="sm" /></Group>
          ) : playlists.length === 0 ? (
            <Text c="dimmed" size="sm" ta="center" py="xl">You don't have any playlists yet</Text>
          ) : (
            <Stack gap={4}>
              {playlists.map(pl => (
                <UnstyledButton
                  key={pl.id}
                  p="xs"
                  className="hover-card"
                  onClick={() => {
                    onSelect(pl);
                    onClose();
                  }}
                  style={{ borderRadius: 'var(--mantine-radius-sm)', width: '100%' }}
                >
                  <Group wrap="nowrap">
                    <Avatar radius="sm" size="md" color="blue">
                      <IconPlaylist size={20} />
                    </Avatar>
                    <Stack gap={0} style={{ flex: 1 }}>
                      <Text size="sm" fw={600} lineClamp={1}>{pl.title}</Text>
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {pl.songs?.length || 0} songs &middot; {pl.is_public ? 'Public' : 'Private'}
                      </Text>
                    </Stack>
                    <IconChevronRight size={14} c="dimmed" />
                  </Group>
                </UnstyledButton>
              ))}
            </Stack>
          )}
        </ScrollArea>
      </Stack>
    </Modal>
  );
}

export function AttachmentPreview({ type, item, onClear }) {
  if (!item) return null;

  return (
    <Paper withBorder p="xs" radius="md" style={{ position: 'relative', background: 'var(--mantine-color-gray-0)' }}>
      <Group wrap="nowrap" gap="sm">
        {type === 'song' ? (
          <>
            {item.imageUrl ? (
              <Avatar src={item.imageUrl} radius="sm" size="sm" />
            ) : (
              <Avatar radius="sm" size="sm"><IconMusic size={14} /></Avatar>
            )}
            <Stack gap={0} style={{ flex: 1 }}>
              <Text size="xs" fw={700} lineClamp={1}>{item.title}</Text>
              <Text size="xs" c="dimmed" lineClamp={1}>{item.artist}</Text>
            </Stack>
          </>
        ) : (
          <>
            <Avatar radius="sm" size="sm" color="blue"><IconPlaylist size={14} /></Avatar>
            <Stack gap={0} style={{ flex: 1 }}>
              <Text size="xs" fw={700} lineClamp={1}>{item.title}</Text>
              <Text size="xs" c="dimmed">Playlist</Text>
            </Stack>
          </>
        )}
        <ActionIcon variant="subtle" color="gray" size="sm" onClick={onClear}>
          <IconX size={14} />
        </ActionIcon>
      </Group>
    </Paper>
  );
}
