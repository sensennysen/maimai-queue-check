import { Modal, Image, Text, Group, Stack, Tooltip, SimpleGrid, TextInput, ActionIcon, Divider, Badge, Button, Box } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconEdit, IconX, IconStarFilled } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { VERSION_MAPPING, CATEGORY_TRANSLATION, DIFFICULTY_COLORS, normalizeDifficulty, BASE_JACKET_URL } from '../../config/maimai-constants';
import { Link } from 'react-router-dom';
import { IconMessageCircle } from '@tabler/icons-react';

function MaimaiSongDetailModal({
  song,
  opened,
  onClose,
  comment: initialComment,
  playCount,
  difficulty,
  title = "Song Details",
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

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700} style={{ fontFamily: 'var(--font-heading)' }}>{title}</Text>}
      size="lg"
      radius="md"
      centered
      transitionProps={{ transition: 'fade', duration: 0 }}
      classNames={{ content: 'profile-modal-pop' }}
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      styles={{
        header: {
          marginBottom: '0.5rem',
          borderBottom: '1px solid var(--mantine-color-default-border)'
        },
        body: {
          padding: 'var(--mantine-spacing-xl)',
        }
      }}
    >
      <Stack gap="md">
        {/* Header Section with Image and Basic Info */}
        <Group align="center" justify="center" gap="xl" wrap="nowrap" style={{ paddingBottom: '1rem' }}>
          <Image
            src={song.imageUrl || (song.imageName ? `${BASE_JACKET_URL}${song.imageName}` : null)}
            alt={song.title}
            radius="md"
            w={{ base: 140, xs: 180, sm: 220 }}
            h={{ base: 140, xs: 180, sm: 220 }}
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

            <Stack gap={0}>
              <Text size="sm" c="dimmed" fw={700} tt="uppercase">Artist</Text>
              <Text fw={600} lineClamp={1}>{song.artist || 'Unknown'}</Text>
            </Stack>
            <SimpleGrid cols={2} spacing="md">
              <Stack gap={0}>
                <Text size="sm" c="dimmed" fw={700} tt="uppercase">Category</Text>
                <Text fw={600}>{CATEGORY_TRANSLATION[song.category] || song.category || 'Unknown'}</Text>
              </Stack>
              <Stack gap={0}>
                <Text size="sm" c="dimmed" fw={700} tt="uppercase">Version</Text>
                <Text fw={600} lineClamp={1}>{VERSION_MAPPING[song.version] || song.version || 'Unknown'}</Text>
              </Stack>
            </SimpleGrid>
            <SimpleGrid cols={2} spacing="md">
              <Stack gap={0}>
                <Text size="sm" c="dimmed" fw={700} tt="uppercase">Type</Text>
                <Text fw={600}>{song.cardType?.toUpperCase() || 'Standard'}</Text>
              </Stack>
              {song.bpm && (
                <Stack gap={0}>
                  <Text size="sm" c="dimmed" fw={700} tt="uppercase">BPM</Text>
                  <Text fw={600}>{song.bpm}</Text>
                </Stack>
              )}
            </SimpleGrid>

            {(playCount !== undefined || difficulty) && (
              <Stack gap={2} mt="md">
                <Group gap={8} align="center">
                  {playCount !== undefined && (
                    <Group gap={4} align="baseline">
                      <Text fw={900} size="xl" lh={1}>{playCount}</Text>
                      <Text size="sm" fw={700} c="dimmed">plays</Text>
                    </Group>
                  )}
                  {difficulty && (
                    <Badge
                      color={DIFFICULTY_COLORS[normalizedDifficulty] || 'gray'}
                      variant="filled"
                      size="lg"
                    >
                      {normalizedDifficulty}
                    </Badge>
                  )}
                </Group>
              </Stack>
            )}

            {effectiveBest50Score && (
              <Stack gap="xs" mt="md">
                <Box mt="xs">
                  <Divider mb="md" label={<Text size="sm" c="dimmed" fw={700} tt="uppercase">Best 50 Details</Text>} labelPosition="center" />
                  <SimpleGrid cols={3} spacing="sm">
                    <div className="stat-item">
                      <Text size="sm" c="dimmed" fw={700} tt="uppercase">Achievement</Text>
                      <Text fw={750} size="lg">{parseFloat(effectiveBest50Score.achievement).toFixed(4)}%</Text>
                    </div>
                    <div className="stat-item">
                      <Text size="sm" c="dimmed" fw={700} tt="uppercase">Rating</Text>
                      <Text fw={750} size="lg">{effectiveBest50Score.rating}</Text>
                    </div>
                    <div className="stat-item">
                      <Text size="sm" c="dimmed" fw={700} tt="uppercase">DX Score</Text>
                      <Text fw={750} size="lg">{effectiveBest50Score.dxScore}</Text>
                    </div>
                  </SimpleGrid>
                  <SimpleGrid cols={2} spacing="md" mt="sm">
                    <div className="stat-item">
                      <Text size="sm" c="dimmed" fw={700} tt="uppercase">DX Stars</Text>
                      <Group gap={4}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <IconStarFilled key={i} size={16} style={{ color: i < (b50DxStar || 0) ? 'var(--mantine-color-yellow-6)' : 'var(--mantine-color-gray-3)' }} />
                        ))}
                      </Group>
                    </div>
                    <div className="stat-item">
                      <Text size="sm" c="dimmed" fw={700} tt="uppercase">Last Played</Text>
                      <Text fw={600}>{effectiveBest50Score.lastPlayed ?? effectiveBest50Score.last_played ?? 'N/A'}</Text>
                    </div>
                  </SimpleGrid>
                </Box>
              </Stack>
            )}

            {(comment || isOwnProfile) && (
              <Stack gap={4} mt="md">
                <Group justify="space-between" align="center">
                  <Text size="sm" c="dimmed" fw={700} tt="uppercase">User Comment</Text>
                  {isOwnProfile && !isEditing && (
                    <ActionIcon variant="subtle" size="sm" onClick={() => setIsEditing(true)}>
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
                    />
                    <Group gap="xs" justify="flex-end">
                      <ActionIcon variant="light" color="red" onClick={() => { setIsEditing(false); setComment(initialComment || ''); }}>
                        <IconX size={14} />
                      </ActionIcon>
                      <ActionIcon variant="filled" color="green" onClick={handleSaveComment} loading={isSaving}>
                        <IconCheck size={14} />
                      </ActionIcon>
                    </Group>
                  </Stack>
                ) : (
                  <Text
                    size="sm"
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontStyle: 'italic',
                      lineHeight: 1.5,
                      color: 'var(--theme-text-muted)',
                      wordBreak: 'break-word'
                    }}
                  >
                    {comment ? `"${comment}"` : <Text span c="dimmed" fs="italic">No comment added.</Text>}
                  </Text>
                )}
              </Stack>
            )}

            <Button
              component={Link}
              to={`/songs/${song.songId}`}
              state={{ cardType: song.cardType }}
              variant="light"
              color="indigo"
              fullWidth
              mt="md"
              leftSection={<IconMessageCircle size={18} />}
            >
              Discuss this Song
            </Button>
          </Stack>
        </Group>
      </Stack >
    </Modal >
  );
}

export default MaimaiSongDetailModal;
