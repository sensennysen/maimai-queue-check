import { useState, useEffect, useCallback } from 'react';
import { queueService, subscribeToQueueChanges, supabase } from '../services/supabase';

import { useAuth } from './useAuth';
import { useBranch } from './useBranch';
import { verifyUserLocationAndPermissions } from '../services/geolocation';

export const useQueueManager = () => {

  const { user, userRoles } = useAuth();
  const { selectedBranch } = useBranch();
  const [queue, setQueue] = useState([]);
  
  // Derived state: nowPlaying is just the item with status='playing'
  const nowPlaying = queue.find(item => item.status === 'playing') || null;
  // Waiting queue (for internal logic, though we might still expose the full list or filtered list)
  const waitingQueue = queue.filter(item => item.status === 'waiting');

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
  const loadInitialData = useCallback(async () => {
    if (!selectedBranch?.id) {
      return;
    }

    try {
      setLoading(true);
      // Fetch everything (playing + waiting) in one go
      const queueData = await queueService.getQueueEntries(selectedBranch.id);
      
      setQueue(queueData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch?.id]);

  // Load initial data when branch changes
  useEffect(() => {
    if (selectedBranch?.id) {
      loadInitialData();
    }
  }, [loadInitialData, selectedBranch?.id]);

  // Function to verify user location and permissions
  const verifyLocation = useCallback(async () => {
    if (!user) {
      setLocationVerified(false);
      setLocationError('Please log in to edit the queue');
      setNeedsLocationPermission(false);
      return;
    }

    if (!selectedBranch?.id) {
      setLocationVerified(false);
      setLocationError('Please select a branch');
      setNeedsLocationPermission(false);
      return;
    }

    setLocationCheckInProgress(true);
    setLocationError(null);
    setHasAttemptedVerification(true);

    try {
      const result = await verifyUserLocationAndPermissions(
        user.id,
        selectedBranch.id,
        userRoles?.is_admin || false
      );
      setLocationVerified(result.allowed);
      setNeedsLocationPermission(result.needsPermission || false);
      if (!result.allowed) {
        setLocationError(result.reason);
      } else {
        setLocationError(null);
      }
    } catch (err) {
      setLocationVerified(false);
      setLocationError('Failed to verify location. Please try again.');
      setNeedsLocationPermission(false);
    } finally {
      setLocationCheckInProgress(false);
    }
  }, [user, selectedBranch?.id, userRoles?.is_admin]);

  // Automatically verify location when user is available and has not attempted verification
  useEffect(() => {
    const checkAndVerifyLocation = async () => {
      // If user is logged in and we haven't checked location yet
      if (user && !hasAttemptedVerification && !locationCheckInProgress) {
        // If they have the editor role, verify their location
        if (userRoles?.can_edit) {
          await verifyLocation();
        }
      }
    };
    
    checkAndVerifyLocation();
  }, [user, userRoles?.can_edit, hasAttemptedVerification, locationCheckInProgress, verifyLocation]);



  // Subscribe to real-time changes
  useEffect(() => {
    if (!selectedBranch?.id) {
      return; // Don't subscribe if no branch selected
    }

    const handleQueueChange = (payload) => {
      // Only process changes for the selected branch
      const newRow = payload.new;
      const oldRow = payload.old;
      
      // Check if the event is for the current branch
      const isRelevantBranch = 
        (newRow && newRow.branch_id === selectedBranch.id) ||
        (oldRow && oldRow.branch_id === selectedBranch.id);
      
      if (isRelevantBranch) {
        // Refresh the whole list (simpler and safer sync)
        queueService.getQueueEntries(selectedBranch.id)
          .then(data => setQueue(data))
          .catch(() => {});
      }
    };

    // We only need one subscription now!
    const queueSubscription = subscribeToQueueChanges(handleQueueChange);

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
      setIsConnected(false);
    };
  }, [selectedBranch?.id]);

  // Test real-time connection
  const testRealTimeConnection = async () => {
    try {
      // Test basic connection
      const { error } = await supabase.from('queue_entries').select('*').limit(1);
      
      if (error) {
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
    // Bypass all checks if admin
    if (!(userRoles?.is_admin || false)) {
      if (!locationVerified) {
        const errorMsg = locationError || 'Location verification required to edit the queue';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    }

    if (!selectedBranch?.id) {
      const errorMsg = 'No branch selected';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      setIsMutating(true);
      const orderPosition = getNextOrder();
      const userId = user?.id || null;
      const userName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || 'Player';
      
      // Logic handled in service: if no playing, it becomes playing.
      const newEntry = await queueService.addQueueEntry(player1, player2, orderPosition, userId, userName, selectedBranch.id);
      
      // Optimistic update? Better to just wait for re-fetch or subscription 
      // but we can append locally if we want instant feedback.
      // However, since status is determined by server logic (count check), better rely on returned data.
      setQueue(prev => [...prev, newEntry]); 
      
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
    if (!(userRoles?.is_admin || false)) {
      if (!locationVerified) {
        const errorMsg = locationError || 'Location verification required to edit the queue';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
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
    if (!(userRoles?.is_admin || false)) {
      if (!locationVerified) {
        const errorMsg = locationError || 'Location verification required to edit the queue';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    }

    try {
      setIsMutating(true);
      await queueService.removeQueueEntry(id);
      
      // Update local state immediately
      const remainingEntries = queue.filter(item => item.id !== id);
      // We might need to handle if the removed item was 'playing' - UI handles it by seeing null nowPlaying
      
      // Re-order if needed? Order positions might have gaps, but that's fine for sorting.
      // If strict 1,2,3... is needed, we should update DB.
      // Keeping it simple: Just remove.
      setQueue(remainingEntries);

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  // Move entry up in queue
  const moveUp = async (id) => {
    // Check location verification before allowing operations
    if (!(userRoles?.is_admin || false)) {
      if (!locationVerified) {
        const errorMsg = locationError || 'Location verification required to edit the queue';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    }

    try {
      setIsMutating(true);
      // We should only swap items that are 'waiting'. Be careful not to swap with 'playing'.
      const waitingItems = queue.filter(item => item.status === 'waiting');
      const index = waitingItems.findIndex(item => item.id === id);
      
      if (index > 0) {
        // Swap logic for waitingItems...
        const itemA = waitingItems[index - 1];
        const itemB = waitingItems[index];

        // Update local state is tricky with mixed status list. 
        // Simpler: Just call DB update and let subscription refresh.
        // Or Optimistic:
        
        await queueService.updateOrderPositions([
          { id: itemA.id, order_position: itemB.order_position },
          { id: itemB.id, order_position: itemA.order_position }
        ]);

        // Trigger reload to be safe and sync
        await loadInitialData();
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  // Move entry down in queue
  const moveDown = async (id) => {
    // Check location verification before allowing operations
    if (!(userRoles?.is_admin || false)) {
      if (!locationVerified) {
        const errorMsg = locationError || 'Location verification required to edit the queue';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    }

    try {
      setIsMutating(true);
      const waitingItems = queue.filter(item => item.status === 'waiting');
      const index = waitingItems.findIndex(item => item.id === id);
      
      if (index < waitingItems.length - 1) {
         const itemA = waitingItems[index];
         const itemB = waitingItems[index + 1];

         await queueService.updateOrderPositions([
          { id: itemA.id, order_position: itemB.order_position },
          { id: itemB.id, order_position: itemA.order_position }
        ]);
        
        await loadInitialData();
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  // Clear entire queue
  const clearQueue = async () => {
    // Allow admins to clear queue without location verification
    if (!(userRoles?.is_admin || false)) {
      if (!locationVerified) {
        const errorMsg = locationError || 'Location verification required to edit the queue';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    }

    try {
      setIsMutating(true);
      if (queue.length > 0) {
        await queueService.clearQueue(selectedBranch.id);
        setQueue([]);
      }
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
      
      const currentPlaying = queue.find(item => item.status === 'playing');
      // Find the first waiting item
      // We trust the order of 'queue' array because it's sorted by order_position
      const nextWaiting = queue.find(item => item.status === 'waiting');

      await queueService.finishGame(currentPlaying?.id, nextWaiting?.id);
      
      // Update local state implicitly via subscription or reload
      // But we can reload explicitly to ensure stability
      await loadInitialData();

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  // Start next game (manual override?) - largely redundant with endGame logic now
  // But maybe used if no one is playing?
  const startNextGame = async () => {
      // Just call endGame, it handles the transitions logic (finish current if exists, start next)
      return endGame();
  };
  
  // Legacy stub - start game directly? 
  // Should ideally just use remove/update/finish logic.
  const startGame = async () => {
       // Not really needed if logic is automatic, but keeping for compatibility
       return startNextGame();
  };


  return {
    queue: waitingQueue, // Return only waiting items for the list view
    nowPlaying, // Return the playing item
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