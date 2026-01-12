import { useState } from 'react'
import { Stack, Title, Group, Text, Button, Paper, Flex, Badge, Box, LoadingOverlay, Alert, Indicator } from '@mantine/core'
import { IconPlayerStop, IconTrash, IconPlus, IconAlertCircle, IconWifi, IconWifiOff } from '@tabler/icons-react'
import QueueForm from './QueueForm'
import QueueList from './QueueList'
import { useQueueManagerPolling as useQueueManager } from '../hooks/useQueueManagerPolling'
import { useAuth } from '../hooks/useAuth'
import './QueueManager.css'

function QueueManager() {
  const { user, userRoles } = useAuth()
  const {
    queue,
    nowPlaying,
    loading,
    error,
    isConnected,
    addQueueEntry: addEntry,
    updateQueueEntry: updateEntry,
    removeQueueEntry,
    moveUp,
    moveDown,
    clearQueue: clearAllQueue,
    endGame,
    startNextGame
  } = useQueueManager()

  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const canEdit = userRoles?.can_edit

  // Add new queue entry
  const addQueueEntry = async (player1, player2) => {
    try {
      await addEntry(player1, player2)
      setShowForm(false)
    } catch (err) {
      console.error('Failed to add queue entry:', err)
    }
  }

  // Update existing queue entry
  const updateQueueEntry = async (id, player1, player2) => {
    try {
      await updateEntry(id, player1, player2)
      setEditingId(null)
    } catch (err) {
      console.error('Failed to update queue entry:', err)
    }
  }

  // Clear entire queue
  const clearQueue = async () => {
    if (queue.length > 0 && window.confirm('Are you sure you want to clear the entire queue?')) {
      try {
        await clearAllQueue()
        setEditingId(null)
      } catch (err) {
        console.error('Failed to clear queue:', err)
      }
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

  // Finish current game
  const finishGame = async () => {
    try {
      await endGame()
    } catch (err) {
      console.error('Failed to finish game:', err)
    }
  }

  // Start game from queue
  const startGame = async (id) => {
    try {
      await startNextGame()
    } catch (err) {
      console.error('Failed to start game:', err)
    }
  }

  return (
    <Stack gap="md" style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading} />
      
      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />} 
          title="Error" 
          color="red"
          variant="light"
        >
          {error}
        </Alert>
      )}

      <Paper p="md" withBorder>
        <Group justify="space-between" align="center">
          <Group gap="md">
            <Badge variant="light" size="lg">
              Total entries: {queue.length}
            </Badge>
            <Indicator 
              color={isConnected ? 'green' : 'red'} 
              size={8}
              processing={!isConnected}
            >
              <Badge 
                variant="light" 
                color={isConnected ? 'green' : 'red'}
                leftSection={isConnected ? <IconWifi size={12} /> : <IconWifiOff size={12} />}
              >
                {isConnected ? 'Live' : 'Offline'}
              </Badge>
            </Indicator>
          </Group>
          <Group gap="sm">
            {user && canEdit && !showForm && !editingId && (
              <Button 
                leftSection={<IconPlus size={16} />}
                onClick={() => setShowForm(true)}
                variant="filled"
              >
                Add Queue
              </Button>
            )}
            {user && canEdit && queue.length > 0 && (
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
        <div className="now-playing">
          <div className="now-playing-header">
            <h3>🎮 Now Playing</h3>
          </div>
          <div className="current-players">
            <div className="player-display">
              {nowPlaying.player1 && nowPlaying.player1.trim() && (
                <div className={`playing-player player-1 ${(!nowPlaying.player2 || !nowPlaying.player2.trim()) ? 'player-solo' : ''}`}>
                  <span className="player-side-indicator player-side-1">P1</span>
                  <span className="player-name">{nowPlaying.player1}</span>
                </div>
              )}
              
              {nowPlaying.player2 && nowPlaying.player2.trim() && (
                <div className={`playing-player player-2 ${(!nowPlaying.player1 || !nowPlaying.player1.trim()) ? 'player-solo' : ''}`}>
                  <span className="player-side-indicator player-side-2">P2</span>
                  <span className="player-name">{nowPlaying.player2}</span>
                </div>
              )}
            </div>
            
            {user && canEdit && (
              <button 
                className="finish-game-btn"
                onClick={finishGame}
              >
                <IconPlayerStop size={16} />
                Finish Game
              </button>
            )}
          </div>
        </div>
      )}

      {user && (showForm || editingId) && (
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
        onMoveUp={moveUp}
        onMoveDown={moveDown}
        onStartGame={startGame}
      />
    </Stack>
  )
}

export default QueueManager