import { useEffect, useState } from 'react';
import { Badge, Box, Group, Paper, Stack, Text, Title } from '@mantine/core';
import IconChevronDown from '@tabler/icons-react/dist/esm/icons/IconChevronDown.mjs';
import IconWorld from '@tabler/icons-react/dist/esm/icons/IconWorld.mjs';
import { DIFFICULTY_COLORS, normalizeDifficulty } from '../../../config/maimai-constants';

const REGION_LABELS = {
  jp: 'JP',
  intl: 'INTL',
  usa: 'USA',
  cn: 'CN',
};

function formatReleaseDate(value) {
  if (!value) return 'Unknown';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function SongOverview({ song }) {
  const [expandedCharts, setExpandedCharts] = useState(() => new Set());
  const regions = song.sheets?.[0]?.regions;

  useEffect(() => {
    setExpandedCharts(new Set());
  }, [song.cardId]);

  const toggleChart = (chartKey) => {
    setExpandedCharts((current) => {
      const next = new Set(current);
      if (next.has(chartKey)) next.delete(chartKey);
      else next.add(chartKey);
      return next;
    });
  };

  return (
    <Stack gap="lg" className="song-overview">
      <section aria-labelledby="song-release-info-heading">
        <Text id="song-release-info-heading" className="song-overview__eyebrow">
          Release info
        </Text>
        <Paper withBorder radius="md" className="song-release-info">
          <Box className="song-release-info__field">
            <Text className="song-release-info__label">Released</Text>
            <Text fw={600}>{formatReleaseDate(song.releaseDate)}</Text>
          </Box>

          <Box className="song-release-info__field">
            <Text className="song-release-info__label">Available in</Text>
            <Group gap="xs">
              {regions ? Object.entries(regions).map(([code, available]) => (
                <Badge
                  key={code}
                  variant="light"
                  color={available ? 'blue' : 'gray'}
                  leftSection={<IconWorld size={11} aria-hidden="true" />}
                  className={available ? 'song-region-pill' : 'song-region-pill song-region-pill--unavailable'}
                  aria-label={`${REGION_LABELS[code] || code.toUpperCase()} ${available ? 'available' : 'not available'}`}
                >
                  {REGION_LABELS[code] || code.toUpperCase()}
                </Badge>
              )) : (
                <Text size="sm" c="dimmed">Unknown</Text>
              )}
            </Group>
          </Box>
        </Paper>
      </section>

      <section aria-labelledby="song-chart-details-heading">
        <Title order={3} id="song-chart-details-heading" className="song-overview__heading">
          Chart details
        </Title>

        {song.sheets?.length ? (
          <Stack gap="xs" mt="sm">
            {song.sheets.map((sheet, index) => {
              const difficulty = normalizeDifficulty(sheet.difficulty) || 'Chart';
              const difficultyColor = DIFFICULTY_COLORS[difficulty] || 'var(--theme-primary)';
              const chartKey = `${sheet.type || song.cardType}-${sheet.difficulty}-${index}`;
              const isExpanded = expandedCharts.has(chartKey);
              const constantLevel = sheet.internalLevel ?? sheet.internalLevelValue;
              const showsConstant = ['Expert', 'Master', 'Re:Master'].includes(difficulty)
                && constantLevel !== null
                && constantLevel !== undefined
                && constantLevel !== '';
              const designer = sheet.noteDesigner && sheet.noteDesigner !== '-' ? sheet.noteDesigner : '—';
              const totalNotes = sheet.noteCounts?.total ?? '—';

              return (
                <Paper
                  key={chartKey}
                  withBorder
                  radius="md"
                  className="song-chart-row"
                  style={{ '--song-difficulty-color': difficultyColor }}
                >
                  <button
                    type="button"
                    className="song-chart-row__button"
                    onClick={() => toggleChart(chartKey)}
                    aria-expanded={isExpanded}
                    aria-controls={`${chartKey}-breakdown`}
                  >
                    <Box className="song-chart-row__tier">
                      <Text className="song-chart-row__difficulty">{difficulty}</Text>
                      <Text className="song-chart-row__level">{sheet.level || '—'}</Text>
                      {showsConstant && (
                        <Text className="song-chart-row__constant">
                          Constant {constantLevel}
                        </Text>
                      )}
                    </Box>

                    <Box className="song-chart-row__designer">
                      <Text className="song-chart-row__meta-label">Designer</Text>
                      <Text size="sm" fw={500} lineClamp={1} title={designer}>{designer}</Text>
                    </Box>

                    <Box className="song-chart-row__notes">
                      <Text className="song-chart-row__meta-label">Notes</Text>
                      <Text size="sm" fw={700}>{totalNotes}</Text>
                    </Box>

                    <IconChevronDown
                      size={18}
                      aria-hidden="true"
                      className="song-chart-row__chevron"
                      data-expanded={isExpanded}
                    />
                  </button>

                  {isExpanded && (
                    <div id={`${chartKey}-breakdown`} className="song-chart-row__breakdown">
                      {[
                        ['Tap', sheet.noteCounts?.tap],
                        ['Hold', sheet.noteCounts?.hold],
                        ['Slide', sheet.noteCounts?.slide],
                        ['Touch', sheet.noteCounts?.touch],
                        ['Break', sheet.noteCounts?.break],
                      ].map(([label, value]) => (
                        <Box key={label} className="song-note-count">
                          <Text className="song-chart-row__meta-label">{label}</Text>
                          <Text fw={700}>{value ?? '—'}</Text>
                        </Box>
                      ))}
                    </div>
                  )}
                </Paper>
              );
            })}
          </Stack>
        ) : (
          <Paper withBorder radius="md" p="lg">
            <Text c="dimmed" ta="center">No chart details are available.</Text>
          </Paper>
        )}
      </section>
    </Stack>
  );
}

export default SongOverview;
