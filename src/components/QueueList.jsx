import { Paper, Title, Group, Button, Stack, Text, Center } from '@mantine/core';
import { IconPlayerPlay } from '@tabler/icons-react';
import QueueItem from './QueueItem';
import { useAuth } from '../hooks/useAuth';
import './QueueList.css';

function QueueList({ queue, nowPlaying, onEdit, onRemove, onMoveUp, onMoveDown, onStartGame, isMallOpen, isBusy = false }) {
  const { user, userRoles } = useAuth();
  
  // Safely check if user can edit - default to true if roles aren't loaded yet
  const canEdit = userRoles === undefined ? true : userRoles?.can_edit;
  
  return (
    <Paper withBorder>
      <Group justify="space-between" p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Title order={3}>Current Queue</Title>
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
      {!user && (
        <Group p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', backgroundColor: 'var(--mantine-color-blue-0)' }}>
          <Text size="sm" c="blue">
            🔒 Sign in above and receive permission to edit the queue
          </Text>
        </Group>
      )}
      {user && userRoles !== undefined && !userRoles?.can_edit && (
        <Group p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', backgroundColor: 'var(--mantine-color-yellow-0)' }}>
          <Text size="sm" c="orange">
            You can view the queue but don't have permission to edit it
          </Text>
        </Group>
      )}
      {queue.length === 0 ? (
        <Center p="xl">
          <Stack align="center" gap="md">
            <Text size="xl" fw={600} c="dimmed">No one in line...</Text>
            <Text c="dimmed">Add to queue by pressing the button above</Text>
          </Stack>
        </Center>
      ) : (
        <Stack gap={0}>
          {queue.map((item, index) => (
            <QueueItem
              key={item.id}
              item={item}
              onEdit={onEdit}
              onRemove={onRemove}
              onMoveUp={(id) => onMoveUp(id)}
              onMoveDown={(id) => onMoveDown(id)}
              isFirst={index === 0}
              isLast={index === queue.length - 1}
              isNextUp={index === 0 && !nowPlaying}
              gameInProgress={!!nowPlaying}
              userRoles={userRoles}
              isBusy={isBusy}
            />
          ))}
        </Stack>
      )}
    </Paper>
  );
}

export default QueueList;