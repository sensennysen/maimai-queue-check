import { useState, useMemo } from 'react';
import { 
  Modal, 
  Stack, 
  Text, 
  Group, 
  SimpleGrid, 
  Box, 
  Button, 
  Image, 
  Badge, 
  Textarea, 
  Switch,
  ActionIcon,
  UnstyledButton,
  Divider,
} from '@mantine/core';
import IconPlaylist from '@tabler/icons-react/dist/esm/icons/IconPlaylist.mjs';
import IconEdit from '@tabler/icons-react/dist/esm/icons/IconEdit.mjs';
import IconMusic from '@tabler/icons-react/dist/esm/icons/IconMusic.mjs';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import IconMessageCircle from '@tabler/icons-react/dist/esm/icons/IconMessageCircle.mjs';
import IconShare from '@tabler/icons-react/dist/esm/icons/IconShare.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconX from '@tabler/icons-react/dist/esm/icons/IconX.mjs';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import FavoriteSongCard from './FavoriteSongCard';
import { DIFFICULTY_COLORS, normalizeDifficulty, VERSION_MAPPING, BASE_JACKET_URL } from '../../config/maimai-constants';
import dxImage from '../../assets/music_dx.png';
import standardImage from '../../assets/music_standard.png';
import { playlistService } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { PlaylistProtectionModal } from '../modals/PlaylistProtectionModal';

/**
 * Modal component for viewing and interacting with a shared playlist.
 * Displays song list, playback controls (if applicable), and user comments.
 */
