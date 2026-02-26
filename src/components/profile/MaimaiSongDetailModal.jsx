import { Modal, Image, Text, Group, Stack, Tooltip, SimpleGrid, TextInput, ActionIcon, Divider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconEdit, IconCheck as IconSave, IconX, IconStarFilled } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { VERSION_MAPPING, CATEGORY_TRANSLATION, DIFFICULTY_COLORS, normalizeDifficulty } from '../../config/maimai-constants';
import { Badge, Button } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconMessageCircle } from '@tabler/icons-react';

const formatComboAchievement = (value) => {
  if (!value) return null;
  const v = String(value).trim();
  const lower = v.toLowerCase();
  if (lower === 'fc') return 'FC';
  if (lower === 'fcp') return 'FC+';
  if (lower === 'ap') return 'AP';
  if (lower === 'app') return 'AP+';
  if (v === 'FC' || v === 'FC+' || v === 'AP' || v === 'AP+') return v;
  return v;
};

const formatSyncType = (value) => {
  if (!value) return null;
  const v = String(value).trim();
  const lower = v.toLowerCase();
  if (lower === 'fs') return 'FS';
  if (lower === 'fsp') return 'FS+';
  if (lower === 'fdx') return 'FDX';
  if (lower === 'fdxp') return 'FDX+';
  if (v === 'FS' || v === 'FS+' || v === 'FDX' || v === 'FDX+') return v;
  return v;
};

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

  const typeImage = song.cardType === 'dx'
    ? new URL('../../assets/music_dx.png', import.meta.url).href
    : new URL('../../assets/music_standard.png', import.meta.url).href;

  const normalizedDifficulty = normalizeDifficulty(difficulty);
  const effectiveBest50Score = best50Score || null;
  const b50ComboTag = formatComboAchievement(
    effectiveBest50Score?.comboAchievement ?? effectiveBest50Score?.comboAchivement
  );
  const b50SyncTag = formatSyncType(
    effectiveBest50Score?.syncType ?? effectiveBest50Score?.syncAchievement ?? effectiveBest50Score?.syncAchivement
  );
  const b50DxScore = effectiveBest50Score?.dxScore;
  const b50TotalDxScore = effectiveBest50Score?.totalDxScore;
  const b50DxStar = effectiveBest50Score?.dxStar;
  const b50Achievement = effectiveBest50Score?.achievement;
  const b50Rating = effectiveBest50Score?.rating;
  const b50LastPlayed = effectiveBest50Score?.lastPlayed ?? effectiveBest50Score?.last_played;

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
            src={song.imageUrl}
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

            <Stack gap={2}>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">Artist</Text>
              <Text size="sm" lineClamp={2} title={song.artist}>{song.artist}</Text>
            </Stack>

            <SimpleGrid cols={2} spacing="sm" verticalSpacing="sm" mt="xs">
              <Stack gap={2}>
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">Category</Text>
                <Text size="sm" lineClamp={1} title={CATEGORY_TRANSLATION[song.category] || song.category}>
                  {CATEGORY_TRANSLATION[song.category] || song.category}
                </Text>
              </Stack>

              <Stack gap={2}>
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">Version</Text>
                <Text size="sm" lineClamp={1} title={VERSION_MAPPING[song.version] || song.version}>
                  {VERSION_MAPPING[song.version] || song.version}
                </Text>
              </Stack>

              <Stack gap={2}>
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">Type</Text>
                <img src={typeImage} alt={song.cardType} style={{ height: 20, maxWidth: '100%', objectFit: 'contain', alignSelf: 'flex-start' }} />
              </Stack>

              {song.bpm && (
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">BPM</Text>
                  <Text size="sm">{song.bpm}</Text>
                </Stack>
              )}
            </SimpleGrid>

            {(playCount !== undefined || difficulty) && (
              <Stack gap={2} mt="md">
                <Group gap={8} align="center">
                  {playCount !== undefined && (
                    <Group gap={4} align="baseline">
                      <Text size="xl" fw={900} c="primary.6" style={{ lineHeight: 1 }}>{playCount}</Text>
                      <Text size="xs" fw={700} c="dimmed">plays</Text>
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
                <Divider />
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">Best 50 Details</Text>

                {(b50ComboTag || b50SyncTag) && (
                  <Group gap={6} wrap="wrap">
                    {b50ComboTag && (
                      <Badge size="sm" variant="light" color="orange">
                        {b50ComboTag}
                      </Badge>
                    )}
                    {b50SyncTag && (
                      <Badge size="sm" variant="light" color="cyan">
                        {b50SyncTag}
                      </Badge>
                    )}
                  </Group>
                )}

                <SimpleGrid cols={2} spacing="sm" verticalSpacing="xs">
                  {b50Achievement !== undefined && b50Achievement !== null && (
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed" fw={700} tt="uppercase">Achievement</Text>
                      <Text size="sm" fw={700}>{parseFloat(b50Achievement).toFixed(4)}%</Text>
                    </Stack>
                  )}

                  {b50Rating !== undefined && b50Rating !== null && (
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed" fw={700} tt="uppercase">Rating</Text>
                      <Text size="sm" fw={800}>{b50Rating}</Text>
                    </Stack>
                  )}

                  {(b50DxScore !== undefined && b50DxScore !== null) && (
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed" fw={700} tt="uppercase">DX Score</Text>
                      <Text size="sm" fw={700}>
                        {b50DxScore}
                        {b50TotalDxScore ? `/${b50TotalDxScore}` : ''}
                      </Text>
                    </Stack>
                  )}

                  {(b50DxStar !== undefined && b50DxStar !== null) && (
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed" fw={700} tt="uppercase">DX Stars</Text>
                      <Group gap={6} align="center">
                        <Group gap={2}>
                          {Array.from({ length: Math.max(0, Math.min(5, Number(b50DxStar) || 0)) }).map((_, i) => (
                            <IconStarFilled key={i} size={16} style={{ color: 'var(--mantine-color-yellow-6)' }} />
                          ))}
                        </Group>
                      </Group>
                    </Stack>
                  )}

                  {b50LastPlayed && (
                    <Stack gap={2} style={{ gridColumn: '1 / -1' }}>
                      <Text size="xs" c="dimmed" fw={700} tt="uppercase">Last Played</Text>
                      <Text size="sm">{b50LastPlayed}</Text>
                    </Stack>
                  )}
                </SimpleGrid>
              </Stack>
            )}

            {(comment || isOwnProfile) && (
              <Stack gap={2} mt="md">
                <Group justify="space-between" align="center">
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">User Comment</Text>
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
                        <IconSave size={14} />
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
