import { memo } from 'react';
import { Paper, Title, Group, Button, Stack, Text, Center } from '@mantine/core';
import IconPlayerPlay from '@tabler/icons-react/dist/esm/icons/IconPlayerPlay.mjs';
import IconLock from '@tabler/icons-react/dist/esm/icons/IconLock.mjs';
import QueueItem from './QueueItem';
import { useAuth } from '../../../hooks/useAuth';
import { usePermissions } from '../../../hooks/usePermissions';
import './QueueList.css';

/**
 * Component for displaying the full list of waiting queue entries.
 * Orchestrates reordering, deletion, and game session initiation.
 * @param {Object} props - Component props.
 * @returns {JSX.Element} The rendered queue list.
 */
const QueueList = memo(function QueueList({ queue, nowPlaying, onEdit, onRemove, onMoveUp, onMoveDown, onStartGame, isMallOpen, isBusy = false, loadingRoles = false, cabinetNum = null, hasMultipleCabinets = false, addedIds = null, movedIds = null, removingId = null }) {
  const { user, userRoles } = useAuth();

  const { canActuallyEdit, canEdit } = usePermissions();

  // Determine header title based on cabinet
  const queueTitle = hasMultipleCabinets && cabinetNum ? `Current Queue - Cabinet ${cabinetNum}` : 'Current Queue';

  return (
    <Paper withBorder className="queue-list">
      <Group justify="space-between" className="queue-list-header">
        <div className="queue-list-heading">
          <Title order={3}>{queueTitle}</Title>
        </div>
        {!user && (
          <span className="sign-in-message">
            <span className="sign-in-desktop">
              <Text size="sm" c="blue" style={{ marginLeft: 16, marginBottom: 0 }}>
                <IconLock size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Sign in above and receive permission to edit the queue
              </Text>
            </span>
            <span className="sign-in-mobile">
              <IconLock size={20} color="#228be6" style={{ marginLeft: 16, marginBottom: 0, verticalAlign: 'middle' }} />
            </span>
          </span>
        )}
        {user && canEdit && isMallOpen && !nowPlaying && queue.length > 0 && (
          <Button
            leftSection={<IconPlayerPlay size={16} />}
            onClick={() => onStartGame()}
            variant="filled"
            style={{ backgroundColor: 'var(--theme-success)', color: 'white' }}
            disabled={isBusy}
          >
            Start Game
          </Button>
        )}
      </Group>
      {user && userRoles !== undefined && !userRoles?.can_edit && !userRoles?.is_admin && !userRoles?.is_super_admin && (
        <Group p="md" style={{
          borderBottom: '1px solid var(--theme-border)',
          backgroundColor: 'color-mix(in srgb, var(--theme-warning), transparent 90%)'
        }}>
          <Text size="sm" style={{ color: 'var(--theme-warning)' }}>
            You can view the queue but don't have permission to edit it
          </Text>
        </Group>
      )}
      {queue.length === 0 ? (
        <Center p="xl" className="empty-queue">
          <Stack align="center" gap="xs">
            <Text size="lg" fw={700}>No one in the queue yet</Text>
            {user && (
              <Text c="secondary" size="sm">Use Add Queue to add one</Text>
            )}
          </Stack>
        </Center>
      ) : (
        <>
          <div className="queue-header-row queue-header-row--desktop" aria-hidden="true">
            <span className="col-order">Position</span>
            <span>Player 1</span>
            <span>Player 2</span>
            <span className="col-actions">Actions</span>
          </div>
          <div className="queue-header-row queue-header-row--mobile" aria-hidden="true">
            <span>Queue entry</span>
            <span className="col-actions">Actions</span>
          </div>
          <Stack gap={0} className="queue-items" role="list" aria-label={queueTitle}>
            {queue.map((item, index) => (
              <QueueItem
                key={item.id}
                item={item}
                order={index + 1}
                onEdit={onEdit}
                onRemove={onRemove}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                isFirst={index === 0}
                isLast={index === queue.length - 1}
                isNextUp={index === 0}
                gameInProgress={!!nowPlaying}
                canActuallyEdit={canActuallyEdit}
                isBusy={isBusy}
                loadingRoles={loadingRoles}
                isAdded={addedIds?.has(item.id) || false}
                isMoved={movedIds?.has(item.id) || false}
                isRemoving={removingId === item.id}
              />
            ))}
          </Stack>
        </>
      )}
      {/* Show loading message for actions if roles are loading */}
      {loadingRoles && (
        <Center p="md">
          <Text size="sm" c="secondary">Loading actions…</Text>
        </Center>
      )}
    </Paper>
  );
});

export default QueueList;
