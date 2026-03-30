import { Paper, Alert, Group, Stack, Title, Badge, Button, SimpleGrid, Text, Box } from '@mantine/core';
import IconAlertCircle from '@tabler/icons-react/dist/esm/icons/IconAlertCircle.mjs';
import IconTrophy from '@tabler/icons-react/dist/esm/icons/IconTrophy.mjs';
import IconUpload from '@tabler/icons-react/dist/esm/icons/IconUpload.mjs';
import IconCamera from '@tabler/icons-react/dist/esm/icons/IconCamera.mjs';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import { useState } from 'react';
import DeleteConfirmDialog from '../../../components/modals/DeleteConfirmDialog';
import { ScoreCard } from '../../../components/maimai/ScoreCard';
import { NEW_VERSIONS } from '../../../config/maimai-constants';

/**
 * Best50Section component
 */
export function Best50Section({
  profile,
  privacy,
  isOwner,
  isMalformedBest50,
  onImportClick,
  onScoreClick,
  onClearData
}) {
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const scores = profile?.maimai_best_scores;
  if (!scores) return null;

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder className="animate-fade-in delay-450">
      {isOwner && isMalformedBest50 && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" mb="md" title="Action Required">
          Data and Bookmark is out of date. Please create a new bookmark from the Import message and reimport
        </Alert>
      )}

      <Group justify="space-between" mb="xs" wrap="wrap">
        <Stack gap={0}>
          <Group gap="xs">
            <IconTrophy size={24} style={{ color: 'var(--mantine-color-yellow-6)' }} />
            <Title order={2}>Best 50</Title>
            {isOwner && privacy.show_play_count === false && (
              <Badge variant="subtle" color="gray" size="sm">Hidden to public</Badge>
            )}
          </Group>
          {scores.total_play_count && (privacy.show_play_count !== false || isOwner) && (
            <Group gap="xs" mt={4}>
              <Badge variant="subtle" color="pink" size="lg">
                Version: {scores.current_version_play_count || 0} plays
              </Badge>
              <Badge variant="subtle" color="cyan" size="lg">
                Total: {scores.total_play_count} plays
              </Badge>
            </Group>
          )}
        </Stack>
      </Group>

      {isOwner && (
        <Group justify="space-between" wrap="wrap" gap="xs">
          <Text
            size="xs"
            fw={700}
            tt="uppercase"
            c="dimmed"
            style={{ letterSpacing: '0.05em', fontFamily: 'var(--font-heading)' }}
          >

          </Text>
          <Group gap="xs">
            <Button
              leftSection={<IconTrash size={18} />}
              variant="subtle"
              color="primary"
              size="sm"
              onClick={() => setIsClearModalOpen(true)}
              px={{ base: 'xs', sm: 'md' }}
            >
              <Box component="span" visibleFrom="sm">Clear Scores</Box>
            </Button>
            <Button
              leftSection={<IconCamera size={18} />}
              variant="outline"
              color="teal"
              size="sm"
              onClick={() => window.open('/profile/export', '_blank')}
              px={{ base: 'xs', sm: 'md' }}
            >
              <Box component="span" visibleFrom="sm">Export Image</Box>
            </Button>
            <Button
              leftSection={<IconUpload size={18} />}
              variant="outline"
              size="sm"
              onClick={onImportClick}
              px={{ base: 'xs', sm: 'md' }}
            >
              <Box component="span" visibleFrom="sm">Import Scores</Box>
            </Button>
          </Group>
        </Group>
      )}

      <DeleteConfirmDialog
        opened={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={async () => {
          setIsClearing(true);
          try {
            await onClearData();
            setIsClearModalOpen(false);
          } finally {
            setIsClearing(false);
          }
        }}
        title="Reset Maimai Data"
        message={
          <Stack gap="xs">
            <Text size="sm">This will permanently delete:</Text>
            <Box component="ul" style={{ margin: 0, paddingLeft: 20 }}>
              <li><Text size="sm">Your Best 50 scores and rating</Text></li>
              <li><Text size="sm">Recent play history</Text></li>
              <li><Text size="sm">Most played songs data</Text></li>
              <li><Text size="sm">Maimai DX name and avatar association</Text></li>
            </Box>
            <Text size="sm" fw={700} c="red" mt="xs">This action cannot be undone.</Text>
          </Stack>
        }
        loading={isClearing}
        confirmLabel="Reset Everything"
      />

      <Stack gap="xl">
        {/* Best New */}
        <Stack gap="md">
          <Badge size="xl" variant="light" color="primary">Best 15 ({NEW_VERSIONS.join(' + ')})</Badge>
          <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} gutter="md">
            {scores.best_new?.songs?.map((score, index) => (
              <ScoreCard
                key={`new-${index}`}
                score={score}
                onClick={() => (isOwner || privacy.show_best_50_details !== false) && onScoreClick(score)}
                isSmall
              />
            ))}
          </SimpleGrid>
        </Stack>

        {/* Best Old */}
        <Stack gap="md">
          <Badge size="xl" variant="light" color="secondary">Best 35 (Past Versions)</Badge>
          <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} gutter="md">
            {scores.best_old?.songs?.map((score, index) => (
              <ScoreCard
                key={`old-${index}`}
                score={score}
                onClick={() => (isOwner || privacy.show_best_50_details !== false) && onScoreClick(score)}
                isSmall
              />
            ))}
          </SimpleGrid>
        </Stack>
      </Stack>
    </Paper>
  );
}
