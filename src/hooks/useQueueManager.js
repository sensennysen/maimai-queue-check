import { useState, useEffect, useCallback } from 'react';
import { queueService, sessionService, subscribeToQueueChanges, subscribeToSessionChanges, supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import { verifyUserLocationAndPermissions } from '../services/geolocation';

export const useQueueManager = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationCheckInProgress, setLocationCheckInProgress] = useState(false);
  const [hasAttemptedVerification, setHasAttemptedVerification] = useState(false);
  const [needsLocationPermission, setNeedsLocationPermission] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Function to verify user location and permissions
  const verifyLocation = useCallback(async () => {
    if (!user) {
      setLocationVerified(false);
      setLocationError('Please log in to edit the queue');
      setNeedsLocationPermission(false);
      return;
    }

    setLocationCheckInProgress(true);
    setLocationError(null);
    setHasAttemptedVerification(true);

    try {
      const result = await verifyUserLocationAndPermissions(user.id);
      
      setLocationVerified(result.allowed);
      setNeedsLocationPermission(result.needsPermission || false);
      
      if (!result.allowed) {
        setLocationError(result.reason);
      } else {
        setLocationError(null);
      }
    } catch (err) {
      console.error('Location verification error:', err);
      setLocationVerified(false);
      setLocationError('Failed to verify location. Please try again.');
      setNeedsLocationPermission(false);
    } finally {
      setLocationCheckInProgress(false);
    }
  }, [user]);

  // Automatically verify location when user is available and has not attempted verification
  useEffect(() => {
    const checkAndVerifyLocation = async () => {
      if (user && !hasAttemptedVerification && !locationCheckInProgress) {
        // Check if user has edit permissions first
        try {
          const { data: roles } = await supabase.from('user_roles').select('can_edit').eq('user_id', user.id).single();
          if (roles?.can_edit) {
            // User has edit permissions, verify location
            await verifyLocation();
          }
        } catch (err) {
          console.error('Error checking user permissions:', err);
        }
      }
    };
    
    checkAndVerifyLocation();
  }, [user, hasAttemptedVerification, locationCheckInProgress, verifyLocation]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [queueData, sessionData] = await Promise.all([
        queueService.getQueueEntries(),
        sessionService.getCurrentSession()
      ]);
      
      setQueue(queueData);
      setNowPlaying(sessionData);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time changes
  useEffect(() => {
    // Define handlers inside effect to avoid stale closure issues
    const handleQueueChange = (payload) => {
      console.log('🔄 handleQueueChange called, fetching queue...', payload?.eventType);
      queueService.getQueueEntries()
        .then(data => {
          console.log('✅ Queue updated with', data.length, 'entries');
          setQueue(data);
        })
        .catch(err => console.error('Error refreshing queue:', err));
    };

    const handleSessionChange = (payload) => {
      console.log('🔄 handleSessionChange called, fetching session...', payload?.eventType);
      sessionService.getCurrentSession()
        .then(data => {
          console.log('✅ Session updated:', data);
          setNowPlaying(data);
        })
        .catch(err => console.error('Error refreshing session:', err));
    };

    const queueSubscription = subscribeToQueueChanges(handleQueueChange);
    const sessionSubscription = subscribeToSessionChanges(handleSessionChange);

    // Test connection
    supabase.from('queue_entries').select('count').limit(1)
      .then(({ error }) => {
        setIsConnected(!error);
      })
      .catch(() => setIsConnected(false));

    return () => {
      if (queueSubscription) {
        queueSubscription.unsubscribe();
      }
      if (sessionSubscription) {
        sessionSubscription.unsubscribe();
      }
      setIsConnected(false);
    };
  }, []);

  // Test real-time connection
  const testRealTimeConnection = async () => {
    try {
      // Test basic connection
      const { error } = await supabase.from('queue_entries').select('*').limit(1);
      
      if (error) {
        console.error('❌ Database connection failed:', error);
        return false;
      }
      
      
      // Test real-time subscriptions
      const testChannel = supabase
        .channel('test_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries' }, 
          () => {
            // Real-time event received
          })
        .subscribe(() => {
            // Channel subscribed
        });
      
      setTimeout(() => {
        supabase.removeChannel(testChannel);
      }, 5000);
      
      return true;
    } catch (err) {
      console.error('❌ Connection test error:', err);
      return false;
    }
  };

  // Generate next order number
  const getNextOrder = () => {
    return queue.length > 0 ? Math.max(...queue.map(item => item.order_position)) + 1 : 1;
  };
  // Add new queue entry
  const addQueueEntry = async (player1, player2) => {
    // Check location verification before allowing operations
    if (!locationVerified) {
      const errorMsg = locationError || 'Location verification required to edit the queue';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      setIsMutating(true);
      const orderPosition = getNextOrder();
      const userId = user?.id || null;
      const userName = user?.email || user?.user_metadata?.name || null;
      const newEntry = await queueService.addQueueEntry(player1, player2, orderPosition, userId, userName);
      
      // Update local state immediately
      setQueue(prev => [...prev, newEntry]);
      
      // Auto-start if this is the first entry and no game is currently playing
      if (queue.length === 0 && !nowPlaying) {
        await startGame(newEntry.id, player1, player2);
      }
      
      return newEntry;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  // Update existing queue entry
  const updateQueueEntry = async (id, player1, player2) => {
    // Check location verification before allowing operations
    if (!locationVerified) {
      const errorMsg = locationError || 'Location verification required to edit the queue';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      setIsMutating(true);
      const updatedEntry = await queueService.updateQueueEntry(id, player1, player2);
      
      // Update local state immediately
      setQueue(prev => prev.map(item => 
        item.id === id ? updatedEntry : item
      ));
      
      return updatedEntry;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  // Remove queue entry
  const removeQueueEntry = async (id) => {
    // Check location verification before allowing operations
    if (!locationVerified) {
      const errorMsg = locationError || 'Location verification required to edit the queue';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      setIsMutating(true);
      await queueService.removeQueueEntry(id);
      
      // Update local state immediately
      const remainingEntries = queue.filter(item => item.id !== id);
      const reorderedEntries = remainingEntries.map((item, index) => ({
        ...item,
        order_position: index + 1
      }));
      setQueue(reorderedEntries);
      
      // Update order positions in database
      if (reorderedEntries.length > 0) {
        const updates = reorderedEntries.map(item => ({
          id: item.id,
          order_position: item.order_position
        }));
        await queueService.updateOrderPositions(updates);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  // Move entry up in queue
  const moveUp = async (id) => {
    try {
      setIsMutating(true);
      const index = queue.findIndex(item => item.id === id);
      if (index > 0) {
        // Update local state immediately for better UX
        const newQueue = [...queue];
        const updates = [
          { ...newQueue[index - 1], order_position: newQueue[index].order_position },
          { ...newQueue[index], order_position: newQueue[index - 1].order_position }
        ];
        
        // Swap items locally
        newQueue[index - 1] = updates[0];
        newQueue[index] = updates[1];
        setQueue(newQueue);
        
        // Update database
        await queueService.updateOrderPositions([
          { id: updates[0].id, order_position: updates[0].order_position },
          { id: updates[1].id, order_position: updates[1].order_position }
        ]);
      }
    } catch (err) {
      setError(err.message);
      // Reload data on error to sync with database
      await loadInitialData();
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  // Move entry down in queue
  const moveDown = async (id) => {
    try {
      setIsMutating(true);
      const index = queue.findIndex(item => item.id === id);
      if (index < queue.length - 1) {
        // Update local state immediately for better UX
        const newQueue = [...queue];
        const updates = [
          { ...newQueue[index], order_position: newQueue[index + 1].order_position },
          { ...newQueue[index + 1], order_position: newQueue[index].order_position }
        ];
        
        // Swap items locally
        newQueue[index] = updates[0];
        newQueue[index + 1] = updates[1];
        setQueue(newQueue);
        
        // Update database
        await queueService.updateOrderPositions([
          { id: updates[0].id, order_position: updates[0].order_position },
          { id: updates[1].id, order_position: updates[1].order_position }
        ]);
      }
    } catch (err) {
      setError(err.message);
      // Reload data on error to sync with database
      await loadInitialData();
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  // Clear entire queue
  const clearQueue = async () => {
    try {
      setIsMutating(true);
      if (queue.length > 0) {
        await queueService.clearQueue();
        // Update local state immediately
        setQueue([]);
      }
      // End current session if one exists
      if (nowPlaying) {
        await sessionService.endCurrentSession();
        setNowPlaying(null);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  // Start a new game
  const startGame = async (queueEntryId, player1, player2) => {
    try {
      setIsMutating(true);
      // Mark queue entry as playing
      if (queueEntryId) {
        await queueService.markAsPlaying(queueEntryId);
        // Update local queue to reflect status change
        setQueue(prev => prev.filter(item => item.id !== queueEntryId));
      }
      
      // Start new session
      const userId = user?.id || null;
      const userName = user?.email || user?.user_metadata?.name || null;
      const session = await sessionService.startSession(player1, player2, userId, userName);
      // Update local session state
      setNowPlaying(session);
      
      return session;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  // End current game and start next
  const endGame = async () => {
    try {
      setIsMutating(true);
      // End current session
      await sessionService.endCurrentSession();
      setNowPlaying(null);
      
      // Mark current playing entry as completed (if any)
      // Note: We don't need to do anything here since the entry was already removed from queue when started
      
      // Start next game if queue is not empty
      const nextEntry = queue.find(entry => entry.status === 'waiting' || !entry.status);
      if (nextEntry) {
        await startGame(nextEntry.id, nextEntry.player1, nextEntry.player2);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  // Start next game without ending current one (for manual control)
  const startNextGame = async () => {
    try {
      setIsMutating(true);
      const nextEntry = queue.find(entry => entry.status === 'waiting' || !entry.status);
      if (nextEntry) {
        await startGame(nextEntry.id, nextEntry.player1, nextEntry.player2);
        await loadInitialData();
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  return {
    queue,
    nowPlaying,
    loading,
    error,
    isConnected,
    isMutating,
    locationVerified,
    locationError,
    locationCheckInProgress,
    hasAttemptedVerification,
    needsLocationPermission,
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
    testRealTimeConnection,
    verifyLocation
  };
};