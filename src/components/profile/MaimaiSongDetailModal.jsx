import {
  Modal,
  Image,
  Text,
  Group,
  Stack,
  Tooltip,
  SimpleGrid,
  TextInput,
  ActionIcon,
  Badge,
  Button,
  Box,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconEdit from '@tabler/icons-react/dist/esm/icons/IconEdit.mjs';
import IconStarFilled from '@tabler/icons-react/dist/esm/icons/IconStarFilled.mjs';
import IconDisc from '@tabler/icons-react/dist/esm/icons/IconDisc.mjs';
import IconMessageCircle from '@tabler/icons-react/dist/esm/icons/IconMessageCircle.mjs';
import { useState, useEffect } from 'react';
import { VERSION_MAPPING, CATEGORY_TRANSLATION, DIFFICULTY_COLORS, normalizeDifficulty, BASE_JACKET_URL } from '../../config/maimai-constants';
import { Link } from 'react-router-dom';

function MaimaiSongDetailModal({
  song,
  opened,
  onClose,
  comment: initialComment,
  playCount,
  difficulty,
  isOwnProfile,
  onCommentSave,
  best50Score
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState(initialComment || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setComment(initialComment || '');
    setIsEditing(false);
  }, [initialComment, opened]);

  if (!song) return null;

  const handleSaveComment = async () => {
    if (!onCommentSave) return;
    setIsSaving(true);
    try {
      await onCommentSave(comment);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save comment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleClick = () => {
    navigator.clipboard.writeText(song.title).then(() => {
      notifications.show({
        title: 'Copied!',
        message: `${song.title} copied to clipboard`,
        color: 'green',
        icon: <IconCheck size={16} />,
        autoClose: 2000,
        withCloseButton: false,
      });
    }).catch(err => console.error('Failed to copy:', err));
  };

  const normalizedDifficulty = normalizeDifficulty(difficulty);
  const effectiveBest50Score = best50Score || null;
  const b50DxStar = effectiveBest50Score?.dxStar;

  const typeImage = song.cardType === 'dx'
    ? new URL('../../assets/music_dx.png', import.meta.url).href
    : new URL('../../assets/music_standard.png', import.meta.url).href;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      radius={24}
      padding={0}
      withCloseButton={false}
      centered
      transitionProps={{ transition: 'fade', duration: 200 }}
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      styles={{
        content: {
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 40px)'
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
      {/* ── Fixed Gradient Header ─────────────────────────────────── */}
      <Box
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
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3)',
            }}
          >
            <IconDisc size={18} color="var(--theme-primary-contrast)" strokeWidth={2.2} />
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
              Song Details
            </Text>
          </Box>
        </Group>

        <UnstyledButton
          onClick={onClose}
          className="header-close-pill"
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
        >
          Close
        </UnstyledButton>
      </Box>

      {/* ── Scrollable Body ───────────────────────────────────────── */}
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <Stack gap="md" p="xl">

          {/* Hero: Image + Info */}
          <Group align="center" justify="center" gap="xl" wrap="nowrap" style={{ paddingBottom: '1rem' }}>
            <Image
              src={song.imageUrl || (song.imageName ? `${BASE_JACKET_URL}${song.imageName}` : null)}
              alt={song.title}
              radius="md"
              w={{ base: 160, xs: 200, sm: 240 }}
              h={{ base: 160, xs: 200, sm: 240 }}
              fallbackSrc="https://placehold.co/240x240?text=No+Image"
              style={{ boxShadow: 'var(--mantine-shadow-md)', flexShrink: 0 }}
            />

            <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
              <Tooltip label="Click to copy title" withArrow position="top">
                <Text
                  size="xl"
                  fw={700}
                  style={{ fontFamily: 'var(--font-heading)', lineHeight: 1.2, cursor: 'pointer' }}
                  onClick={handleTitleClick}
                >
                  {song.title}
                </Text>
              </Tooltip>

              <Stack gap={2}>
                <Text size="sm" c="secondary" fw={700} tt="uppercase">Artist</Text>
                <Text size="md" lineClamp={2} title={song.artist}>{song.artist}</Text>
              </Stack>

              <SimpleGrid cols={2} spacing="sm" verticalSpacing="sm" mt="xs">
                <Stack gap={2}>
                  <Text size="sm" c="secondary" fw={700} tt="uppercase">Category</Text>
                  <Text size="md" lineClamp={1}>
                    {CATEGORY_TRANSLATION[song.category] || song.category || 'Unknown'}
                  </Text>
                </Stack>

                <Stack gap={2}>
                  <Text size="sm" c="secondary" fw={700} tt="uppercase">Version</Text>
                  <Text size="md" lineClamp={1}>
                    {VERSION_MAPPING[song.version] || song.version || 'Unknown'}
                  </Text>
                </Stack>

                <Stack gap={2}>
                  <Text size="sm" c="secondary" fw={700} tt="uppercase">Type</Text>
                  <img src={typeImage} alt={song.cardType} style={{ height: 20, maxWidth: '100%', objectFit: 'contain', alignSelf: 'flex-start' }} />
                </Stack>

                {song.bpm && (
                  <Stack gap={2}>
                    <Text size="sm" c="secondary" fw={700} tt="uppercase">BPM</Text>
                    <Text size="md">{song.bpm}</Text>
                  </Stack>
                )}
              </SimpleGrid>

              {/* Performance chip — shown inline when difficulty/playCount available */}
              {(playCount !== undefined || difficulty) && (
                <Group gap="xs" align="center" mt="xs">
                  <Badge
                    variant="filled"
                    radius="sm"
                    size="sm"
                    color={DIFFICULTY_COLORS[normalizedDifficulty] || 'gray'}
                  >
                    {normalizedDifficulty}
                  </Badge>
                  <Text size="sm" fw={700} c="var(--theme-primary)">
                    {playCount || 0}
                  </Text>
                  <Text size="xs" fw={600} c="dimmed">plays</Text>
                </Group>
              )}

              <Stack gap="sm" mt="md">
                <Button
                  component={Link}
                  to={`/songs/${song.songId}`}
                  state={{ cardType: song.cardType }}
                  variant="light"
                  color="indigo"
                  leftSection={<IconMessageCircle size={18} />}
                  fullWidth
                >
                  Discuss
                </Button>
              </Stack>
            </Stack>
          </Group>

          {/* Best 50 Details */}
          {effectiveBest50Score && (
            <Box
              p="md"
              style={{
                borderRadius: 18,
                background: 'var(--theme-surface)',
                border: '1px solid var(--theme-border)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}
            >
              <Text fw={800} size="xs" tt="uppercase" style={{ letterSpacing: '0.05em' }} c="var(--theme-text-muted)" mb="md">
                Best 50 Details
              </Text>

              <SimpleGrid cols={3} spacing="sm">
                <Stack gap={2} align="center">
                  <Text size="xs" c="dimmed" fw={800} tt="uppercase">Achievement</Text>
                  <Text fw={800} size="lg">{parseFloat(effectiveBest50Score.achievement).toFixed(4)}%</Text>
                </Stack>
                <Stack gap={2} align="center">
                  <Text size="xs" c="dimmed" fw={800} tt="uppercase">Rating</Text>
                  <Text fw={800} size="lg">{effectiveBest50Score.rating}</Text>
                </Stack>
                <Stack gap={2} align="center">
                  <Text size="xs" c="dimmed" fw={800} tt="uppercase">DX Score</Text>
                  <Text fw={800} size="lg">{effectiveBest50Score.dxScore}</Text>
                </Stack>
              </SimpleGrid>

              <Group justify="space-between" mt="md" pt="sm" style={{ borderTop: '1px solid var(--theme-border)' }}>
                <Box>
                  <Text size="xs" c="dimmed" fw={800} tt="uppercase" mb={4}>DX Stars</Text>
                  <Group gap={2}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <IconStarFilled key={i} size={14} style={{ color: i < (b50DxStar || 0) ? '#fcc419' : 'var(--theme-border)' }} />
                    ))}
                  </Group>
                </Box>
                <Box style={{ textAlign: 'right' }}>
                  <Text size="xs" c="dimmed" fw={800} tt="uppercase" mb={2}>Last Played</Text>
                  <Text fw={700} size="sm">{effectiveBest50Score.lastPlayed ?? effectiveBest50Score.last_played ?? 'N/A'}</Text>
                </Box>
              </Group>
            </Box>
          )}

          {/* User Note */}
          {(comment || isOwnProfile) && (
            <Box
              p="md"
              style={{
                borderRadius: 18,
                background: 'var(--theme-surface)',
                border: '1px solid var(--theme-border)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}
            >
              <Group justify="space-between" align="center" mb="xs">
                <Text fw={800} size="xs" tt="uppercase" style={{ letterSpacing: '0.05em' }} c="var(--theme-text-muted)">
                  User Note
                </Text>
                {isOwnProfile && !isEditing && (
                  <ActionIcon variant="light" size="sm" radius="md" onClick={() => setIsEditing(true)}>
                    <IconEdit size={14} />
                  </ActionIcon>
                )}
              </Group>

              {isEditing ? (
                <Stack gap="xs">
                  <TextInput
                    value={comment}
                    onChange={(e) => setComment(e.currentTarget.value)}
                    placeholder="Add a note..."
                    maxLength={100}
                    autoFocus
                    variant="filled"
                    styles={{ input: { borderRadius: 12, fontWeight: 500 } }}
                  />
                  <Group gap="xs" justify="flex-end">
                    <Button
                      size="xs"
                      variant="subtle"
                      color="gray"
                      radius="xl"
                      onClick={() => { setIsEditing(false); setComment(initialComment || ''); }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="xs"
                      radius="xl"
                      leftSection={<IconCheck size={14} />}
                      onClick={handleSaveComment}
                      loading={isSaving}
                    >
                      Save Note
                    </Button>
                  </Group>
                </Stack>
              ) : (
                <Box p="sm" radius="md" bg="var(--theme-bg-soft)" style={{ border: '1px solid var(--theme-border)', borderRadius: 12 }}>
                  <Text
                    size="sm"
                    fw={500}
                    style={{
                      fontStyle: 'italic',
                      color: 'var(--theme-text)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {comment ? `"${comment}"` : 'No note added.'}
                  </Text>
                </Box>
              )}
            </Box>
          )}

        </Stack>
      </Box>
    </Modal>
  );
}

export default MaimaiSongDetailModal;
