import { useState, useEffect } from 'react';
import { Paper, Title, Group, Button, Stack, Text, Center } from '@mantine/core';
import { IconPlayerPlay, IconLock } from '@tabler/icons-react';
import QueueItem from './QueueItem';
import { useAuth } from '../hooks/useAuth';
import { emptyQueueMessages } from '../data/subtitleMessages';
import './QueueList.css';

function QueueList({ queue, nowPlaying, onEdit, onRemove, onMoveUp, onMoveDown, onStartGame, isMallOpen, isBusy = false, locationVerified, loadingRoles = false }) {
  const { user, userRoles } = useAuth();
  const [emptyMessage, setEmptyMessage] = useState('');

  useEffect(() => {
    if (queue.length === 0) {
      const randomMsg = emptyQueueMessages[Math.floor(Math.random() * emptyQueueMessages.length)];
      setEmptyMessage(randomMsg);
    }
  }, [queue.length]);

  const isAdmin = userRoles?.is_admin;
  const canEdit = userRoles?.can_edit;
  const canActuallyEdit = isAdmin || (canEdit && locationVerified);
  return (
    <Paper withBorder>
      <Group justify="space-between" p="md" style={{ borderBottom: '1px solid var(--theme-border)', alignItems: 'center', minHeight: 48 }}>
        <Title order={3} style={{ margin: 0 }}>Current Queue</Title>
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
            disabled={isBusy}
          >
            Start Game
          </Button>
        )}
      </Group>
      {user && userRoles !== undefined && !userRoles?.can_edit && !userRoles?.is_admin && (
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
              onMoveUp={(id) => onMoveUp(id)}
              onMoveDown={(id) => onMoveDown(id)}
              isFirst={index === 0}
              isLast={index === queue.length - 1}
              isNextUp={index === 0}
              gameInProgress={!!nowPlaying}
              canActuallyEdit={canActuallyEdit}
              isBusy={isBusy}
              loadingRoles={loadingRoles}
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
}

export default QueueList;