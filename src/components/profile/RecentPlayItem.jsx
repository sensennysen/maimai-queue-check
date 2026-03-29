import { memo } from 'react';
import {
  Paper, Stack, Group, Text, Badge,
  Table, Box, Divider, Collapse, ActionIcon, Avatar, Flex
} from '@mantine/core';
import {
  IconChevronDown, IconChevronUp
} from '@tabler/icons-react';
import { DIFFICULTY_COLORS, normalizeDifficulty } from '../../config/maimai-constants';
import { getRelativeTime } from '../../utils/formatters';
import { getGrade } from '../../utils/maimai-calc';

export const RecentPlayItem = memo(({ play, isOpened, onToggle, index, isMobile, isTablet, songMap }) => {
  const diffLabel = normalizeDifficulty(play.difficulty);
  const diffColor = DIFFICULTY_COLORS[diffLabel] || 'gray';

  // Use image from our storage if available
  const jacketUrl = songMap?.get(play.title) || play.jacket_url;
  const grade = getGrade(play.achievement);

  return (
    <Paper
      withBorder
      radius="md"
      p="sm"
      style={{ backgroundColor: 'var(--mantine-color-body)' }}
    >
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap" align={isMobile ? "flex-start" : "center"}>
          <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }} align={isMobile ? "flex-start" : "center"}>
            {jacketUrl && (
              <Avatar src={jacketUrl} size="xl" radius="md" />
            )}
            <Box
              w={4}
              style={{
                alignSelf: 'stretch',
                backgroundColor: diffColor,
                borderRadius: 2
              }}
            />
            <Stack gap={isMobile ? 'xs' : 0} style={{ minWidth: 0, flex: 1 }}>
              <Stack gap={0}>
                <Text fw={700} size="lg" truncate="end" title={play.title}>
                  {play.title}
                </Text>
                <Group gap={6}>
                  {play.track_number && (
                    <Badge size="md" variant="light" color="gray">{play.track_number}</Badge>
                  )}
                  <Badge size="md" color={diffColor} variant="filled">{diffLabel} {play.level}</Badge>
                  <Text size="md" c="dimmed">{getRelativeTime(play.played_at)}</Text>
                </Group>
              </Stack>

              {isMobile && (
                <Group gap="xs" align="baseline">
                  <Text fw={900} size="xl" style={{ lineHeight: 1, fontSize: '1.5rem' }}>
                    {parseFloat(play.achievement).toFixed(4)}%
                  </Text>
                  <Text fw={800} size="sm" c="blue" style={{ letterSpacing: '0.5px' }}>
                    {grade}
                  </Text>
                </Group>
              )}
            </Stack>
          </Group>

          <Group gap="md" wrap="nowrap" align="center">
            {!isMobile && (
              <Group gap="xs" align="baseline">
                <Text fw={900} size="xl" style={{ lineHeight: 1, fontSize: '1.5rem' }}>
                  {parseFloat(play.achievement).toFixed(4)}%
                </Text>
                <Text fw={800} size="sm" c="blue" style={{ letterSpacing: '0.5px' }}>
                  {grade}
                </Text>
              </Group>
            )}
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => onToggle(index)}
            >
              {isOpened ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
            </ActionIcon>
          </Group>
        </Group>

        <Collapse in={isOpened} transitionDuration={isMobile ? 0 : 200}>
          <Box pt="sm" px="md">
            <Divider mb="sm" variant="dashed" />
            <Flex
              direction={isMobile ? 'column' : 'row'}
              gap={isMobile ? 'md' : (isTablet ? 32 : 64)}
              align="center"
            >
              {/* Left & Middle: Stats */}
              <Stack gap="xs" style={{ minWidth: isMobile ? '100%' : 200 }}>
                <Group justify="space-between">
                  <Text size="sm" fw={600} c="dimmed">DX Score</Text>
                  <Text size="sm" fw={700}>{play.dx_score} / {play.dx_score_total}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" fw={600} c="dimmed">Rating</Text>
                  <Group gap={4}>
                    <Text size="sm" fw={700} c="blue">{play.rating}</Text>
                    {play.rating_delta > 0 && (
                      <Text size="sm" fw={700} c="green">+{play.rating_delta}</Text>
                    )}
                  </Group>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" fw={600} c="dimmed">Combo</Text>
                  <Text size="sm" fw={700}>{play.max_combo || 0} / {play.max_combo_total || 0}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" fw={600} c="dimmed">Sync</Text>
                  <Text size="sm" fw={700}>{play.max_sync || 0} / {play.max_sync_total || 0}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" fw={600} c="dimmed">Fast / Late</Text>
                  <Group gap={4}>
                    <Text size="sm" fw={700} c="orange">{play.fast_count}</Text>
                    <Divider orientation="vertical" />
                    <Text size="sm" fw={700} c="blue">{play.late_count}</Text>
                  </Group>
                </Group>
              </Stack>

              {/* Right: Notes Breakdown */}
              <Box style={{ flex: 1, width: '100%', overflowX: 'auto' }}>
                <Text size="sm" fw={700} mb={8} ta={isMobile ? 'center' : 'left'}>Notes Breakdown</Text>
                <Table
                  size="sm"
                  verticalSpacing={4}
                  horizontalSpacing={4}
                  style={{
                    whiteSpace: 'nowrap',
                    tableLayout: 'fixed',
                    minWidth: isMobile ? 400 : 'auto'
                  }}
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w={60}>Type</Table.Th>
                      <Table.Th style={{ color: 'var(--mantine-color-orange-7)', fontSize: '10px' }}>Critical Perfect</Table.Th>
                      <Table.Th style={{ color: 'var(--mantine-color-yellow-7)', fontSize: '10px' }}>Perfect</Table.Th>
                      <Table.Th style={{ color: 'var(--mantine-color-green-7)', fontSize: '10px' }}>Great</Table.Th>
                      <Table.Th style={{ color: 'var(--mantine-color-blue-7)', fontSize: '10px' }}>Good</Table.Th>
                      <Table.Th style={{ color: 'var(--mantine-color-red-7)', fontSize: '10px' }}>Miss</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {['tap', 'hold', 'slide', 'touch', 'break'].map(type => {
                      const n = play.notes?.[type] || {};
                      const hasData = (n.critical_perfect || n.perfect || n.great || n.good || n.miss || n.total);
                      if (!hasData && type !== 'break') return null;

                      return (
                        <Table.Tr key={type}>
                          <Table.Td fw={700} style={{ textTransform: 'capitalize' }}>{type}</Table.Td>
                          <Table.Td fw={700}>{n.critical_perfect || n.cp || 0}</Table.Td>
                          <Table.Td fw={700}>{n.perfect || n.p || 0}</Table.Td>
                          <Table.Td>{n.great || n.gr || 0}</Table.Td>
                          <Table.Td>{n.good || n.gd || 0}</Table.Td>
                          <Table.Td fw={700} c="red.7">{n.miss || 0}</Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Box>
            </Flex>
          </Box>
        </Collapse>
      </Stack>
    </Paper>
  );
});

RecentPlayItem.displayName = 'RecentPlayItem';
