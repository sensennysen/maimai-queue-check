import { useState, useEffect } from 'react'
import { queueService, sessionService } from '../services/supabase'

export const useQueueManagerPolling = () => {
  const [queue, setQueue] = useState([])
  const [nowPlaying, setNowPlaying] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isConnected, setIsConnected] = useState(true)

  // Polling interval (every 2 seconds)
  const POLL_INTERVAL = 2000

  // Load data from server
  const loadData = async () => {
    try {
      const [queueData, sessionData] = await Promise.all([
        queueService.getQueueEntries(),
        sessionService.getCurrentSession()
      ])
      
      setQueue(queueData)
      setNowPlaying(sessionData)
      setError(null)
      setIsConnected(true)
    } catch (err) {
      setError(err.message)
      setIsConnected(false)
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadData()
  }, [])

  // Polling setup
  useEffect(() => {
    const interval = setInterval(loadData, POLL_INTERVAL)
    console.log(`✅ Polling every ${POLL_INTERVAL}ms`)

    return () => {
      clearInterval(interval)
      console.log('Polling stopped')
    }
  }, [])

  const getNextOrder = () => {
    return queue.length > 0 ? Math.max(...queue.map(item => item.order_position)) + 1 : 1
  }

  const addQueueEntry = async (player1, player2) => {
    try {
      const orderPosition = getNextOrder()
      const newEntry = await queueService.addQueueEntry(player1, player2, orderPosition)
      
      // Immediately refresh data to show changes
      await loadData()
      
      return newEntry
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateQueueEntry = async (id, player1, player2) => {
    try {
      const updatedEntry = await queueService.updateQueueEntry(id, player1, player2)
      await loadData()
      return updatedEntry
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const removeQueueEntry = async (id) => {
    try {
      await queueService.removeQueueEntry(id)
      
      const remainingEntries = queue.filter(item => item.id !== id)
      const updates = remainingEntries.map((item, index) => ({
        id: item.id,
        order_position: index + 1
      }))
      
      if (updates.length > 0) {
        await queueService.updateOrderPositions(updates)
      }
      
      await loadData()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const moveUp = async (id) => {
    try {
      const index = queue.findIndex(item => item.id === id)
      if (index > 0) {
        const updates = [
          { id: queue[index - 1].id, order_position: queue[index].order_position },
          { id: queue[index].id, order_position: queue[index - 1].order_position }
        ]
        await queueService.updateOrderPositions(updates)
        await loadData()
      }
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const moveDown = async (id) => {
    try {
      const index = queue.findIndex(item => item.id === id)
      if (index < queue.length - 1) {
        const updates = [
          { id: queue[index].id, order_position: queue[index + 1].order_position },
          { id: queue[index + 1].id, order_position: queue[index].order_position }
        ]
        await queueService.updateOrderPositions(updates)
        await loadData()
      }
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const clearQueue = async () => {
    try {
      await queueService.clearQueue()
      await loadData()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const startGame = async (queueEntryId, player1, player2) => {
    try {
      if (queueEntryId) {
        await queueService.markAsPlaying(queueEntryId)
      }
      
      const session = await sessionService.startSession(player1, player2)
      await loadData()
      return session
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const endGame = async () => {
    try {
      await sessionService.endCurrentSession()
      
      const nextEntry = queue.find(entry => entry.status === 'waiting' || !entry.status)
      if (nextEntry) {
        await startGame(nextEntry.id, nextEntry.player1, nextEntry.player2)
      }
      
      await loadData()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const startNextGame = async () => {
    try {
      const nextEntry = queue.find(entry => entry.status === 'waiting' || !entry.status)
      if (nextEntry) {
        await startGame(nextEntry.id, nextEntry.player1, nextEntry.player2)
      }
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    queue,
    nowPlaying,
    loading,
    error,
    isConnected,
    addQueueEntry,
    updateQueueEntry,
    removeQueueEntry,
    moveUp,
    moveDown,
    clearQueue,
    startGame,
    endGame,
    startNextGame,
    getNextOrder,
    refreshData: loadData
  }
}