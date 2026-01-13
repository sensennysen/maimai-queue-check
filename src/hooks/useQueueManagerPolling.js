import { useState, useEffect, useRef, useCallback } from 'react';
import { queueService, sessionService, supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import { verifyUserLocationAndPermissions } from '../services/geolocation';

export const useQueueManagerPolling = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationCheckInProgress, setLocationCheckInProgress] = useState(false);
  const [hasAttemptedVerification, setHasAttemptedVerification] = useState(false);

  // Track if an operation is in progress to prevent polling interference
  const isOperationInProgress = useRef(false);
  const pollTimeoutRef = useRef(null);

  // Polling interval (every 2 seconds)
  const POLL_INTERVAL = 2000;

  // Load data from server
  // eslint-disable-next-line no-unused-vars
  const loadData = async (skipConnectionCheck = false) => {
    try {
      const [queueData, sessionData] = await Promise.all([
        queueService.getQueueEntries(),
        sessionService.getCurrentSession()
      ]);
      
      setQueue(queueData);
      setNowPlaying(sessionData);
      setError(null);
      setIsConnected(true);
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Function to verify user location and permissions
  const verifyLocation = useCallback(async () => {
    if (!user) {
      setLocationVerified(false);
      setLocationError('Please log in to edit the queue');
      return;
    }

    setLocationCheckInProgress(true);
    setLocationError(null);
    setHasAttemptedVerification(true);

    try {
      const result = await verifyUserLocationAndPermissions(user.id);
      
      setLocationVerified(result.allowed);
      if (!result.allowed) {
        setLocationError(result.reason);
      } else {
        setLocationError(null);
      }
    } catch (err) {
      console.error('Location verification error:', err);
      setLocationVerified(false);
      setLocationError('Failed to verify location. Please try again.');
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

  // Polling setup with operation tracking
  useEffect(() => {
    const setupPolling = () => {
      pollTimeoutRef.current = setInterval(() => {
        // Only poll if no operation is in progress
        if (!isOperationInProgress.current) {
          loadData();
        }
      }, POLL_INTERVAL);
    };

    setupPolling();

    return () => {
      if (pollTimeoutRef.current) {
        clearInterval(pollTimeoutRef.current);
      }
    };
  }, []);

  const getNextOrder = () => {
    return queue.length > 0 ? Math.max(...queue.map(item => item.order_position)) + 1 : 1;
  };

  const addQueueEntry = async (player1, player2) => {
    // Check location verification before allowing operations
    if (!locationVerified) {
      const errorMsg = locationError || 'Location verification required to edit the queue';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      isOperationInProgress.current = true;
      setIsMutating(true);
      const orderPosition = getNextOrder();
      const userId = user?.id || null;
      const userName = user?.email || user?.user_metadata?.name || null;
      const newEntry = await queueService.addQueueEntry(player1, player2, orderPosition, userId, userName);
      
      // Auto-start if this is the first entry and no game is currently playing
      if (queue.length === 0 && !nowPlaying) {
        await startGame(newEntry.id, player1, player2);
      }
      
      // Immediately refresh data to show changes
      await loadData();
      
      return newEntry;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      isOperationInProgress.current = false;
      setIsMutating(false);
    }
  };

  const updateQueueEntry = async (id, player1, player2) => {
    // Check location verification before allowing operations
    if (!locationVerified) {
      const errorMsg = locationError || 'Location verification required to edit the queue';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      isOperationInProgress.current = true;
      setIsMutating(true);
      const updatedEntry = await queueService.updateQueueEntry(id, player1, player2);
      
      // Reload data to ensure consistency with database
      await loadData();
      
      return updatedEntry;
    } catch (err) {
      setError(err.message);
      // Reload data on error to sync with database
      await loadData();
      throw err;
    } finally {
      isOperationInProgress.current = false;
      setIsMutating(false);
    }
  };

  const removeQueueEntry = async (id) => {
    // Check location verification before allowing operations
    if (!locationVerified) {
      const errorMsg = locationError || 'Location verification required to edit the queue';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      isOperationInProgress.current = true;
      setIsMutating(true);
      await queueService.removeQueueEntry(id);
      
      const remainingEntries = queue.filter(item => item.id !== id);
      const updates = remainingEntries.map((item, index) => ({
        id: item.id,
        order_position: index + 1
      }));
      
      if (updates.length > 0) {
        await queueService.updateOrderPositions(updates);
      }
      
      await loadData();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      isOperationInProgress.current = false;
      setIsMutating(false);
    }
  };

  const moveUp = async (id) => {
    try {
      isOperationInProgress.current = true;
      setIsMutating(true);
      const index = queue.findIndex(item => item.id === id);
      if (index > 0) {
        const updates = [
          { id: queue[index - 1].id, order_position: queue[index].order_position },
          { id: queue[index].id, order_position: queue[index - 1].order_position }
        ];
        await queueService.updateOrderPositions(updates);
        await loadData();
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      isOperationInProgress.current = false;
      setIsMutating(false);
    }
  };

  const moveDown = async (id) => {
    try {
      isOperationInProgress.current = true;
      setIsMutating(true);
      const index = queue.findIndex(item => item.id === id);
      if (index < queue.length - 1) {
        const updates = [
          { id: queue[index].id, order_position: queue[index + 1].order_position },
          { id: queue[index + 1].id, order_position: queue[index].order_position }
        ];
        await queueService.updateOrderPositions(updates);
        await loadData();
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      isOperationInProgress.current = false;
      setIsMutating(false);
    }
  };

  const clearQueue = async () => {
    try {
      isOperationInProgress.current = true;
      setIsMutating(true);
      await queueService.clearQueue();
      // End current session if one exists
      if (nowPlaying) {
        await sessionService.endCurrentSession();
      }
      await loadData();
    } catch (err) {
      setError(err.message);
      await loadData(); // Reload on error to sync
      throw err;
    } finally {
      isOperationInProgress.current = false;
      setIsMutating(false);
    }
  };

  const startGame = async (queueEntryId, player1, player2) => {
    try {
      isOperationInProgress.current = true;
      setIsMutating(true);
      if (queueEntryId) {
        await queueService.markAsPlaying(queueEntryId);
      }
      
      const userId = user?.id || null;
      const userName = user?.email || user?.user_metadata?.name || null;
      const session = await sessionService.startSession(player1, player2, userId, userName);
      await loadData();
      return session;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      isOperationInProgress.current = false;
      setIsMutating(false);
    }
  };

  const endGame = async () => {
    try {
      isOperationInProgress.current = true;
      setIsMutating(true);
      await sessionService.endCurrentSession();
      
      // Reload data first to get updated queue before starting next game
      await loadData();
      
      const nextEntry = queue.find(entry => entry.status === 'waiting' || !entry.status);
      if (nextEntry) {
        await queueService.markAsPlaying(nextEntry.id);
        const userId = user?.id || null;
        const userName = user?.email || user?.user_metadata?.name || null;
        await sessionService.startSession(nextEntry.player1, nextEntry.player2, userId, userName);
      }
      
      // Final reload to reflect new game state
      await loadData();
    } catch (err) {
      setError(err.message);
      await loadData();
      throw err;
    } finally {
      isOperationInProgress.current = false;
      setIsMutating(false);
    }
  };

  const startNextGame = async () => {
    try {
      isOperationInProgress.current = true;
      setIsMutating(true);
      const nextEntry = queue.find(entry => entry.status === 'waiting' || !entry.status);
      if (nextEntry) {
        await startGame(nextEntry.id, nextEntry.player1, nextEntry.player2);
        await loadData();
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      isOperationInProgress.current = false;
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
    verifyLocation,
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
  };
};