import { useState, memo } from 'react';
import { Paper, Title, Group, Button, Stack, Text, Center } from '@mantine/core';
import { IconPlayerPlay, IconLock } from '@tabler/icons-react';
import QueueItem from './QueueItem';
import { useAuth } from '../../../hooks/useAuth';
import { usePermissions } from '../../../hooks/usePermissions';
import { emptyQueueMessages } from '../../../data/subtitleMessages';
import './QueueList.css';

const QueueList = memo(function QueueList({ queue, nowPlaying, onEdit, onRemove, onMoveUp, onMoveDown, onStartGame, isMallOpen, isBusy = false, loadingRoles = false, cabinetNum = null, hasMultipleCabinets = false, addedIds = null, movedIds = null, removingId = null }) {
  const { user, userRoles } = useAuth();

  // Lazy initialization - the function is only called once on mount, not during render
  const [emptyMessageIndex] = useState(() => Math.floor(Math.random() * emptyQueueMessages.length));
  const emptyMessage = queue.length === 0 ? emptyQueueMessages[emptyMessageIndex] : '';

  const { canActuallyEdit, canEdit } = usePermissions();

  // Determine header title based on cabinet
  const queueTitle = hasMultipleCabinets && cabinetNum ? `Current Queue - Cabinet ${cabinetNum}` : 'Current Queue';

  return (
    <Paper withBorder>
      <Group justify="space-between" p="md" style={{ borderBottom: '1px solid var(--theme-border)', alignItems: 'center', minHeight: 48 }}>
        <Title order={3} style={{ margin: 0 }}>{queueTitle}</Title>
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
            color="green"
            loading={isBusy}
          >
            Start Game
          </Button>
        )}
      </Group>
      {user && userRoles !== undefined && !userRoles?.can_edit && !userRoles?.is_admin && !userRoles?.is_super_admin && (
        <Group p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', backgroundColor: 'var(--mantine-color-yellow-0)' }}>
          <Text size="sm" c="orange">
            You can view the queue but don't have permission to edit it
          </Text>
        </Group>
      )}
      {queue.length === 0 ? (
        <Center p="xl">
          <Stack align="center" gap="md">
            <Text size="xl" fw={600} c="dimmed">{emptyMessage}</Text>
            {user && (
              <Text c="dimmed">Add to queue by pressing the Add to Queue button above</Text>
            )}
          </Stack>
        </Center>
      ) : (
        <Stack gap={0}>
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
      )}
      {/* Show loading message for actions if roles are loading */}
      {loadingRoles && (
        <Center p="md">
          <Text size="sm" c="dimmed">Loading actions…</Text>
        </Center>
      )}
    </Paper>
  );
});

export default QueueList;