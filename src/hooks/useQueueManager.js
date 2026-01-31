import { supabase } from '../services/supabase';
import { useQueueData } from './useQueueData';
import { useQueueActions } from './useQueueActions';
import { useLocationVerification } from './useLocationVerification';

/**
 * Main queue manager hook - composes smaller hooks for queue functionality
 * Maintains backwards compatibility with existing API
 */
export const useQueueManager = () => {
  // Data layer: fetching, subscriptions, state
  const {
    queue,
    waitingQueue,
    nowPlaying,
    loading,
    error,
    isConnected,
    setQueue,
    setError,
    getNextOrder,
    refreshData
  } = useQueueData();

  // Location verification
  const {
    locationVerified,
    locationError,
    locationCheckInProgress,
    hasAttemptedVerification,
    needsLocationPermission,
    verifyLocation
  } = useLocationVerification();

  // Actions layer: CRUD operations
  const {
    isMutating,
    addQueueEntry,
    updateQueueEntry,
    removeQueueEntry,
    moveUp,
    moveDown,
    clearQueue,
    endGame,
    startNextGame
  } = useQueueActions({
    queue,
    setQueue,
    setError,
    locationVerified,
    locationError,
    refreshData,
    getNextOrder
  });

  // Test real-time connection
  const testRealTimeConnection = async () => {
    try {
      const { error } = await supabase.from('queue_entries').select('*').limit(1);
      
      if (error) {
        return false;
      }
      
      const testChannel = supabase
        .channel('test_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries' }, 
          () => {})
        .subscribe(() => {});
      
      setTimeout(() => {
        supabase.removeChannel(testChannel);
      }, 5000);
      
      return true;
    } catch {
      return false;
    }
  };

  return {
    // Data
    queue: waitingQueue,
    nowPlaying,
    loading,
    error,
    isConnected,
    isMutating,
    
    // Location state
    locationVerified,
    locationError,
    locationCheckInProgress,
    hasAttemptedVerification,
    needsLocationPermission,
    
    // Actions
    addQueueEntry,
    updateQueueEntry,
    removeQueueEntry,
    moveUp,
    moveDown,
    clearQueue,
    endGame,
    startNextGame,
    
    // Utilities
    getNextOrder,
    refreshData,
    testRealTimeConnection,
    verifyLocation
  };
};