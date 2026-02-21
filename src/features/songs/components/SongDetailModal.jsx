import { Modal, Image, Text, Group, Stack, Badge, Table, ScrollArea, Tooltip, SimpleGrid } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck } from '@tabler/icons-react';
import { DIFFICULTY_COLORS, VERSION_MAPPING, CATEGORY_TRANSLATION, normalizeDifficulty } from '../../../config/maimai-constants';

const DIFFICULTY_ORDER = ['Basic', 'Advanced', 'Expert', 'Master', 'Re:Master'];

function SongDetailModal({ song, opened, onClose }) {
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
      title={<Text fw={700} style={{ fontFamily: 'var(--font-heading)' }}>Song Details</Text>}
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
              <Text size="xs" c="secondary" fw={700} tt="uppercase">Artist</Text>
              <Text size="sm" lineClamp={2} title={song.artist}>{song.artist}</Text>
            </Stack>

            <SimpleGrid cols={2} spacing="sm" verticalSpacing="sm" mt="xs">
              <Stack gap={2}>
                <Text size="xs" c="secondary" fw={700} tt="uppercase">Category</Text>
                <Text size="sm" lineClamp={1} title={CATEGORY_TRANSLATION[song.category] || song.category}>
                  {CATEGORY_TRANSLATION[song.category] || song.category}
                </Text>
              </Stack>

              <Stack gap={2}>
                <Text size="xs" c="secondary" fw={700} tt="uppercase">Version</Text>
                <Text size="sm" lineClamp={1} title={VERSION_MAPPING[song.version] || song.version}>
                  {VERSION_MAPPING[song.version] || song.version}
                </Text>
              </Stack>

              <Stack gap={2}>
                <Text size="xs" c="secondary" fw={700} tt="uppercase">Type</Text>
                <img src={typeImage} alt={song.cardType} style={{ height: 20, maxWidth: '100%', objectFit: 'contain', alignSelf: 'flex-start' }} />
              </Stack>

              {song.bpm && (
                <Stack gap={2}>
                  <Text size="xs" c="secondary" fw={700} tt="uppercase">BPM</Text>
                  <Text size="sm">{song.bpm}</Text>
                </Stack>
              )}
            </SimpleGrid>

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
    </Modal >
  );
}

export default SongDetailModal;
