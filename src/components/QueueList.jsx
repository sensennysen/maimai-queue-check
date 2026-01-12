import { Paper, Title, Group, Button, Stack, Text, Center } from '@mantine/core'
import { IconPlayerPlay } from '@tabler/icons-react'
import QueueItem from './QueueItem'
import './QueueList.css'

function QueueList({ queue, nowPlaying, onEdit, onRemove, onMoveUp, onMoveDown, onStartGame }) {
  if (queue.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Center>
          <Stack align="center" gap="md">
            <Text size="xl" fw={600} c="dimmed">No entries in queue</Text>
            <Text c="dimmed">Add your first queue entry using the form above!</Text>
            <Text size="4rem">🎮</Text>
          </Stack>
        </Center>
      </Paper>
    )
  }

  return (
    <Paper withBorder>
      <Group justify="space-between" p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Title order={3}>Current Queue</Title>
        {!nowPlaying && queue.length > 0 && (
          <Button 
            leftSection={<IconPlayerPlay size={16} />}
            onClick={() => onStartGame()}
            variant="filled"
            color="green"
          >
            Start Game
          </Button>
        )}
      </Group>
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
          />
        ))}
      </Stack>
    </Paper>
  )
}

export default QueueList