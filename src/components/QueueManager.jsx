import { useState } from 'react'
import { Stack, Title, Group, Text, Button, Paper, Flex, Badge, Box } from '@mantine/core'
import { IconPlayerStop, IconTrash, IconPlus } from '@tabler/icons-react'
import QueueForm from './QueueForm'
import QueueList from './QueueList'
import './QueueManager.css'

function QueueManager() {
  const [queue, setQueue] = useState([])
  const [nowPlaying, setNowPlaying] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  // Generate next order number
  const getNextOrder = () => {
    return queue.length > 0 ? Math.max(...queue.map(item => item.order)) + 1 : 1
  }

  // Add new queue entry
  const addQueueEntry = (player1, player2) => {
    const newEntry = {
      id: Date.now(), // Simple ID generation
      order: getNextOrder(),
      player1: player1.trim(),
      player2: player2.trim()
    }
    const updatedQueue = [...queue, newEntry]
    setShowForm(false)
    
    // Auto-start if this is the only entry and no game is currently playing
    if (updatedQueue.length === 1 && !nowPlaying) {
      setNowPlaying(newEntry)
      setQueue([]) // Remove the entry from queue since it's now playing
    } else {
      setQueue(updatedQueue)
    }
  }

  // Update existing queue entry
  const updateQueueEntry = (id, player1, player2) => {
    setQueue(queue.map(item => 
      item.id === id 
        ? { ...item, player1: player1.trim(), player2: player2.trim() }
        : item
    ))
    setEditingId(null)
  }

  // Remove queue entry
  const removeQueueEntry = (id) => {
    const newQueue = queue.filter(item => item.id !== id)
    // Reorder the remaining entries
    const reorderedQueue = newQueue.map((item, index) => ({
      ...item,
      order: index + 1
    }))
    setQueue(reorderedQueue)
  }

  // Reorder queue by drag and drop
  const reorderQueue = (draggedId, targetId) => {
    const draggedIndex = queue.findIndex(item => item.id === draggedId)
    const targetIndex = queue.findIndex(item => item.id === targetId)
    
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      return
    }

    const newQueue = [...queue]
    const draggedItem = newQueue[draggedIndex]
    
    // Remove dragged item
    newQueue.splice(draggedIndex, 1)
    
    // Insert at new position
    const newTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex
    newQueue.splice(newTargetIndex, 0, draggedItem)
    
    // Update order numbers
    const reorderedQueue = newQueue.map((item, index) => ({
      ...item,
      order: index + 1
    }))
    
    setQueue(reorderedQueue)
  }

  // Clear entire queue
  const clearQueue = () => {
    if (queue.length > 0 && window.confirm('Are you sure you want to clear the entire queue?')) {
      setQueue([])
      setEditingId(null)
    }
  }

  // Start editing
  const startEdit = (id) => {
    setEditingId(id)
    setShowForm(true)
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null)
    setShowForm(false)
  }

  // Start a new game with the first queue entry
  const startGame = () => {
    if (queue.length > 0) {
      const firstEntry = queue[0]
      setNowPlaying(firstEntry)
      // Remove first entry and reorder remaining queue
      const newQueue = queue.slice(1).map((item, index) => ({
        ...item,
        order: index + 1
      }))
      setQueue(newQueue)
    }
  }

  // Finish current game
  const finishGame = () => {
    setNowPlaying(null)
    // Automatically start next game if queue has entries
    if (queue.length > 0) {
      setTimeout(() => {
        const firstEntry = queue[0]
        setNowPlaying(firstEntry)
        // Remove first entry and reorder remaining queue
        const newQueue = queue.slice(1).map((item, index) => ({
          ...item,
          order: index + 1
        }))
        setQueue(newQueue)
      }, 100) // Small delay to ensure state updates properly
    }
  }

  return (
    <Stack gap="md">
      <Paper p="md" withBorder>
        <Group justify="space-between" align="center">
          <Title order={2}>Queue Management</Title>
          <Group gap="sm">
            <Badge variant="light" size="lg">
              Total entries: {queue.length}
            </Badge>
            {queue.length > 0 && (
              <Button 
                variant="outline"
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={clearQueue}
              >
                Clear All
              </Button>
            )}
          </Group>
        </Group>
      </Paper>

      {nowPlaying && (
        <Paper p="md" withBorder>
          <Group justify="space-between" align="center" mb="md">
            <Title order={3}>🎮 Now Playing</Title>
          </Group>
          <Group gap="sm" justify="space-between">
            <Flex gap="md" style={{ flex: 1 }}>
              {nowPlaying.player1 && nowPlaying.player1.trim() && (
                <Box style={{ 
                  flex: 1,
                  minWidth: 0,
                  backgroundColor: 'var(--mantine-color-blue-1)', 
                  padding: '8px 12px', 
                  borderRadius: '8px',
                  border: '1px solid var(--mantine-color-blue-4)'
                }}>
                  <Group gap="xs">
                    <Badge variant="filled" color="blue" size="sm">P1</Badge>
                    <Text fw={500}>{nowPlaying.player1}</Text>
                  </Group>
                </Box>
              )}

              {nowPlaying.player2 && nowPlaying.player2.trim() && (
                <Box style={{ 
                  flex: 1,
                  minWidth: 0,
                  backgroundColor: 'var(--mantine-color-grape-1)', 
                  padding: '8px 12px', 
                  borderRadius: '8px',
                  border: '1px solid var(--mantine-color-grape-4)'
                }}>
                  <Group gap="xs">
                    <Badge variant="filled" color="grape" size="sm">P2</Badge>
                    <Text fw={500}>{nowPlaying.player2}</Text>
                  </Group>
                </Box>
              )}
            </Flex>
            <Button 
              variant="filled"
              color="green"
              leftSection={<IconPlayerStop size={16} />}
              onClick={finishGame}
            >
              Finish Game
            </Button>
          </Group>
        </Paper>
      )}

      {!showForm && !editingId && (
        <Paper p="md" withBorder>
          <Group justify="center">
            <Button 
              leftSection={<IconPlus size={16} />}
              onClick={() => setShowForm(true)}
              size="lg"
            >
              Add Queue
            </Button>
          </Group>
        </Paper>
      )}

      {(showForm || editingId) && (
        <QueueForm 
          onSubmit={editingId ? updateQueueEntry : addQueueEntry}
          editingId={editingId}
          editingData={editingId ? queue.find(item => item.id === editingId) : null}
          onCancel={cancelEdit}
        />
      )}

      <QueueList 
        queue={queue}
        nowPlaying={nowPlaying}
        onEdit={startEdit}
        onRemove={removeQueueEntry}
        onReorder={reorderQueue}
        onStartGame={startGame}
      />
    </Stack>
  )
}

export default QueueManager