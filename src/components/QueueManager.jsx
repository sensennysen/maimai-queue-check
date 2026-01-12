import { useState } from 'react'
import QueueForm from './QueueForm'
import QueueList from './QueueList'
import './QueueManager.css'

function QueueManager() {
  const [queue, setQueue] = useState([])
  const [nowPlaying, setNowPlaying] = useState(null)
  const [editingId, setEditingId] = useState(null)

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
    setQueue([...queue, newEntry])
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

  // Move entry up in queue
  const moveUp = (id) => {
    const index = queue.findIndex(item => item.id === id)
    if (index > 0) {
      const newQueue = [...queue]
      // Swap with previous item
      ;[newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]]
      // Update order numbers
      newQueue[index - 1].order = index
      newQueue[index].order = index + 1
      setQueue(newQueue)
    }
  }

  // Move entry down in queue
  const moveDown = (id) => {
    const index = queue.findIndex(item => item.id === id)
    if (index < queue.length - 1) {
      const newQueue = [...queue]
      // Swap with next item
      ;[newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]]
      // Update order numbers
      newQueue[index].order = index + 1
      newQueue[index + 1].order = index + 2
      setQueue(newQueue)
    }
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
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null)
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
  }

  return (
    <div className="queue-manager">
      <div className="queue-header">
        <h2>Queue Management</h2>
        <div className="queue-stats">
          <span className="queue-count">Total entries: {queue.length}</span>
          {queue.length > 0 && (
            <button 
              className="clear-btn"
              onClick={clearQueue}
              title="Clear entire queue"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {nowPlaying && (
        <div className="now-playing">
          <h3>🎮 Now Playing</h3>
          <div className="current-players">
            <div className="player-display">
              <span className="player-name">{nowPlaying.player1}</span>
              <span className="vs-text">VS</span>
              <span className="player-name">{nowPlaying.player2}</span>
            </div>
            <button 
              className="finish-game-btn" 
              onClick={finishGame}
              title="Finish current game"
            >
              Finish Game
            </button>
          </div>
        </div>
      )}

      <QueueForm 
        onSubmit={editingId ? updateQueueEntry : addQueueEntry}
        editingId={editingId}
        editingData={editingId ? queue.find(item => item.id === editingId) : null}
        onCancel={cancelEdit}
      />

      <QueueList 
        queue={queue}
        nowPlaying={nowPlaying}
        onEdit={startEdit}
        onRemove={removeQueueEntry}
        onMoveUp={moveUp}
        onMoveDown={moveDown}
        onStartGame={startGame}
      />
    </div>
  )
}

export default QueueManager