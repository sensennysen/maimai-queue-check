import { useState, useEffect, useRef, useCallback } from 'react';
import { Stack, Title, Group, Text, Button, Paper, Flex, Badge, Box, Alert, Loader, Modal, Skeleton, Tabs } from '@mantine/core';
import { useOs } from '@mantine/hooks';
import { IconTrash, IconPlus, IconAlertCircle, IconAlertTriangle, IconMapPin, IconExternalLink } from '@tabler/icons-react';
import QueueForm from './QueueForm';
import QueueList from './QueueList';
import LocationPermissionModal from '../../../components/modals/LocationPermissionModal';
import LocationHelpModal from '../../../components/modals/LocationHelpModal';
import NowPlayingCard from './NowPlayingCard';
import { useQueueManager } from '../../../hooks/useQueueManager';
import { useMallSchedule } from '../../../hooks/useMallSchedule';
import { usePageVisibility } from '../../../hooks/usePageVisibility';
import { useBranch } from '../../../hooks/useBranch';
import { useAuth } from '../../../hooks/useAuth';
import { closedMessages, loadingMessages } from '../../../data/subtitleMessages';
import { usePermissions } from '../../../hooks/usePermissions';
import { requestService } from '../../../services/supabase';
import AccessRequestModal from '../../../components/modals/AccessRequestModal';
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
    refreshData,
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

  // Refresh data when tab becomes active (mobile only)
  const os = useOs();
  const isMobile = os === 'ios' || os === 'android';

  const handleVisibilityChange = useCallback(() => {
    if (isMobile) {
      refreshData();
    }
  }, [isMobile, refreshData]);

  usePageVisibility(handleVisibilityChange);

  // Auth and roles
  const [actionsLoaded, setActionsLoaded] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!queueLoading && !authLoading) {
      setTimeout(() => setActionsLoaded(true), 0);
    }
  }, [queueLoading, authLoading]);

  // UI state
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showLocationHelp, setShowLocationHelp] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Animation state
  const [addedIds, setAddedIds] = useState(new Set());
  const [movedIds, setMovedIds] = useState(new Set());
  const [removingId, setRemovingId] = useState(null);
  const [nowPlayingUpdated, setNowPlayingUpdated] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [closedMessage, setClosedMessage] = useState(() =>
    closedMessages[Math.floor(Math.random() * closedMessages.length)]
  );

  // Check for pending requests
  useEffect(() => {
    const checkPendingRequest = async () => {
      if (user && selectedBranch) {
        try {
          // Optimize: could make a specific check function, but fetching all user requests is fine for now
          const requests = await requestService.getUserRequests(user.id);
          const isPending = requests.some(r => r.branch_id === selectedBranch.id && r.status === 'pending');
          setHasPendingRequest(isPending);
        } catch (error) {
          console.error("Failed to check requests", error);
        }
      } else {
        setHasPendingRequest(false);
      }
    };
    checkPendingRequest();
  }, [user, selectedBranch, showRequestModal]); // Re-check when modal closes (implicit via showRequestModal if needed, or trigger reload)

  // Derived permissions
  const { canActuallyEdit, canEdit, isAdmin, isSuperAdmin } = usePermissions();

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
      const newEntry = await addEntry(player1, player2);
      setShowForm(false);
      // Trigger added animation
      if (newEntry?.id) {
        setAddedIds(new Set([newEntry.id]));
        setTimeout(() => setAddedIds(new Set()), 700);
      }
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
      // Trigger now-playing pulse
      setNowPlayingUpdated(true);
      setTimeout(() => setNowPlayingUpdated(false), 700);
    } catch {
      // Error handled by hook
    }
  };

  const startGame = async () => {
    try {
      await startNextGame();
      // Trigger now-playing pulse
      setNowPlayingUpdated(true);
      setTimeout(() => setNowPlayingUpdated(false), 700);
    } catch {
      // Error handled by hook
    }
  };


  // Animation wrappers
  const handleRemoveWithAnimation = async (id) => {
    setRemovingId(id);
    // Wait for exit animation to play
    await new Promise(resolve => setTimeout(resolve, 400));
    try {
      await removeQueueEntry(id);
    } finally {
      setRemovingId(null);
    }
  };

  const handleMoveUpWithAnimation = async (id) => {
    try {
      // Find the item being moved and the one above it
      const waitingItems = filterQueue(queue);
      const index = waitingItems.findIndex(item => item.id === id);
      const swappedId = index > 0 ? waitingItems[index - 1].id : null;

      await moveUp(id);

      // Highlight both swapped items
      const ids = new Set([id]);
      if (swappedId) ids.add(swappedId);
      setMovedIds(ids);
      setTimeout(() => setMovedIds(new Set()), 600);
    } catch {
      // Error handled by hook
    }
  };

  const handleMoveDownWithAnimation = async (id) => {
    try {
      // Find the item being moved and the one below it
      const waitingItems = filterQueue(queue);
      const index = waitingItems.findIndex(item => item.id === id);
      const swappedId = index < waitingItems.length - 1 ? waitingItems[index + 1].id : null;

      await moveDown(id);

      // Highlight both swapped items
      const ids = new Set([id]);
      if (swappedId) ids.add(swappedId);
      setMovedIds(ids);
      setTimeout(() => setMovedIds(new Set()), 600);
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

      {/* Location Help Modal - shown when user needs to enable in browser settings */}
      <LocationHelpModal
        opened={showLocationHelp}
        onClose={() => setShowLocationHelp(false)}
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
      {user && (canEdit || isAdmin) && !isSuperAdmin && !locationVerified && locationError && hasAttemptedVerification && (
        geolocationConsent === 'denied' ? (
          <Alert color="orange" variant="light">
            <Group justify="space-between" align="center">
              <Text size="sm">{locationError}</Text>
              <Button
                size="xs"
                variant="light"
                onClick={() => setShowLocationHelp(true)}
              >
                How to Enable
              </Button>
            </Group>
          </Alert>
        ) : (
          <Alert
            icon={<IconMapPin size={16} />}
            title="Location Verification Failed"
            color="orange"
            variant="light"
            withCloseButton
            onClose={() => { }}
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
        )
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
          isSuperAdmin={isSuperAdmin}
          queue={queue}
          nowPlaying={nowPlaying}
        />
      </Modal>

      <AccessRequestModal
        opened={showRequestModal}
        onClose={() => setShowRequestModal(false)}
      />

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
              {user && (
                <Button
                  variant="default"
                  leftSection={<IconExternalLink size={16} />}
                  onClick={() => window.open('/view', '_blank')}
                >
                  View Mode
                </Button>
              )}
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
              {user && !canEdit && !isAdmin && !hasPendingRequest && (
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => setShowRequestModal(true)}
                >
                  Request Queue Edit Access
                </Button>
              )}
              {user && !canEdit && !isAdmin && hasPendingRequest && (
                <Button variant="subtle" size="sm" disabled>
                  Request Pending use
                </Button>
              )}
              {user && canActuallyEdit && isMallOpen && queue.length > 0 && (
                <Button
                  variant="outline"
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  onClick={clearQueue}
                  loading={isMutating}
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
            justUpdated={nowPlayingUpdated}
          />
        )
      )}

      {/* Closed message */}
      {!queueLoading && !scheduleLoading && !isMallOpen && (
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
            onRemove={handleRemoveWithAnimation}
            onMoveUp={handleMoveUpWithAnimation}
            onMoveDown={handleMoveDownWithAnimation}
            onStartGame={startGame}
            isMallOpen={isMallOpen}
            isBusy={isMutating}
            loadingRoles={!actionsLoaded}
            cabinetNum={selectedCabinet}
            hasMultipleCabinets={hasMultipleCabinets}
            addedIds={addedIds}
            movedIds={movedIds}
            removingId={removingId}
          />
        )
      )}
    </Stack>
  );
}

export default QueueManager;