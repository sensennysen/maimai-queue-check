import { memo } from 'react';
import {
  Group, Title, Box, Text, Image,
  Divider, Table, Stack, Flex
} from '@mantine/core';
import { DIFFICULTY_COLORS, normalizeDifficulty, BASE_JACKET_URL } from '../../config/maimai-constants';

import { getGrade } from '../../utils/maimai-calc';

/* ─────────────────────────── Details Content ─────────────────────────── */
export const RecentPlayDetails = memo(({ play, isMobile, songMap }) => {
  const diffLabel = normalizeDifficulty(play.difficulty);
  const diffColor = DIFFICULTY_COLORS[diffLabel] || 'gray';
  const jacketUrl = songMap?.get(play.title) || play.jacket_url;
  const grade = getGrade(play.achievement);

  return (
    <Stack gap="md">
      <Group align="flex-start" wrap="nowrap" style={{ marginTop: '1rem' }}>
        <Box
          style={{
            width: 80,
            height: 80,
            borderRadius: 12,
            overflow: 'hidden',
            flexShrink: 0,
            background: 'var(--theme-surface)',
            position: 'relative',
            border: `2px solid ${diffColor}`
          }}
        >
          <Image
            src={jacketUrl || (play.imageName ? `${BASE_JACKET_URL}${play.imageName}` : null)}
            alt={play.title}
            fit="cover"
            fallbackSrc="https://placehold.co/80x80?text=?"
          />
        </Box>
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Title order={3} size="h4" lineClamp={2} style={{ fontFamily: 'var(--font-heading)' }}>
            {play.title}
          </Title>
          <Group gap={8}>
            <Box
              style={{
                background: diffColor,
                color: 'white',
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: '10px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {diffLabel} {play.level}
            </Box>
          </Group>
          <Group gap={4} align="baseline">
            <Text fw={900} size="xl" style={{ color: 'var(--theme-secondary)' }}>
              {parseFloat(play.achievement).toFixed(4)}%
            </Text>
            <Text fw={800} size="sm" c="blue">{grade}</Text>
          </Group>
        </Stack>
      </Group>

      <Divider variant="dashed" />

      <Flex
        direction={isMobile ? 'column' : 'row'}
        gap={isMobile ? 'xl' : 40}
        align={isMobile ? 'stretch' : 'flex-start'}
      >
        {/* Left: Stats */}
        <Stack gap={8} style={{ minWidth: isMobile ? '100%' : 200 }}>
          <Text size="sm" fw={800} style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Performance</Text>
          {[
            ['DX Score', `${play.dx_score} / ${play.dx_score_total}`],
            ['Rating', `${play.rating}${play.rating_delta > 0 ? ` (+${play.rating_delta})` : ''}`],
            ['Combo', `${play.max_combo || 0} / ${play.max_combo_total || 0}`],
            ['Sync', `${play.max_sync || 0} / ${play.max_sync_total || 0}`],
            ['Fast / Late', `${play.fast_count} / ${play.late_count}`],
          ].map(([label, value]) => (
            <Group key={label} justify="space-between">
              <Text size="sm" fw={600} c="dimmed">{label}</Text>
              <Text size="sm" fw={700}>{value}</Text>
            </Group>
          ))}
        </Stack>

        {/* Right: Notes Breakdown */}
        <Box style={{ flex: 1, width: '100%', overflowX: 'auto' }}>
          <Text size="sm" fw={800} mb={10} style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Notes Breakdown
          </Text>
          <Table
            size="sm"
            verticalSpacing={6}
            horizontalSpacing={8}
            style={{ whiteSpace: 'nowrap', minWidth: isMobile ? 380 : 'auto' }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={70}>Type</Table.Th>
                <Table.Th style={{ color: 'var(--mantine-color-orange-7)' }}>CPf</Table.Th>
                <Table.Th style={{ color: 'var(--mantine-color-yellow-7)' }}>Pf</Table.Th>
                <Table.Th style={{ color: 'var(--mantine-color-green-7)' }}>Gr</Table.Th>
                <Table.Th style={{ color: 'var(--mantine-color-blue-7)' }}>Gd</Table.Th>
                <Table.Th style={{ color: 'var(--mantine-color-red-7)' }}>Ms</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {['tap', 'hold', 'slide', 'touch', 'break'].map(type => {
                const n = play.notes?.[type] || {};
                const hasData = n.critical_perfect || n.perfect || n.great || n.good || n.miss || n.total;
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
    </Stack>
  );
});

RecentPlayDetails.displayName = 'RecentPlayDetails';
