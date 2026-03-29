import { Paper, Stack, Group, Title, Text, Badge, Button, SimpleGrid, Alert, Box } from '@mantine/core';
import { IconTrophy, IconChevronRight, IconAlertCircle, IconUpload, IconCamera } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { CompactScoreCard } from './CompactScoreCard';

/**
 * Compact Best 50 preview card for the profile sidebar.
 * Shows rating, play counts, top 6 scores, and a "View All" CTA.
 */
export function Best50PreviewCard({
  profile,
  privacy,
  isOwner,
  isMalformedBest50,
  onImportClick,
  onScoreClick,
  slug,
}) {
  const scores = profile?.maimai_best_scores;
  if (!scores) return null;

  const bestNewScores = scores.best_new?.songs?.slice(0, 3) || [];
  const bestOldScores = scores.best_old?.songs?.slice(0, 3) || [];
  const canSeeDetails = isOwner || privacy.show_best_50_details !== false;

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      {isOwner && isMalformedBest50 && (
        <Alert
          icon={<IconAlertCircle size={14} />}
          color="red"
          variant="light"
          mb="sm"
          p="xs"
          title="Action Required"
          styles={{ title: { fontSize: '0.75rem' } }}
        >
          <Text size="xs">Data out of date — please reimport.</Text>
        </Alert>
      )}

      {/* Header row: title + play counts */}
      <Group justify="space-between" mb="xs" wrap="nowrap" align="flex-start">
        <Group gap={6} wrap="nowrap">
          <IconTrophy size={18} style={{ color: 'var(--mantine-color-yellow-6)', flexShrink: 0 }} />
          <Title order={4} style={{ lineHeight: 1 }}>Best 50</Title>
        </Group>
        
        {/* Play count badges */}
        {scores.total_play_count && (privacy.show_play_count !== false || isOwner) && (
          <Stack gap={2} align="flex-end">
            <Badge variant="dot" color="pink" size="xs">
              {scores.current_version_play_count || 0} plays
            </Badge>
            <Badge variant="dot" color="cyan" size="xs">
              {scores.total_play_count} total
            </Badge>
          </Stack>
        )}
      </Group>

      {/* Top 3 Current Grid */}
      {bestNewScores.length > 0 && (
        <Box mb="xs">
          <Text size="9px" fw={800} c="dimmed" tt="uppercase" mb={4} style={{ letterSpacing: 0.5 }}>
            Current Version
          </Text>
          <SimpleGrid cols={3} spacing={6}>
            {bestNewScores.map((score, i) => (
              <CompactScoreCard
                key={`best-new-${i}`}
                score={score}
                onClick={() => canSeeDetails && onScoreClick(score)}
              />
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* Top 3 Past Grid */}
      {bestOldScores.length > 0 && (
        <Box mb="sm">
          <Text size="9px" fw={800} c="dimmed" tt="uppercase" mb={4} style={{ letterSpacing: 0.5 }}>
            Past Versions
          </Text>
          <SimpleGrid cols={3} spacing={6}>
            {bestOldScores.map((score, i) => (
              <CompactScoreCard
                key={`best-old-${i}`}
                score={score}
                onClick={() => canSeeDetails && onScoreClick(score)}
              />
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* CTA */}
      <Button
        component={Link}
        to={`/p/${slug}/best50`}
        variant="light"
        color="primary"
        fullWidth
        size="sm"
        rightSection={<IconChevronRight size={14} />}
        mb={isOwner ? 6 : 0}
      >
        View All 50 Scores
      </Button>

      {isOwner && (
        <Group gap={4} grow>
          <Button
            variant="subtle"
            size="xs"
            color="teal"
            leftSection={<IconCamera size={13} />}
            onClick={() => window.open('/profile/export', '_blank')}
          >
            Export Image
          </Button>
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconUpload size={13} />}
            onClick={onImportClick}
          >
            Import
          </Button>
        </Group>
      )}
    </Paper>
  );
}
