import { useState } from 'react';
import { Modal, Image, Text, Group, Stack, Badge, Table, ScrollArea, Tooltip, SimpleGrid, Button, Box, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconMessageCircle from '@tabler/icons-react/dist/esm/icons/IconMessageCircle.mjs';
import IconPlaylistAdd from '@tabler/icons-react/dist/esm/icons/IconPlaylistAdd.mjs';
import IconDisc from '@tabler/icons-react/dist/esm/icons/IconDisc.mjs';
import { Link } from 'react-router-dom';
import { DIFFICULTY_COLORS, VERSION_MAPPING, CATEGORY_TRANSLATION, normalizeDifficulty, BASE_JACKET_URL } from '../../../config/maimai-constants';
import { AddToPlaylistModal } from '../../../components/modals/AddToPlaylistModal';

const DIFFICULTY_ORDER = ['Basic', 'Advanced', 'Expert', 'Master', 'Re:Master'];

function SongDetailModal({ song, opened, onClose }) {
  const [addToPlaylistOpened, setAddToPlaylistOpened] = useState(false);

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
    ? new URL('../../../assets/music_dx.png', import.meta.url).href
    : new URL('../../../assets/music_standard.png', import.meta.url).href;

  // Sort sheets
  const sortedSheets = [...(song.sheets || [])].sort((a, b) => {
    const diffA = DIFFICULTY_ORDER.indexOf(normalizeDifficulty(a.difficulty));
    const diffB = DIFFICULTY_ORDER.indexOf(normalizeDifficulty(b.difficulty));
    return diffA - diffB;
  });

  const rows = sortedSheets.map((sheet) => {
    const difficultyKey = normalizeDifficulty(sheet.difficulty);
    const color = DIFFICULTY_COLORS[difficultyKey] || 'gray';

    return (
      <Table.Tr key={sheet.type + sheet.difficulty}>
        <Table.Td>
          <Badge color={color} variant="filled" size="md" w={100} style={{ fontFamily: 'var(--font-heading)' }}>
            {difficultyKey}
          </Badge>
        </Table.Td>
        <Table.Td style={{ fontWeight: 700, fontSize: '1.1rem' }}>{sheet.internalLevel || '-'}</Table.Td>
        <Table.Td style={{ fontSize: '0.9rem' }}>{sheet.noteDesigner || '-'}</Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      radius={24}
      centered
      padding={0}
      withCloseButton={false}
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
          {/* Header Section with Image and Basic Info */}
          <Group align="center" justify="center" gap="xl" wrap="nowrap" style={{ paddingBottom: '1rem' }}>
            <Image
              src={song.imageUrl || (song.imageName ? `${BASE_JACKET_URL}${song.imageName}` : null)}
              alt={song.title}
              radius="md"
              w={{ base: 160, xs: 200, sm: 240 }}
              h={{ base: 160, xs: 200, sm: 240 }}
              fallbackSrc="https://placehold.co/240x240?text=No+Image"
              style={{ boxShadow: 'var(--mantine-shadow-md)' }}
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
                  <Text size="md" lineClamp={1} title={CATEGORY_TRANSLATION[song.category] || song.category}>
                    {CATEGORY_TRANSLATION[song.category] || song.category}
                  </Text>
                </Stack>

                <Stack gap={2}>
                  <Text size="sm" c="secondary" fw={700} tt="uppercase">Version</Text>
                  <Text size="md" lineClamp={1} title={VERSION_MAPPING[song.version] || song.version}>
                    {VERSION_MAPPING[song.version] || song.version}
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
                <Button
                  variant="light"
                  color="teal"
                  leftSection={<IconPlaylistAdd size={18} />}
                  onClick={() => setAddToPlaylistOpened(true)}
                  fullWidth
                >
                  Add to Playlist
                </Button>
              </Stack>
            </Stack>
          </Group>

          {/* Charts Table */}
          <ScrollArea>
            <Table highlightOnHover horizontalSpacing="xs" verticalSpacing={4}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Difficulty</Table.Th>
                  <Table.Th>Constant</Table.Th>
                  <Table.Th>Notes Designer</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </ScrollArea>
        </Stack>
      </Box>

      <AddToPlaylistModal
        opened={addToPlaylistOpened}
        onClose={() => setAddToPlaylistOpened(false)}
        songData={song}
        onSuccess={() => {
          setAddToPlaylistOpened(false);
          onClose();
        }}
      />
    </Modal>
  );
}

export default SongDetailModal;
