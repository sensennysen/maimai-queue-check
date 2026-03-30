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
  UnstyledButton
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconEdit from '@tabler/icons-react/dist/esm/icons/IconEdit.mjs';
import IconStarFilled from '@tabler/icons-react/dist/esm/icons/IconStarFilled.mjs';
import { useState, useEffect } from 'react';
import { VERSION_MAPPING, CATEGORY_TRANSLATION, DIFFICULTY_COLORS, normalizeDifficulty, BASE_JACKET_URL } from '../../config/maimai-constants';
import { Link } from 'react-router-dom';
import IconMessageCircle from '@tabler/icons-react/dist/esm/icons/IconMessageCircle.mjs';
import IconMusic from '@tabler/icons-react/dist/esm/icons/IconMusic.mjs';

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

  // Header background color based on difficulty
  const headerBg = difficulty ? DIFFICULTY_COLORS[normalizedDifficulty] || 'var(--theme-primary)' : 'var(--theme-primary)';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
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
      {/* ── Fixed Header ─────────────────────────────────────────── */}
      <Box
        style={{
          background: `linear-gradient(135deg, ${headerBg}, color-mix(in srgb, ${headerBg}, #000 20%))`,
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
            <IconMusic size={18} color="#fff" strokeWidth={2.2} />
          </Box>
          <Box>
            <Text
              size="lg"
              fw={800}
              style={{
                fontFamily: 'var(--font-heading)',
                color: '#fff',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              {song.title}
            </Text>
            <Text size="xs" style={{ color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              {song.artist}
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
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s ease',
            zIndex: 10,
          }}
          className="header-close-pill"
        >
          Close
        </UnstyledButton>
      </Box>

      {/* ── Scrollable Body ──────────────────────────────────────── */}
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <Stack gap="lg" p="lg">
          {/* Top Info Section */}
          <Group align="flex-start" gap="xl" wrap={{ base: 'wrap', sm: 'nowrap' }}>
            <Box style={{ position: 'relative', flexShrink: 0 }}>
              <Image
                src={song.imageUrl || (song.imageName ? `${BASE_JACKET_URL}${song.imageName}` : null)}
                alt={song.title}
                radius={16}
                w={{ base: 140, sm: 200 }}
                h={{ base: 140, sm: 200 }}
                fallbackSrc="https://placehold.co/240x240?text=No+Image"
                style={{ 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  border: '3px solid #fff'
                }}
              />
              <Tooltip label="Click to copy title" withArrow position="top">
                <Box
                  onClick={handleTitleClick}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'rgba(255,255,255,0.85)',
                    borderRadius: '50%',
                    padding: 6,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  }}
                >
                  <IconCheck size={14} color="var(--theme-primary)" />
                </Box>
              </Tooltip>
            </Box>

            <Stack gap="md" style={{ flex: 1 }}>
              <Box
                p="md"
                style={{
                  borderRadius: 16,
                  background: 'var(--theme-surface)',
                  border: '1px solid var(--theme-border)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
                }}
              >
                <SimpleGrid cols={2} spacing="md">
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.05em' }}>Category</Text>
                    <Text fw={700} size="sm">{CATEGORY_TRANSLATION[song.category] || song.category || 'Unknown'}</Text>
                  </Stack>
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.05em' }}>Version</Text>
                    <Text fw={700} size="sm" lineClamp={1}>{VERSION_MAPPING[song.version] || song.version || 'Unknown'}</Text>
                  </Stack>
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.05em' }}>Type</Text>
                    <Text fw={700} size="sm">{song.cardType?.toUpperCase() || 'Standard'}</Text>
                  </Stack>
                  {song.bpm && (
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed" fw={800} tt="uppercase" style={{ letterSpacing: '0.05em' }}>BPM</Text>
                      <Text fw={700} size="sm">{song.bpm}</Text>
                    </Stack>
                  )}
                </SimpleGrid>
              </Box>

              {(playCount !== undefined || difficulty) && (
                <Box
                  p="md"
                  style={{
                    borderRadius: 16,
                    background: 'var(--theme-bg-soft)',
                    border: '1px solid var(--theme-border)',
                  }}
                >
                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      <Text size="xs" fw={800} c="dimmed" tt="uppercase">Performance</Text>
                      <Badge 
                        variant="filled" 
                        radius="sm" 
                        size="xs"
                        color={DIFFICULTY_COLORS[normalizedDifficulty] || 'gray'}
                      >
                        {normalizedDifficulty}
                      </Badge>
                    </Group>
                    <Group gap={4} align="baseline">
                      <Text fw={900} size="xl" lh={1} c="var(--theme-primary)">{playCount || 0}</Text>
                      <Text size="xs" fw={700} c="dimmed">plays</Text>
                    </Group>
                  </Group>
                </Box>
              )}
            </Stack>
          </Group>

          {/* Best 50 Details Section */}
          {effectiveBest50Score && (
            <Box
              p="md"
              style={{
                borderRadius: 20,
                background: 'var(--theme-surface)',
                border: '1px solid var(--theme-border)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
              }}
            >
              <Text fw={800} size="xs" tt="uppercase" style={{ letterSpacing: '0.05em' }} c="var(--theme-text-muted)" mb="md">
                Best 50 Details
              </Text>
              
              <SimpleGrid cols={{ base: 3, xs: 3 }} spacing="sm">
                <Stack gap={2} align="center">
                  <Text size="xs" c="dimmed" fw={800} tt="uppercase">Achievement</Text>
                  <Text fw={800} size="lg" c="var(--theme-text)">{parseFloat(effectiveBest50Score.achievement).toFixed(4)}%</Text>
                </Stack>
                <Stack gap={2} align="center">
                  <Text size="xs" c="dimmed" fw={800} tt="uppercase">Rating</Text>
                  <Text fw={800} size="lg" c="var(--theme-text)">{effectiveBest50Score.rating}</Text>
                </Stack>
                <Stack gap={2} align="center">
                  <Text size="xs" c="dimmed" fw={800} tt="uppercase">DX Score</Text>
                  <Text fw={800} size="lg" c="var(--theme-text)">{effectiveBest50Score.dxScore}</Text>
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

          {/* User Comment Section */}
          {(comment || isOwnProfile) && (
            <Box
              p="md"
              style={{
                borderRadius: 20,
                background: 'var(--theme-surface)',
                border: '1px solid var(--theme-border)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
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
                    placeholder="Add a comment..."
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
                <Box p="sm" radius="md" bg="var(--theme-bg-soft)" style={{ border: '1px solid var(--theme-border)' }}>
                  <Text
                    size="sm"
                    italic
                    fw={500}
                    style={{
                      fontStyle: 'italic',
                      color: 'var(--theme-text)',
                      wordBreak: 'break-word'
                    }}
                  >
                    {comment ? `"${comment}"` : "No comment added."}
                  </Text>
                </Box>
              )}
            </Box>
          )}
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
        <Group justify="flex-end">
          <Button 
            variant="default" 
            onClick={onClose} 
            radius="xl"
            style={{ fontWeight: 600 }}
          >
            Close
          </Button>
          <Button
            component={Link}
            to={`/songs/${song.songId}`}
            state={{ cardType: song.cardType }}
            radius="xl"
            leftSection={<IconMessageCircle size={18} />}
            color="var(--theme-primary)"
            style={{ 
              fontWeight: 700,
              paddingLeft: 24,
              paddingRight: 24,
              boxShadow: '0 4px 12px rgba(var(--theme-primary-rgb), 0.2)'
            }}
          >
            Discuss Song
          </Button>
        </Group>
      </Box>
    </Modal>
  );
}

export default MaimaiSongDetailModal;
