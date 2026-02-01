import { useState, useEffect, useRef } from 'react';
import { Stack, Title, Group, Text, Button, Paper, Flex, Badge, Box, Alert, Loader, Modal, Skeleton, Tabs } from '@mantine/core';
import { IconTrash, IconPlus, IconAlertCircle, IconAlertTriangle, IconMapPin } from '@tabler/icons-react';
import QueueForm from './QueueForm';
import QueueList from './QueueList';
import LocationPermissionModal from './LocationPermissionModal';
import NowPlayingCard from './NowPlayingCard';
import { useQueueManager } from '../hooks/useQueueManager';
import { useMallSchedule } from '../hooks/useMallSchedule';
import { useBranch } from '../hooks/useBranch';
import { useAuth } from '../hooks/useAuth';
import { closedMessages, loadingMessages } from '../data/subtitleMessages';
import './QueueManager.css';


function QueueManager() {
  const { selectedBranch } = useBranch();

  // Queue data and actions
  const {
    queue,
    nowPlaying,
    loading: queueLoading,
    error,
    isMutating,
    locationVerified,
    locationError,
    locationCheckInProgress,
    hasAttemptedVerification,
    // Consent flow
    showConsentModal,
    geolocationConsent,
    handleConsentAccepted,
    handleConsentDeclined,
    verifyLocation,
    addQueueEntry: addEntry,
    updateQueueEntry: updateEntry,
    removeQueueEntry,
    moveUp,
    moveDown,
    clearQueue: clearAllQueue,
    endGame,
    startNextGame,
    selectedCabinet,
    setSelectedCabinet,
    cabinetCount,
    hasMultipleCabinets
  } = useQueueManager();

  // Auth and roles
  const [actionsLoaded, setActionsLoaded] = useState(false);
  const { user, userRoles, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!queueLoading && !authLoading) {
      setTimeout(() => setActionsLoaded(true), 0);
    }
  }, [queueLoading, authLoading]);

  // UI state
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [closedMessage, setClosedMessage] = useState(() =>
    closedMessages[Math.floor(Math.random() * closedMessages.length)]
  );

  // Derived permissions
  const canEdit = userRoles?.can_edit;
  const isAdmin = userRoles?.is_admin;
  const canActuallyEdit = isAdmin || (canEdit && locationVerified);

  const { isMallOpen, filterQueueByOperatingHours: filterQueue, loading: scheduleLoading } = useMallSchedule(selectedBranch?.id);

  const previousMallStateRef = useRef(isMallOpen);

  useEffect(() => {
    if (previousMallStateRef.current && !isMallOpen) {
      setTimeout(() => setClosedMessage(closedMessages[Math.floor(Math.random() * closedMessages.length)]), 0);
    }
    previousMallStateRef.current = isMallOpen;
  }, [isMallOpen]);

  // Action handlers
  const addQueueEntry = async (player1, player2) => {
    try {
      await addEntry(player1, player2);
      setShowForm(false);
    } catch {
      // Error handled by hook
    }
  };

  const updateQueueEntry = async (id, player1, player2) => {
    try {
      await updateEntry(id, player1, player2);
      setEditingId(null);
      setShowForm(false);
    } catch {
      // Error handled by hook
    }
  };

  const clearQueue = async () => {
    if (queue.length > 0 && window.confirm('Are you sure you want to clear the entire queue?')) {
      try {
        await clearAllQueue();
        setEditingId(null);
      } catch {
        // Error handled by hook
      }
    }
  };

  const startEdit = (id) => {
    setEditingId(id);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
  };

  const finishGame = async () => {
    try {
      await endGame();
    } catch {
      // Error handled by hook
    }
  };

  const startGame = async () => {
    try {
      await startNextGame();
    } catch {
      // Error handled by hook
    }
  };


  const [loadingMessage] = useState(() => loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);

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
      {/* Location Permission Modal - shown based on consent flow */}
      <LocationPermissionModal
        opened={showConsentModal}
        onClose={handleConsentDeclined}
        onRequestLocation={handleConsentAccepted}
        onDecline={handleConsentDeclined}
        loading={locationCheckInProgress}
      />

      {/* Busy overlay */}
      {isMutating && (
        <Box className="busy-overlay-message">
          <Loader size="sm" mr={8} />
          <Text size="sm" c="dimmed">Saving…</Text>
        </Box>
      )}

      {/* Error alert */}
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

      {/* Location verification failed alert */}
      {user && canEdit && !isAdmin && !locationVerified && locationError && hasAttemptedVerification && (
        <Alert
          icon={<IconMapPin size={16} />}
          title={geolocationConsent === 'denied' ? 'Location Features Disabled' : 'Location Verification Failed'}
          color="orange"
          variant="light"
          withCloseButton
          onClose={() => { }}
        >
          <Text size="sm" mb="xs">{locationError}</Text>
          {geolocationConsent !== 'denied' && (
            <Button
              size="xs"
              variant="light"
              leftSection={<IconMapPin size={14} />}
              onClick={verifyLocation}
              loading={locationCheckInProgress}
            >
              Try Again
            </Button>
          )}
        </Alert>
      )}

      {/* Info alert */}
      <Alert icon={<IconAlertTriangle size={16} />} color="blue" variant="light">
        Info here might not reflect the actual queue in the branch
      </Alert>

      {/* Cabinet Tabs - Only show when there are multiple cabinets */}
      {hasMultipleCabinets && (
        <Tabs value={String(selectedCabinet)} onChange={(value) => setSelectedCabinet(Number(value))}>
          <Tabs.List>
            {Array.from({ length: cabinetCount }, (_, i) => i + 1).map((cabNum) => (
              <Tabs.Tab key={cabNum} value={String(cabNum)}>
                Cabinet {cabNum}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>
      )}

      {/* Add/Edit Queue Form Modal */}
      <Modal
        opened={user && !scheduleLoading && isMallOpen && (showForm || editingId)}
        onClose={cancelEdit}
        title={editingId ? 'Edit Queue' : 'Add Queue'}
        centered
      >
        <QueueForm
          key={editingId || 'new'}
          onSubmit={editingId ? updateQueueEntry : addQueueEntry}
          editingId={editingId}
          editingData={editingId ? queue.find(item => item.id === editingId) : null}
          isBusy={isMutating}
          locationVerified={locationVerified}
          locationError={locationError}
          isAdmin={userRoles?.is_admin}
        />
      </Modal>

      {/* Header with credits and actions */}
      <div>
        {queueLoading || scheduleLoading ? (
          <Group justify="space-between" align="center">
            <Skeleton height={40} width={120} radius="md" />
            <Text size="sm" c="dimmed" italic>{loadingMessage}</Text>
          </Group>
        ) : (
          <Group justify="space-between" align="center">
            <Group gap="md">
              <Badge variant="light" size="lg">
                Credits: {(isMallOpen ? filterQueue(queue) : []).reduce((sum, item) => sum + (item.player1?.trim() ? 1 : 0) + (item.player2?.trim() ? 1 : 0), 0)}
              </Badge>
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
        )}
      </div>

      {/* Now Playing Section */}
      {queueLoading || scheduleLoading ? (
        <Skeleton height={120} radius="md" />
      ) : (
        isMallOpen && (
          <NowPlayingCard
            nowPlaying={nowPlaying}
            canActuallyEdit={canActuallyEdit}
            isBusy={isMutating}
            onFinishGame={finishGame}
            isLoggedIn={!!user}
          />
        )
      )}

      {/* Closed message */}
      {!scheduleLoading && !isMallOpen && (
        <Paper p="xl" withBorder>
          <Flex align="center" justify="center" style={{ height: 200 }}>
            <Title order={2}>{closedMessage}</Title>
          </Flex>
        </Paper>
      )}

      {/* Queue List */}
      {queueLoading || scheduleLoading ? (
        <Stack>
          <Skeleton height={60} radius="md" />
          <Skeleton height={60} radius="md" />
          <Skeleton height={60} radius="md" />
        </Stack>
      ) : (
        isMallOpen && (
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
            loadingRoles={!actionsLoaded}
            cabinetNum={selectedCabinet}
            hasMultipleCabinets={hasMultipleCabinets}
          />
        )
      )}
    </Stack>
  );
}

export default QueueManager;