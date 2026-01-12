import { useState, useEffect } from 'react'
import { queueService, sessionService, subscribeToQueueChanges, subscribeToSessionChanges, supabase } from '../services/supabase'

export const useQueueManager = () => {
  const [queue, setQueue] = useState([])
  const [nowPlaying, setNowPlaying] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Subscribe to real-time changes
  useEffect(() => {
    let queueSubscription
    let sessionSubscription

    const setupSubscriptions = async () => {
      try {
        console.log('Setting up real-time subscriptions...')
        
        queueSubscription = subscribeToQueueChanges(handleQueueChange)
        sessionSubscription = subscribeToSessionChanges(handleSessionChange)
        
        // Wait a bit for subscriptions to establish
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Test connection by checking supabase status
        const { data, error } = await supabase.from('queue_entries').select('count').limit(1)
        if (!error) {
          setIsConnected(true)
          console.log('✅ Real-time connection established')
        } else {
          setIsConnected(false)
          console.error('❌ Connection test failed:', error)
        }
      } catch (err) {
        console.error('Subscription setup error:', err)
        setIsConnected(false)
      }
    }

    setupSubscriptions()

    return () => {
      if (queueSubscription) {
        queueSubscription.unsubscribe()
        console.log('Queue subscription cleaned up')
      }
      if (sessionSubscription) {
        sessionSubscription.unsubscribe()
        console.log('Session subscription cleaned up')
      }
      setIsConnected(false)
    }
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [queueData, sessionData] = await Promise.all([
        queueService.getQueueEntries(),
        sessionService.getCurrentSession()
      ])
      
      setQueue(queueData)
      setNowPlaying(sessionData)
      setError(null)
    } catch (err) {
      setError(err.message)
      console.error('Error loading initial data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleQueueChange = (payload) => {
    console.log('Queue change detected:', payload)
    
    // Reload queue data when changes occur from other clients
    queueService.getQueueEntries()
      .then(data => {
        setQueue(data)
      })
      .catch(err => console.error('Error refreshing queue:', err))
  }

  const handleSessionChange = (payload) => {
    console.log('Session change detected:', payload)
    
    // Reload session data when changes occur from other clients  
    sessionService.getCurrentSession()
      .then(data => {
        setNowPlaying(data)
      })
      .catch(err => console.error('Error refreshing session:', err))
  }

  // Test real-time connection
  const testRealTimeConnection = async () => {
    try {
      console.log('🔍 Testing real-time connection...')
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
      console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
      
      // Test basic connection
      const { data, error } = await supabase.from('queue_entries').select('*').limit(1)
      
      if (error) {
        console.error('❌ Database connection failed:', error)
        return false
      }
      
      console.log('✅ Database connection successful')
      console.log('Current queue data:', data)
      
      // Test real-time subscriptions
      const testChannel = supabase
        .channel('test_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries' }, 
          (payload) => {
            console.log('🔔 Test real-time event received:', payload)
          })
        .subscribe((status) => {
          console.log('Test channel status:', status)
        })
      
      setTimeout(() => {
        supabase.removeChannel(testChannel)
      }, 5000)
      
      return true
    } catch (err) {
      console.error('❌ Connection test error:', err)
      return false
    }
  }

  // Generate next order number
  const getNextOrder = () => {
    return queue.length > 0 ? Math.max(...queue.map(item => item.order_position)) + 1 : 1
  }
  // Add new queue entry
  const addQueueEntry = async (player1, player2) => {
    try {
      const orderPosition = getNextOrder()
      const newEntry = await queueService.addQueueEntry(player1, player2, orderPosition)
      
      // Update local state immediately
      setQueue(prev => [...prev, newEntry])
      
      // Auto-start if this is the first entry and no game is currently playing
      if (queue.length === 0 && !nowPlaying) {
        await startGame(newEntry.id, player1, player2)
      }
      
      return newEntry
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Update existing queue entry
  const updateQueueEntry = async (id, player1, player2) => {
    try {
      const updatedEntry = await queueService.updateQueueEntry(id, player1, player2)
      
      // Update local state immediately
      setQueue(prev => prev.map(item => 
        item.id === id ? updatedEntry : item
      ))
      
      return updatedEntry
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Remove queue entry
  const removeQueueEntry = async (id) => {
    try {
      await queueService.removeQueueEntry(id)
      
      // Update local state immediately
      const remainingEntries = queue.filter(item => item.id !== id)
      const reorderedEntries = remainingEntries.map((item, index) => ({
        ...item,
        order_position: index + 1
      }))
      setQueue(reorderedEntries)
      
      // Update order positions in database
      if (reorderedEntries.length > 0) {
        const updates = reorderedEntries.map(item => ({
          id: item.id,
          order_position: item.order_position
        }))
        await queueService.updateOrderPositions(updates)
      }
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Move entry up in queue
  const moveUp = async (id) => {
    try {
      const index = queue.findIndex(item => item.id === id)
      if (index > 0) {
        // Update local state immediately for better UX
        const newQueue = [...queue]
        const updates = [
          { ...newQueue[index - 1], order_position: newQueue[index].order_position },
          { ...newQueue[index], order_position: newQueue[index - 1].order_position }
        ]
        
        // Swap items locally
        newQueue[index - 1] = updates[0]
        newQueue[index] = updates[1]
        setQueue(newQueue)
        
        // Update database - send all fields to prevent null values
        await queueService.updateOrderPositions([
          { id: updates[0].id, order_position: updates[0].order_position, player1: updates[0].player1, player2: updates[0].player2, status: updates[0].status },
          { id: updates[1].id, order_position: updates[1].order_position, player1: updates[1].player1, player2: updates[1].player2, status: updates[1].status }
        ])
      }
    } catch (err) {
      setError(err.message)
      // Reload data on error to sync with database
      await loadInitialData()
      throw err
    }
  }

  // Move entry down in queue
  const moveDown = async (id) => {
    try {
      const index = queue.findIndex(item => item.id === id)
      if (index < queue.length - 1) {
        // Update local state immediately for better UX
        const newQueue = [...queue]
        const updates = [
          { ...newQueue[index], order_position: newQueue[index + 1].order_position },
          { ...newQueue[index + 1], order_position: newQueue[index].order_position }
        ]
        
        // Swap items locally
        newQueue[index] = updates[0]
        newQueue[index + 1] = updates[1]
        setQueue(newQueue)
        
        // Update database - send all fields to prevent null values
        await queueService.updateOrderPositions([
          { id: updates[0].id, order_position: updates[0].order_position, player1: updates[0].player1, player2: updates[0].player2, status: updates[0].status },
          { id: updates[1].id, order_position: updates[1].order_position, player1: updates[1].player1, player2: updates[1].player2, status: updates[1].status }
        ])
      }
    } catch (err) {
      setError(err.message)
      // Reload data on error to sync with database
      await loadInitialData()
      throw err
    }
  }

  // Clear entire queue
  const clearQueue = async () => {
    try {
      if (queue.length > 0) {
        await queueService.clearQueue()
        // Update local state immediately
        setQueue([])
      }
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Start a new game
  const startGame = async (queueEntryId, player1, player2) => {
    try {
      // Mark queue entry as playing
      if (queueEntryId) {
        await queueService.markAsPlaying(queueEntryId)
        // Update local queue to reflect status change
        setQueue(prev => prev.filter(item => item.id !== queueEntryId))
      }
      
      // Start new session
      const session = await sessionService.startSession(player1, player2)
      // Update local session state
      setNowPlaying(session)
      
      return session
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // End current game and start next
  const endGame = async () => {
    try {
      // End current session
      await sessionService.endCurrentSession()
      setNowPlaying(null)
      
      // Mark current playing entry as completed (if any)
      // Note: We don't need to do anything here since the entry was already removed from queue when started
      
      // Start next game if queue is not empty
      const nextEntry = queue.find(entry => entry.status === 'waiting' || !entry.status)
      if (nextEntry) {
        await startGame(nextEntry.id, nextEntry.player1, nextEntry.player2)
      }
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Start next game without ending current one (for manual control)
  const startNextGame = async () => {
    try {
      const nextEntry = queue.find(entry => entry.status === 'waiting' || !entry.status)
      if (nextEntry) {
        await startGame(nextEntry.id, nextEntry.player1, nextEntry.player2)
        await loadInitialData()
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
    refreshData: loadInitialData,
    testRealTimeConnection
  }
}