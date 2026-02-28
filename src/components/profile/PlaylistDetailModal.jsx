import { useState } from 'react';
import { Modal, Stack, Text, Group, SimpleGrid, Box, Divider, Button, Image, Badge, Textarea } from '@mantine/core';
import { IconPlaylist, IconEdit, IconMusic, IconTrash, IconMessageCircle, IconShare } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import FavoriteSongCard from './FavoriteSongCard';
import { DIFFICULTY_COLORS, normalizeDifficulty, VERSION_MAPPING } from '../../config/maimai-constants';
import dxImage from '../../assets/music_dx.png';
import standardImage from '../../assets/music_standard.png';
import { playlistService } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';

export function PlaylistDetailModal({ playlist, songs = [], opened, onClose, isOwnProfile, onEdit, onDelete, hideShareDelete = false }) {
  const [selectedSongDetails, setSelectedSongDetails] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [isSubmittingShare, setIsSubmittingShare] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!playlist) return null;

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <Group gap="xs">
            <IconPlaylist size={24} style={{ color: 'var(--theme-primary)' }} />
            <Text fw={700} size="lg">{playlist.title}</Text>
          </Group>
        }
        size="xl"
        radius="md"
        centered
        transitionProps={{ transition: 'fade', duration: 0 }}
        classNames={{ content: 'profile-modal-pop' }}
      >
        <Stack gap="lg" pt="md">
          <Divider label={<Group gap={4}><IconMusic size={14} /> Songs ({songs.length})</Group>} labelPosition="center" />

          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            {songs.map((song, index) => (
              <FavoriteSongCard
                key={`${song.songId}-${song.level || 'nolvl'}-${index}`}
                song={song}
                onDelete={() => { }}
                isOwnProfile={false}
                onClick={() => setSelectedSongDetails(song)}
              />
            ))}
            {songs.length === 0 && (
              <Text ta="center" c="dimmed" style={{ gridColumn: '1 / -1' }}>No songs in this playlist yet.</Text>
            )}
          </SimpleGrid>

          {playlist.comment && (
            <Box
              p="md"
              radius="md"
              style={{
                background: 'var(--mantine-color-default-hover)',
                borderLeft: '4px solid var(--theme-primary)',
                fontStyle: 'italic'
              }}
            >
              <Text size="sm" c="var(--theme-text-muted)">
                "{playlist.comment}"
              </Text>
            </Box>
          )}

          {isOwnProfile && (
            <Group justify="space-between" mt="md">
              {!hideShareDelete ? (
                <Button
                  variant="subtle"
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this playlist?')) {
                      onDelete(playlist.id);
                    }
                  }}
                >
                  Delete
                </Button>
              ) : (
                <Box /> /* Spacer to keep Edit button on the right */
              )}
              <Group gap="sm">
                {playlist.is_public && !hideShareDelete && (
                  <Button
                    variant="light"
                    color="teal"
                    leftSection={<IconShare size={16} />}
                    onClick={() => setIsSharing(true)}
                  >
                    Share
                  </Button>
                )}
                <Button
                  variant="light"
                  leftSection={<IconEdit size={16} />}
                  onClick={() => {
                    onClose();
                    onEdit(playlist);
                  }}
                >
                  Edit Playlist
                </Button>
              </Group>
            </Group>
          )}
        </Stack>
      </Modal>

      <Modal
        opened={isSharing}
        onClose={() => {
          setIsSharing(false);
          setShareMessage('');
        }}
        title={<Text fw={700}>Share Playlist</Text>}
        centered
        size="md"
        zIndex={250}
        classNames={{ content: 'profile-modal-pop' }}
      >
        <Stack gap="md">
          <Text size="sm">Share "{playlist.title}" with the community!</Text>
          <Textarea
            placeholder="Add a message to your post... (optional)"
            value={shareMessage}
            onChange={(e) => setShareMessage(e.currentTarget.value)}
            minRows={3}
            autosize
            maxLength={300}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setIsSharing(false)}>Cancel</Button>
            <Button
              loading={isSubmittingShare}
              onClick={async () => {
                if (!user) return;
                setIsSubmittingShare(true);
                try {
                  await playlistService.sharePlaylist(user.id, playlist.id, shareMessage.trim());
                  notifications.show({ title: 'Success', message: 'Playlist shared successfully!', color: 'green' });
                  setIsSharing(false);
                  setShareMessage('');
                } catch (error) {
                  console.error('Failed to share playlist', error);
                  notifications.show({ title: 'Error', message: 'Failed to share playlist.', color: 'red' });
                } finally {
                  setIsSubmittingShare(false);
                }
              }}
            >
              Post
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={!!selectedSongDetails}
        onClose={() => setSelectedSongDetails(null)}
        title={<Text fw={700}>Chart Details</Text>}
        centered
        size="sm"
        zIndex={250}
        transitionProps={{ transition: 'fade', duration: 0 }}
        classNames={{ content: 'profile-modal-pop' }}
      >
        {selectedSongDetails && (() => {
          const selectedSheet = selectedSongDetails.sheets?.find(
            s => normalizeDifficulty(s.difficulty) === selectedSongDetails.level || s.difficulty === selectedSongDetails.level
          );

          return (
            <Stack align="center" gap="md" pb="sm" mt="md">
              <Image
                src={selectedSongDetails.imageUrl}
                alt={selectedSongDetails.title}
                w={140}
                h={140}
                radius="md"
                fallbackSrc="https://placehold.co/140x140?text=No+Image"
                style={{ boxShadow: 'var(--mantine-shadow-md)' }}
              />
              <Stack gap={2} align="center">
                <Text fw={700} ta="center" size="lg" style={{ lineHeight: 1.2 }}>{selectedSongDetails.title}</Text>
                <Text size="sm" c="dimmed" ta="center">{selectedSongDetails.artist}</Text>

                <Group gap="xs" justify="center" mt={4}>
                  <Badge size="sm" variant="outline">{VERSION_MAPPING?.[selectedSongDetails.version] || selectedSongDetails.version}</Badge>
                  {selectedSheet?.type && (
                    <img
                      src={selectedSheet.type === 'dx' ? dxImage : standardImage}
                      alt={selectedSheet.type === 'dx' ? 'DX' : 'Standard'}
                      style={{ height: 16, objectFit: 'contain' }}
                    />
                  )}
                </Group>
              </Stack>

              {selectedSongDetails.level && selectedSheet ? (
                <Stack align="center" gap="xs" mt="xs">
                  <Badge size="xl" color={DIFFICULTY_COLORS[selectedSongDetails.level] || 'gray'} variant="filled" style={{ textTransform: 'none' }}>
                    {selectedSongDetails.level}
                  </Badge>
                  <Stack gap={0} align="center">
                    <Text fw={800} size="xl" style={{ fontSize: '1.8rem' }}>
                      {selectedSheet.internalLevel || '-'}
                    </Text>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Constant</Text>
                  </Stack>
                  {selectedSheet.noteDesigner && selectedSheet.noteDesigner !== '-' && (
                    <Text size="xs" c="dimmed" mt={4}>Notes: {selectedSheet.noteDesigner}</Text>
                  )}
                </Stack>
              ) : (
                <Text size="sm" c="dimmed" mt="md">Specific chart details are unavailable for this song.</Text>
              )}

              <Button
                variant="light"
                color="blue"
                leftSection={<IconMessageCircle size={18} />}
                mt="md"
                w="100%"
                onClick={() => {
                  onClose(); // Close playlist modal completely, or just the detail view? Let's just navigate.
                  navigate(`/song/${selectedSongDetails.songId}`, {
                    state: { cardType: selectedSongDetails.cardType || selectedSheet?.type }
                  });
                }}
              >
                Discuss this Song
              </Button>
            </Stack>
          );
        })()}
      </Modal >
    </>
  );
}
