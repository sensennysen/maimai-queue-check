import { useState, useEffect, useRef } from 'react';
import { Stack, Title, Group, Text, Button, Paper, Flex, Badge, Box, LoadingOverlay, Alert, Indicator, Tooltip, Loader, Modal } from '@mantine/core';
import { IconPlayerStop, IconTrash, IconPlus, IconAlertCircle, IconAlertTriangle, IconWifi, IconWifiOff, IconMapPin } from '@tabler/icons-react';
import QueueForm from './QueueForm';
import QueueList from './QueueList';
import PlayTimer from './PlayTimer';
import { useQueueManager } from '../hooks/useQueueManager';
import { useMallSchedule } from '../hooks/useMallSchedule';
import { useAuth } from '../hooks/useAuth';
import { closedMessages } from '../data/subtitleMessages';
import './QueueManager.css';

function QueueManager() {
  const { user, userRoles } = useAuth();
  const {
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
    verifyLocation,
    addQueueEntry: addEntry,
    updateQueueEntry: updateEntry,
    removeQueueEntry,
    moveUp,
    moveDown,
    clearQueue: clearAllQueue,
    endGame,
    startNextGame
  } = useQueueManager();

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [closedMessage, setClosedMessage] = useState(() => 
    closedMessages[Math.floor(Math.random() * closedMessages.length)]
  );

  const canEdit = userRoles?.can_edit;
  const isAdmin = userRoles?.is_admin;
  const canActuallyEdit = isAdmin || (canEdit && locationVerified);

  const { isMallOpen, filterQueueByOperatingHours: filterQueue, loading: scheduleLoading } = useMallSchedule();

  const previousMallStateRef = useRef(isMallOpen);

  useEffect(() => {
    if (previousMallStateRef.current && !isMallOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClosedMessage(closedMessages[Math.floor(Math.random() * closedMessages.length)]);
    }
    previousMallStateRef.current = isMallOpen;
  }, [isMallOpen]);

  // Show location modal only when permission is explicitly needed
  useEffect(() => {
    const shouldShow = user && canEdit && !isAdmin && needsLocationPermission && !locationCheckInProgress;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowLocationModal(prev => {
      if (prev !== shouldShow) {
        return shouldShow;
      }
      return prev;
    });
  }, [user, canEdit, isAdmin, needsLocationPermission, locationCheckInProgress]);

  // Add new queue entry
  const addQueueEntry = async (player1, player2) => {
    try {
      await addEntry(player1, player2);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to add queue entry:', err);
    }
  };

  // Update existing queue entry
  const updateQueueEntry = async (id, player1, player2) => {
    try {
      await updateEntry(id, player1, player2);
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to update queue entry:', err);
    }
  };

  // Clear entire queue
  const clearQueue = async () => {
    if (queue.length > 0 && window.confirm('Are you sure you want to clear the entire queue?')) {
      try {
        await clearAllQueue();
        setEditingId(null);
      } catch (err) {
        console.error('Failed to clear queue:', err);
      }
    }
  };

  // Start editing
  const startEdit = (id) => {
    setEditingId(id);
    setShowForm(true);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
  };

  // Finish current game
  const finishGame = async () => {
    try {
      await endGame();
    } catch (err) {
      console.error('Failed to finish game:', err);
    }
  };

  // Start game from queue
  const startGame = async () => {
    try {
      await startNextGame();
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };

  // Request location permission
  const handleRequestLocation = async () => {
    // Don't close modal, let it stay open during verification
    if (verifyLocation) {
      await verifyLocation();
      // Modal will automatically close via useEffect when locationVerified becomes true
    }
  };

  return (
    <Stack
      gap="md"
      style={{ position: 'relative' }}
      aria-busy={isMutating}
      onKeyDownCapture={(e) => {
        if (isMutating) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <Modal
        opened={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        title="Location Permission Required"
        centered
      >
        <Stack gap="md">
          <Group justify="center">
            <IconMapPin size={48} color="var(--mantine-color-blue-6)" />
          </Group>
          <Text size="sm" ta="center">
            To enable editing the queue, we need to verify your location.
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            You must be within 100 meters of the arcade to edit the queue.
          </Text>
          <Group justify="center" mt="md">
            <Button
              leftSection={<IconMapPin size={16} />}
              onClick={handleRequestLocation}
              loading={locationCheckInProgress}
            >
              Enable Location Services
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowLocationModal(false)}
            >
              Not Now
            </Button>
          </Group>
        </Stack>
      </Modal>
      <LoadingOverlay visible={loading || scheduleLoading || isMutating} />
      {isMutating && (
        <Box className="busy-overlay-message">
          <Loader size="sm" mr={8} />
          <Text size="sm" c="dimmed">Saving…</Text>
        </Box>
      )}
      
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

      {user && canEdit && !isAdmin && !locationVerified && locationError && hasAttemptedVerification && (
        <Alert 
          icon={<IconMapPin size={16} />} 
          title="Location Verification Failed" 
          color="orange"
          variant="light"
          withCloseButton
          onClose={() => {/* User can dismiss but still won't be able to edit */}}
        >
          <Text size="sm" mb="xs">{locationError}</Text>
          <Button 
            size="xs" 
            variant="light" 
            leftSection={<IconMapPin size={14} />}
            onClick={verifyLocation}
            loading={locationCheckInProgress}
          >
            Try Again
          </Button>
        </Alert>
      )}

      <Alert icon={<IconAlertTriangle size={16} />} color="blue" variant="light">
        Info here might not reflect the actual queue in the branch
      </Alert>

      <Paper p="md" withBorder>
        <Group justify="space-between" align="center">
          <Group gap="md">
            <Badge variant="light" size="lg">
              Credits: {(isMallOpen ? filterQueue(queue) : []).reduce((sum, item) => sum + (item.player1?.trim() ? 1 : 0) + (item.player2?.trim() ? 1 : 0), 0)}
            </Badge>
            <Tooltip label={isConnected ? 'Queue should appear live as it is added' : 'Disconnected from database'} withArrow>
              <Indicator 
                color={isConnected ? 'green' : 'red'} 
                size={8}
                processing={!isConnected}
              >
                <Badge 
                  variant="light" 
                  color={isConnected ? 'green' : 'red'}
                  leftSection={isConnected ? <IconWifi size={12} /> : <IconWifiOff size={12} />}
                  style={{ cursor: 'help' }}
                >
                  {isConnected ? 'Live' : 'Offline'}
                </Badge>
              </Indicator>
            </Tooltip>
          </Group>
          <Group gap="sm">
            {user && canActuallyEdit && isMallOpen && !showForm && !editingId && (
              <Button 
                leftSection={<IconPlus size={16} />}
                onClick={() => setShowForm(true)}
                variant="filled"
                disabled={isMutating}
              >
                Add Queue
              </Button>
            )}
            {user && canActuallyEdit && isMallOpen && queue.length > 0 && (
              <Button 
                variant="outline"
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={clearQueue}
                disabled={isMutating}
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
            
            {user && canActuallyEdit && (
              <button 
                className="finish-game-btn"
                onClick={finishGame}
                disabled={isMutating}
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
          isBusy={isMutating}
          locationVerified={locationVerified}
          locationError={locationError}
          isAdmin={userRoles?.is_admin}
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
          isBusy={isMutating}
          locationVerified={locationVerified}
          loading={loading}
        />
      )}
    </Stack>
  );
}

export default QueueManager;