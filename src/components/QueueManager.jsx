import { useState, useEffect, useRef } from 'react'
import { Stack, Title, Group, Text, Button, Paper, Flex, Badge, Box, LoadingOverlay, Alert, Indicator } from '@mantine/core'
import { IconPlayerStop, IconTrash, IconPlus, IconAlertCircle, IconWifi, IconWifiOff } from '@tabler/icons-react'
import QueueForm from './QueueForm'
import QueueList from './QueueList'
import PlayTimer from './PlayTimer'
import { useQueueManagerPolling as useQueueManager } from '../hooks/useQueueManagerPolling'
import { useMallSchedule } from '../hooks/useMallSchedule'
import { useAuth } from '../hooks/useAuth'
import { closedMessages } from '../data/subtitleMessages'
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
  const [closedMessage, setClosedMessage] = useState('')

  const canEdit = userRoles?.can_edit

  const { isMallOpen, filterQueueByOperatingHours: filterQueue, loading: scheduleLoading } = useMallSchedule()

  const previousMallStateRef = useRef(isMallOpen)

  useEffect(() => {
    if (previousMallStateRef.current && !isMallOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClosedMessage(closedMessages[Math.floor(Math.random() * closedMessages.length)])
    }
    previousMallStateRef.current = isMallOpen
  }, [isMallOpen])

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
      setShowForm(false)
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
  const startGame = async () => {
    try {
      await startNextGame()
    } catch (err) {
      console.error('Failed to start game:', err)
    }
  }

  return (
    <Stack gap="md" style={{ position: 'relative' }}>
      <LoadingOverlay visible={loading || scheduleLoading} />
      
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
              Credits: {(isMallOpen ? filterQueue(queue) : []).reduce((sum, item) => sum + (item.player1?.trim() ? 1 : 0) + (item.player2?.trim() ? 1 : 0), 0)}
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
            {user && canEdit && isMallOpen && !showForm && !editingId && (
              <Button 
                leftSection={<IconPlus size={16} />}
                onClick={() => setShowForm(true)}
                variant="filled"
              >
                Add Queue
              </Button>
            )}
            {user && canEdit && isMallOpen && queue.length > 0 && (
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

      {isMallOpen && nowPlaying && (
        <div className="now-playing">
          <div className="now-playing-header">
            <h3>Now Playing</h3>
            <PlayTimer startTime={nowPlaying.started_at} />
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

      {!isMallOpen && (
        <Paper p="xl" withBorder>
          <Flex align="center" justify="center" style={{ height: 200 }}>
            <Title order={2}>{closedMessage}</Title>
          </Flex>
        </Paper>
      )}

      {user && isMallOpen && (showForm || editingId) && (
        <QueueForm 
          key={editingId || 'new'}
          onSubmit={editingId ? updateQueueEntry : addQueueEntry}
          editingId={editingId}
          editingData={editingId ? queue.find(item => item.id === editingId) : null}
          onCancel={cancelEdit}
        />
      )}

      {isMallOpen && (
        <QueueList 
        queue={filterQueue(queue)}
        nowPlaying={nowPlaying}
        onEdit={startEdit}
        onRemove={removeQueueEntry}
        onMoveUp={moveUp}
        onMoveDown={moveDown}
        onStartGame={startGame}
        isMallOpen={isMallOpen}
      />
      )}
    </Stack>
  )
}

export default QueueManager