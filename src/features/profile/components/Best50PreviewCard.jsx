import { Paper, Stack, Group, Title, Text, Badge, Button, SimpleGrid, Alert, Box } from '@mantine/core';
import IconTrophy from '@tabler/icons-react/dist/esm/icons/IconTrophy.mjs';
import IconChevronRight from '@tabler/icons-react/dist/esm/icons/IconChevronRight.mjs';
import IconAlertCircle from '@tabler/icons-react/dist/esm/icons/IconAlertCircle.mjs';
import IconUpload from '@tabler/icons-react/dist/esm/icons/IconUpload.mjs';
import IconCamera from '@tabler/icons-react/dist/esm/icons/IconCamera.mjs';
import { Link } from 'react-router-dom';
import { CompactScoreCard } from './CompactScoreCard';
import { NEW_VERSIONS } from '../../../config/maimai-constants';

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
    <Paper p="lg" radius="md" className="profile-surface">
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
          <Text size="sm">Data out of date — please reimport.</Text>
        </Alert>
      )}

      {/* Header row: title + play counts */}
      <Group justify="space-between" mb="md" align="center" wrap="nowrap">
        <Group gap="xs" wrap="nowrap">
          <IconTrophy size={22} style={{ color: 'var(--theme-accent)', flexShrink: 0 }} />
          <Title order={2}>Best 50</Title>
        </Group>

        {/* Play count badges */}
        {scores.total_play_count && (privacy.show_play_count !== false || isOwner) && (
          <Stack gap={2} align="flex-end">
            <Badge variant="dot" color="pink" size="sm">
              {scores.current_version_play_count || 0} plays
            </Badge>
            <Badge variant="dot" color="cyan" size="sm">
              {scores.total_play_count} total
            </Badge>
          </Stack>
        )}
      </Group>

      {/* Top 3 Current Grid */}
      {bestNewScores.length > 0 && (
        <Box mb="xs">
          <Text size="9px" fw={800} c="dimmed" tt="uppercase" mb={4} style={{ letterSpacing: 0.5 }}>
            {NEW_VERSIONS.join(' + ')}
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
        variant="default"
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
            size="sm"
            color="teal"
            leftSection={<IconCamera size={14} />}
            onClick={() => window.open('/profile/export', '_blank')}
          >
            Export Image
          </Button>
          <Button
            variant="subtle"
            size="sm"
            leftSection={<IconUpload size={14} />}
            onClick={onImportClick}
          >
            Import
          </Button>
        </Group>
      )}
    </Paper>
  );
}
