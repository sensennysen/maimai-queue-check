import { Modal, Image, Text, Group, Stack, Tooltip, SimpleGrid } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { VERSION_MAPPING, CATEGORY_TRANSLATION } from '../../config/maimai-constants';

function MaimaiSongDetailModal({ song, opened, onClose, comment, playCount, title = "Song Details" }) {
  if (!song) return null;

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

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700} style={{ fontFamily: 'var(--font-heading)' }}>{title}</Text>}
      size="lg"
      radius="md"
      centered
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

            {playCount !== undefined && (
              <Stack gap={2} mt="md">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">Play Count</Text>
                <Group gap={4} align="baseline">
                  <Text size="xl" fw={900} c="primary.6" style={{ lineHeight: 1 }}>{playCount}</Text>
                  <Text size="xs" fw={700} c="dimmed">plays</Text>
                </Group>
              </Stack>
            )}

            {comment && (
              <Stack gap={2} mt="md">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase">User Comment</Text>
                <Text
                  size="sm"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                    color: 'var(--theme-text-muted)',
                  }}
                >
                  "{comment}"
                </Text>
              </Stack>
            )}
          </Stack>
        </Group>
      </Stack >
    </Modal >
  );
}

export default MaimaiSongDetailModal;