export function PlaylistDetailModal({ playlist, songs = [], opened, onClose, isOwnProfile, onEdit, onDelete, hideShareDelete = false }) {
  const [selectedSongDetails, setSelectedSongDetails] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [isSubmittingShare, setIsSubmittingShare] = useState(false);
  const [isProtectionModalOpen, setIsProtectionModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const chartDetails = useMemo(() => {
    if (!selectedSongDetails) return null;
    const selectedSheet = selectedSongDetails.sheets?.find(
      s => normalizeDifficulty(s.difficulty) === selectedSongDetails.level || s.difficulty === selectedSongDetails.level
    );
    return { ...selectedSongDetails, selectedSheet };
  }, [selectedSongDetails]);

  if (!playlist) return null;

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        aria-label="Playlist Details"
        size="xl"
        radius={24}
        padding={0}
        withCloseButton={false}
        centered
        styles={{
          content: {
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 60px)'
          },
          body: {
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden'
          },
        }}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <Box
          className="app-modal-header"
          style={{
            background: 'linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary), var(--theme-secondary) 40%))',
            padding: '24px 24px 20px',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <Group gap="sm" style={{ position: 'relative', zIndex: 1 }}>
            <Box
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3)',
              }}
            >
              <IconPlaylist size={20} color="var(--theme-primary-contrast)" strokeWidth={2.2} />
            </Box>
            <Box>
              <Text
                size="lg"
                fw={800}
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--theme-primary-contrast)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}
              >
                {playlist.title}
              </Text>
              <Text size="xs" style={{ color: 'var(--theme-primary-contrast)', opacity: 0.8, marginTop: 2 }}>
                {songs.length} {songs.length === 1 ? 'Song' : 'Songs'} in this playlist
              </Text>
            </Box>
          </Group>

          <UnstyledButton
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              padding: '4px 12px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.2)',
              color: 'var(--theme-primary-contrast)',
              fontSize: 12,
              fontWeight: 700,
              backdropFilter: 'blur(4px)',
              transition: 'all 0.2s ease',
              zIndex: 10,
            }}
            aria-label="Close"
            className="header-close-pill"
          >
            Close
          </UnstyledButton>
        </Box>

        {/* ── Scrollable Body ──────────────────────────────────────── */}
        <Box style={{ flex: 1, overflowY: 'auto' }}>
          <Stack gap="xl" p="lg">
            {playlist.comment && (
              <Box
                p="md"
                style={{
                  background: 'var(--theme-bg-soft)',
                  borderRadius: 16,
                  borderLeft: '4px solid var(--theme-primary)',
                  position: 'relative'
                }}
              >
                <Text size="sm" fw={500} c="dimmed" mb={4} tt="uppercase" style={{ letterSpacing: '0.05em', fontSize: 10 }}>
                  Playlist Note
                </Text>
                <Text size="sm" italic style={{ color: 'var(--theme-text)' }}>
                   "{playlist.comment}"
                </Text>
              </Box>
            )}

            <Box>
              <Group justify="space-between" mb="xs">
                <Text fw={800} size="sm" tt="uppercase" style={{ letterSpacing: '0.05em' }} c="dimmed">
                  Track List
                </Text>
              </Group>
              
              <Box
                style={{
                  borderRadius: 18,
                  border: '1px solid var(--theme-border)',
                  background: 'var(--theme-surface)',
                  padding: 12,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                }}
              >
                {songs.length > 0 ? (
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
                  </SimpleGrid>
                ) : (
                  <Stack align="center" py="xl" gap="xs">
                    <IconMusic size={32} c="dimmed" />
                    <Text size="sm" c="dimmed" fw={500}>No songs in this playlist yet.</Text>
                  </Stack>
                )}
              </Box>
            </Box>
          </Stack>
        </Box>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <Box 
          p="lg" 
          style={{ 
            borderTop: '1px solid var(--theme-border)',
            background: 'var(--theme-surface)',
            flexShrink: 0
          }}
        >
          <Group justify="space-between">
            {isOwnProfile && !hideShareDelete ? (
              <Button
                variant="subtle"
                color="red"
                radius="xl"
                leftSection={<IconTrash size={16} />}
                onClick={() => setIsProtectionModalOpen(true)}
                style={{ fontWeight: 600 }}
              >
                Delete
              </Button>
            ) : <Box />}

            <Group gap="sm">
              {isOwnProfile && playlist.is_public && !hideShareDelete && (
                <Button
                  variant="light"
                  color="teal"
                  radius="xl"
                  leftSection={<IconShare size={16} />}
                  onClick={() => setIsSharing(true)}
                  style={{ fontWeight: 600 }}
                >
                  Share
                </Button>
              )}
              {isOwnProfile ? (
                <Button
                  variant="light"
                  radius="xl"
                  leftSection={<IconEdit size={16} />}
                  onClick={() => {
                    onClose();
                    onEdit(playlist);
                  }}
                  style={{ fontWeight: 700 }}
                >
                  Edit Playlist
                </Button>
              ) : (
                <Button variant="default" radius="xl" onClick={onClose} style={{ fontWeight: 600 }}>
                  Close
                </Button>
              )}
            </Group>
          </Group>
        </Box>
      </Modal>

      {/* ── Share Modal ───────────────────────────────────────────── */}
      <Modal
        opened={isSharing}
        onClose={() => {
          setIsSharing(false);
          setShareMessage('');
        }}
        aria-label="Share Playlist"
        size="md"
        radius={24}
        padding={0}
        withCloseButton={false}
        centered
        zIndex={250}
      >
        <Box
          className="app-modal-header"
          style={{
            background: 'linear-gradient(135deg, var(--theme-teal, #0ca678), var(--theme-primary))',
            padding: '20px 24px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Group gap="sm" style={{ position: 'relative', zIndex: 1 }}>
            <Box
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconShare size={16} color="#fff" strokeWidth={2.5} />
            </Box>
            <Text fw={800} size="md" c="#fff" style={{ fontFamily: 'var(--font-heading)' }}>
              Share Playlist
            </Text>
          </Group>
          <button
            type="button"
            className="header-close-pill"
            aria-label="Close"
            onClick={() => {
              setIsSharing(false);
              setShareMessage('');
            }}
          />
        </Box>

        <Stack gap="md" p="lg">
          <Text size="sm" fw={600} c="dimmed">
            Sharing "<Text span fw={800} c="var(--theme-text)">{playlist.title}</Text>" with the community!
          </Text>
          
          <Box
            p="md"
            style={{
              borderRadius: 16,
              background: 'var(--theme-bg-soft)',
              border: '1px solid var(--theme-border)'
            }}
          >
            <Textarea
              label="Share Message"
              placeholder="Add a message to your post... (optional)"
              value={shareMessage}
              onChange={(e) => setShareMessage(e.currentTarget.value)}
              minRows={3}
              autosize
              maxLength={300}
              variant="unstyled"
              styles={{
                input: { fontSize: 14, fontWeight: 500 },
                label: { fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-text-muted)' }
              }}
            />
          </Box>

          <Group justify="space-between" p="sm" style={{ borderRadius: 12, background: 'var(--theme-surface)', border: '1px solid var(--theme-border)' }}>
            <Box>
              <Text size="sm" fw={700}>Allow Comments</Text>
              <Text size="xs" c="dimmed">Let others discuss your curated tracks</Text>
            </Box>
            <Switch
              checked={commentsEnabled}
              onChange={(e) => setCommentsEnabled(e.currentTarget.checked)}
              color="teal"
            />
          </Group>

          <Group justify="flex-end" mt="md">
            <Button variant="default" radius="xl" onClick={() => setIsSharing(false)} style={{ fontWeight: 600 }}>
              Cancel
            </Button>
            <Button
              radius="xl"
              leftSection={<IconCheck size={18} />}
              loading={isSubmittingShare}
              color="teal"
              style={{ fontWeight: 700, paddingLeft: 20, paddingRight: 20 }}
              onClick={async () => {
                if (!user) return;
                setIsSubmittingShare(true);
                try {
                  await playlistService.sharePlaylist(user.id, playlist.id, shareMessage.trim(), commentsEnabled);
                  notifications.show({ title: 'Success', message: 'Playlist shared successfully!', color: 'green' });
                  setIsSharing(false);
                  setShareMessage('');
                  setCommentsEnabled(true);
                } catch (error) {
                  console.error('Failed to share playlist', error);
                  notifications.show({ title: 'Error', message: 'Failed to share playlist.', color: 'red' });
                } finally {
                  setIsSubmittingShare(false);
                }
              }}
            >
              Post to Feed
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ── Chart Details Modal ─────────────────────────────────────── */}
      <Modal
        opened={!!selectedSongDetails}
        onClose={() => setSelectedSongDetails(null)}
        aria-label="Chart Details"
        size="sm"
        radius={24}
        padding={0}
        withCloseButton={false}
        centered
        zIndex={250}
        transitionProps={{ transition: 'fade', duration: 0 }}
      >
        {chartDetails && (
          <>
            <Box
              className="app-modal-header"
              style={{
                background: `linear-gradient(135deg, ${DIFFICULTY_COLORS[chartDetails.level] || 'var(--theme-primary)'}, color-mix(in srgb, ${DIFFICULTY_COLORS[chartDetails.level] || 'var(--theme-primary)'}, #000 20%))`,
                padding: '20px 24px',
                position: 'relative',
              }}
            >
               <Group gap="sm" style={{ position: 'relative', zIndex: 1 }}>
                <Box
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconMusic size={14} color="#fff" strokeWidth={2.5} />
                </Box>
                <Text fw={800} size="md" c="#fff" style={{ fontFamily: 'var(--font-heading)' }}>
                  Chart Details
                </Text>
              </Group>
               <ActionIcon 
                variant="transparent" 
                onClick={() => setSelectedSongDetails(null)} 
                aria-label="Close"
                className="header-close-pill"
                style={{ color: '#fff', position: 'absolute', top: 18, right: 18 }}
              >
                <IconX size={18} />
              </ActionIcon>
            </Box>

            <Stack gap="md" p="lg" align="center">
              <Box style={{ position: 'relative' }}>
                <Image
                  src={chartDetails.imageUrl || (chartDetails.imageName ? `${BASE_JACKET_URL}${chartDetails.imageName}` : null)}
                  alt={chartDetails.title}
                  w={140}
                  h={140}
                  radius={16}
                  fallbackSrc="https://placehold.co/140x140?text=No+Image"
                  style={{ 
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    border: '3px solid #fff'
                  }}
                />
                {chartDetails.selectedSheet?.type && (
                  <Box
                    style={{
                      position: 'absolute',
                      bottom: -8,
                      right: -8,
                      background: '#fff',
                      padding: '4px 6px',
                      borderRadius: 6,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}
                  >
                     <img
                      src={chartDetails.selectedSheet.type === 'dx' ? dxImage : standardImage}
                      alt={chartDetails.selectedSheet.type === 'dx' ? 'DX' : 'Standard'}
                      style={{ height: 12, display: 'block' }}
                    />
                  </Box>
                )}
              </Box>

              <Stack gap={2} align="center">
                <Text fw={800} ta="center" size="lg" style={{ lineHeight: 1.2 }}>{chartDetails.title}</Text>
                <Text size="xs" fw={600} c="dimmed" ta="center">{chartDetails.artist}</Text>
                <Badge 
                  size="xs" 
                  variant="dot" 
                  mt={4}
                  color={DIFFICULTY_COLORS[chartDetails.level] || 'gray'}
                >
                  {VERSION_MAPPING?.[chartDetails.version] || chartDetails.version}
                </Badge>
              </Stack>

              <Box
                w="100%"
                p="md"
                style={{
                  borderRadius: 16,
                  background: 'var(--theme-bg-soft)',
                  border: '1px solid var(--theme-border)',
                  display: 'flex',
                  justifyContent: 'space-around',
                  alignItems: 'center'
                }}
              >
                <Stack gap={0} align="center">
                  <Text size="xs" fw={800} c="dimmed" tt="uppercase">Level</Text>
                  <Text fw={900} size="xl" color={DIFFICULTY_COLORS[chartDetails.level] || 'gray'}>
                    {chartDetails.level}
                  </Text>
                </Stack>
                
                <Divider orientation="vertical" />
                
                <Stack gap={0} align="center">
                  <Text size="xs" fw={800} c="dimmed" tt="uppercase">Constant</Text>
                  <Text fw={900} size="xl">
                    {chartDetails.selectedSheet?.internalLevel || '-'}
                  </Text>
                </Stack>
              </Box>

              {chartDetails.selectedSheet?.noteDesigner && chartDetails.selectedSheet.noteDesigner !== '-' && (
                <Text size="xs" c="dimmed" fw={600}>Notes: {chartDetails.selectedSheet.noteDesigner}</Text>
              )}

              <Button
                variant="filled"
                leftSection={<IconMessageCircle size={18} />}
                mt="sm"
                w="100%"
                radius="xl"
                style={{ fontWeight: 700 }}
                onClick={() => {
                  onClose();
                  navigate(`/songs/${chartDetails.songId}`, {
                    state: { cardType: chartDetails.cardType || chartDetails.selectedSheet?.type }
                  });
                }}
              >
                Discuss this Song
              </Button>
            </Stack>
          </>
        )}
      </Modal >

      <PlaylistProtectionModal
        opened={isProtectionModalOpen}
        onClose={() => setIsProtectionModalOpen(false)}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            await onDelete(playlist.id);
            setIsProtectionModalOpen(false);
          } finally {
            setIsDeleting(false);
          }
        }}
        type="delete"
        loading={isDeleting}
      />
    </>
  );
}
