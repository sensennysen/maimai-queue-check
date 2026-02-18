import { Modal, Image, Text, Group, Stack, Badge, Table, ScrollArea, ThemeIcon } from '@mantine/core';
import { IconMusic, IconMicrophone, IconDisc, IconChartBar } from '@tabler/icons-react';
import { DIFFICULTY_COLORS, VERSION_MAPPING, CATEGORY_TRANSLATION } from '../../../config/maimai-constants';

const DIFFICULTY_ORDER = ['Basic', 'Advanced', 'Expert', 'Master', 'Re:Master'];

function SongDetailModal({ song, opened, onClose }) {
  if (!song) return null;

  const typeImage = song.cardType === 'dx'
    ? new URL('../../../assets/music_dx.png', import.meta.url).href
    : new URL('../../../assets/music_standard.png', import.meta.url).href;

  // Sort sheets
  const sortedSheets = [...(song.sheets || [])].sort((a, b) => {
    const normalizeDiffForSort = (d) => {
      const map = { 'basic': 'Basic', 'advanced': 'Advanced', 'expert': 'Expert', 'master': 'Master', 'remaster': 'Re:Master' };
      return map[d.toLowerCase()] || d;
    };
    const diffA = DIFFICULTY_ORDER.indexOf(normalizeDiffForSort(a.difficulty));
    const diffB = DIFFICULTY_ORDER.indexOf(normalizeDiffForSort(b.difficulty));
    return diffA - diffB;
  });

  const rows = sortedSheets.map((sheet) => {
    const normalizeDiff = (d) => {
      const map = { 'basic': 'Basic', 'advanced': 'Advanced', 'expert': 'Expert', 'master': 'Master', 'remaster': 'Re:Master' };
      return map[d.toLowerCase()] || d;
    };
    const difficultyKey = normalizeDiff(sheet.difficulty);
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
          marginBottom: '1rem',
          borderBottom: '1px solid var(--mantine-color-default-border)'
        }
      }}
    >
      <Stack gap="lg">
        {/* Header Section with Image and Basic Info */}
        <Group align="flex-start" wrap="nowrap">
          <Image
            src={song.imageUrl}
            alt={song.title}
            radius="md"
            w={120}
            h={120}
            fallbackSrc="https://placehold.co/120x120?text=No+Image"
          />
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text size="xl" fw={700} style={{ fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>
              {song.title}
            </Text>

            <Group gap="xs">
              <Text size="sm" c="dimmed" fw={700}>Artist:</Text>
              <Text size="sm" c="dimmed">{song.artist}</Text>
            </Group>

            <Group gap="xs">
              <Text size="sm" c="dimmed" fw={700}>Category:</Text>
              <Text size="sm" c="dimmed">{CATEGORY_TRANSLATION[song.category] || song.category}</Text>
            </Group>

            <Group gap="xs">
              <Text size="sm" c="dimmed" fw={700}>Version:</Text>
              <Text size="sm" c="dimmed">{VERSION_MAPPING[song.version] || song.version}</Text>
            </Group>

            <Group gap="xs">
              <Text size="sm" c="dimmed" fw={700}>Type:</Text>
              <img src={typeImage} alt={song.cardType} style={{ height: 20 }} />
            </Group>

            {song.bpm && (
              <Group gap="xs">
                <Text size="sm" c="dimmed" fw={700}>BPM:</Text>
                <Text size="sm" c="dimmed">{song.bpm}</Text>
              </Group>
            )}
          </Stack>
        </Group>

        {/* Charts Table */}
        <ScrollArea>
          <Table highlightOnHover horizontalSpacing="md" verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Difficulty</Table.Th>
                <Table.Th>Constant</Table.Th>
                <Table.Th>Designer</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </ScrollArea>
      </Stack>
    </Modal>
  );
}

export default SongDetailModal;
