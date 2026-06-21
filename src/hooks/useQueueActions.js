import { useState, useCallback, useRef } from 'react';
import { queueService } from '../services/supabase';
import { useAuth } from './useAuth';
import { useBranch } from './useBranch';
import { useLocationGuard } from './useLocationGuard';
import { ERRORS } from '../constants/queue';

/**
 * Hook that provides complex CRUD operations and state management for queue entries.
 * Orchestrates location guards and service layer calls for adding, updating, and moving players.
 * @param {Object} options - Action configuration options.
 * @param {Array<Object>} options.queue - The current list of queue entries.
 * @param {Function} options.setQueue - State setter for the queue array.
 * @param {Function} options.setError - State setter for error messages.
 * @param {boolean} options.locationVerified - Current location verification status.
 * @param {string|null} options.locationError - Current location error message.
 * @param {Function} options.refreshData - Stable callback to trigger a full queue data reload.
 * @param {Function} options.getNextOrder - Helper function to calculate the next available order position.
 * @param {number} [options.selectedCabinet=1] - The cabinet number these actions apply to.
 * @returns {Object} An object containing all queue action functions and the `isMutating` state.
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
  const queueRef = useRef(queue);
  queueRef.current = queue;

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
      const waitingItems = queueRef.current.filter((item) => item.status === 'waiting');
      const index = waitingItems.findIndex((item) => item.id === id);

      if (index > 0) {
        const itemA = waitingItems[index - 1];
        const itemB = waitingItems[index];

        // Optimistic UI update: swap order positions in local state for instant feedback
        setQueue((prev) => {
          const newQueue = [...prev];
          const idxA = newQueue.findIndex((i) => i.id === itemA.id);
          const idxB = newQueue.findIndex((i) => i.id === itemB.id);

          if (idxA !== -1 && idxB !== -1) {
            const posA = newQueue[idxA].order_position;
            const posB = newQueue[idxB].order_position;
            newQueue[idxA] = { ...newQueue[idxA], order_position: posB };
            newQueue[idxB] = { ...newQueue[idxB], order_position: posA };
            return newQueue.sort((a, b) => a.order_position - b.order_position);
          }
          return prev;
        });

        // Perform the actual database update in the background
        await queueService.updateOrderPositions([
          { id: itemA.id, order_position: itemB.order_position },
          { id: itemB.id, order_position: itemA.order_position }
        ]);
      }
    } catch (err) {
      setError(err.message);
      // Revert to server state on error
      await refreshData();
      throw err;
    }
  }, [requireLocationVerification, setQueue, refreshData, setError]);

  // Move entry down in queue
  const moveDown = useCallback(async (id) => {
    requireLocationVerification();

    try {
      const waitingItems = queueRef.current.filter((item) => item.status === 'waiting');
      const index = waitingItems.findIndex((item) => item.id === id);

      if (index < waitingItems.length - 1) {
        const itemA = waitingItems[index];
        const itemB = waitingItems[index + 1];

        // Optimistic UI update: swap order positions in local state for instant feedback
        setQueue((prev) => {
          const newQueue = [...prev];
          const idxA = newQueue.findIndex((i) => i.id === itemA.id);
          const idxB = newQueue.findIndex((i) => i.id === itemB.id);

          if (idxA !== -1 && idxB !== -1) {
            const posA = newQueue[idxA].order_position;
            const posB = newQueue[idxB].order_position;
            newQueue[idxA] = { ...newQueue[idxA], order_position: posB };
            newQueue[idxB] = { ...newQueue[idxB], order_position: posA };
            return newQueue.sort((a, b) => a.order_position - b.order_position);
          }
          return prev;
        });

        // Perform the actual database update in the background
        await queueService.updateOrderPositions([
          { id: itemA.id, order_position: itemB.order_position },
          { id: itemB.id, order_position: itemA.order_position }
        ]);
      }
    } catch (err) {
      setError(err.message);
      // Revert to server state on error
      await refreshData();
      throw err;
    }
  }, [requireLocationVerification, setQueue, refreshData, setError]);

  // Clear entire queue
  const clearQueue = useCallback(async () => {
    requireLocationVerification();

    try {
      setIsMutating(true);
      if (queueRef.current.length > 0) {
        await queueService.clearQueue(selectedBranch.id, selectedCabinet);
        setQueue([]);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [requireLocationVerification, selectedBranch?.id, setQueue, setError, selectedCabinet]);

  // End current game and start next
  const endGame = useCallback(async () => {
    try {
      setIsMutating(true);
      
      const currentPlaying = queueRef.current.find(item => item.status === 'playing');
      const nextWaiting = queueRef.current.find(item => item.status === 'waiting');

      await queueService.finishGame(currentPlaying?.id, nextWaiting?.id);
      await refreshData();

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [refreshData, setError]);

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
