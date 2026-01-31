import { useState, useCallback } from 'react';
import { queueService } from '../services/supabase';
import { useAuth } from './useAuth';
import { useBranch } from './useBranch';
import { useLocationGuard } from './useLocationGuard';
import { ERRORS } from '../constants/queue';

/**
 * Hook for queue CRUD operations
 * @param {Object} options
 * @param {Array} options.queue - Current queue array
 * @param {(queue: Array) => void} options.setQueue - Queue state setter
 * @param {(error: string) => void} options.setError - Error state setter
 * @param {boolean} options.locationVerified - Whether location is verified
 * @param {string|null} options.locationError - Current location error
 * @param {() => Promise<void>} options.refreshData - Function to refresh queue data
 * @param {() => number} options.getNextOrder - Function to get next order position
 * @param {number} options.selectedCabinet - Currently selected cabinet number
 * @returns {Object} Queue action functions and isMutating state
 */
export const useQueueActions = ({
  queue,
  setQueue,
  setError,
  locationVerified,
  locationError,
  refreshData,
  getNextOrder,
  selectedCabinet = 1
}) => {
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const [isMutating, setIsMutating] = useState(false);

  const { requireLocationVerification } = useLocationGuard({
    locationVerified,
    locationError,
    setError
  });

  // Add new queue entry
  const addQueueEntry = useCallback(async (player1, player2) => {
    requireLocationVerification();

    if (!selectedBranch?.id) {
      setError(ERRORS.NO_BRANCH);
      throw new Error(ERRORS.NO_BRANCH);
    }

    try {
      setIsMutating(true);
      const orderPosition = getNextOrder();
      const userId = user?.id || null;
      
      const newEntry = await queueService.addQueueEntry(player1, player2, orderPosition, userId, selectedBranch.id, selectedCabinet);
      setQueue(prev => [...prev, newEntry]); 
      
      return newEntry;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [requireLocationVerification, selectedBranch?.id, setError, getNextOrder, user, setQueue, selectedCabinet]);

  // Update existing queue entry
  const updateQueueEntry = useCallback(async (id, player1, player2) => {
    requireLocationVerification();

    try {
      setIsMutating(true);
      const updatedEntry = await queueService.updateQueueEntry(id, player1, player2);
      
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
  }, [requireLocationVerification, setQueue, setError]);

  // Remove queue entry
  const removeQueueEntry = useCallback(async (id) => {
    requireLocationVerification();

    try {
      setIsMutating(true);
      await queueService.removeQueueEntry(id);
      setQueue(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [requireLocationVerification, setQueue, setError]);

  // Move entry up in queue
  const moveUp = useCallback(async (id) => {
    requireLocationVerification();

    try {
      setIsMutating(true);
      const waitingItems = queue.filter(item => item.status === 'waiting');
      const index = waitingItems.findIndex(item => item.id === id);
      
      if (index > 0) {
        const itemA = waitingItems[index - 1];
        const itemB = waitingItems[index];

        await queueService.updateOrderPositions([
          { id: itemA.id, order_position: itemB.order_position },
          { id: itemB.id, order_position: itemA.order_position }
        ]);

        await refreshData();
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [requireLocationVerification, queue, refreshData, setError]);

  // Move entry down in queue
  const moveDown = useCallback(async (id) => {
    requireLocationVerification();

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
        
        await refreshData();
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [requireLocationVerification, queue, refreshData, setError]);

  // Clear entire queue
  const clearQueue = useCallback(async () => {
    requireLocationVerification();

    try {
      setIsMutating(true);
      if (queue.length > 0) {
        await queueService.clearQueue(selectedBranch.id, selectedCabinet);
        setQueue([]);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [requireLocationVerification, queue.length, selectedBranch?.id, setQueue, setError, selectedCabinet]);

  // End current game and start next
  const endGame = useCallback(async () => {
    try {
      setIsMutating(true);
      
      const currentPlaying = queue.find(item => item.status === 'playing');
      const nextWaiting = queue.find(item => item.status === 'waiting');

      await queueService.finishGame(currentPlaying?.id, nextWaiting?.id);
      await refreshData();

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [queue, refreshData, setError]);

  // Start next game (calls endGame internally)
  const startNextGame = useCallback(async () => {
    return endGame();
  }, [endGame]);

  return {
    isMutating,
    addQueueEntry,
    updateQueueEntry,
    removeQueueEntry,
    moveUp,
    moveDown,
    clearQueue,
    endGame,
    startNextGame
  };
};
