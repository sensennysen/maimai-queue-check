import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Stack, Title, Group, Text, Button, Paper, Flex, Badge, Alert, Modal, Skeleton, LoadingOverlay, TextInput } from '@mantine/core';
import { useOs } from '@mantine/hooks';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import IconPlus from '@tabler/icons-react/dist/esm/icons/IconPlus.mjs';
import IconAlertCircle from '@tabler/icons-react/dist/esm/icons/IconAlertCircle.mjs';
import IconAlertTriangle from '@tabler/icons-react/dist/esm/icons/IconAlertTriangle.mjs';
import IconMapPin from '@tabler/icons-react/dist/esm/icons/IconMapPin.mjs';
import IconExternalLink from '@tabler/icons-react/dist/esm/icons/IconExternalLink.mjs';
import IconFileText from '@tabler/icons-react/dist/esm/icons/IconFileText.mjs';
const QueueForm = lazy(() => import('./QueueForm'));
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
import { notifications } from '@mantine/notifications';
import { requestService, userService } from '../../../services/supabase';
import AccessRequestModal from '../../../components/modals/AccessRequestModal';
import QueueRulesModal from './QueueRulesModal';
import QueueLogsModal from './QueueLogsModal';
import './QueueManager.css';


/**
 * The primary container for the entire queue management feature.
 * Coordinates data fetching, mutations, location verification, and all child UI components.
 * @returns {JSX.Element} The complete queue management interface.
 */
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
  const [queueName, setQueueName] = useState('');
  const [queueNameOriginal, setQueueNameOriginal] = useState('');
  const [queueNameLoading, setQueueNameLoading] = useState(false);
  const [queueNameSaving, setQueueNameSaving] = useState(false);
  const [queueNameModalOpen, setQueueNameModalOpen] = useState(false);

  useEffect(() => {
    if (!queueLoading && !authLoading) {
      setTimeout(() => setActionsLoaded(true), 0);
    }
  }, [queueLoading, authLoading]);

  useEffect(() => {
    if (!user?.id) {
      setQueueName('');
      setQueueNameOriginal('');
      return;
    }

    let isActive = true;
    setQueueNameLoading(true);
    userService.getOwnProfile(user.id)
      .then((profile) => {
        if (!isActive) return;
        const name = profile?.user_roles?.queue_name || '';
        setQueueName(name);
        setQueueNameOriginal(name);
      })
      .catch(console.error)
      .finally(() => {
        if (isActive) setQueueNameLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [user?.id]);

  const handleSaveQueueName = async () => {
    if (!user) return;
    setQueueNameSaving(true);
    try {
      await userService.updatePreferences(user.id, { queue_name: queueName.trim() || null });
      setQueueNameOriginal(queueName.trim());
      notifications.show({ title: 'Saved', message: 'Queue name updated', color: 'green' });
    } catch (e) {
      notifications.show({ title: 'Error', message: e.message || 'Failed to save', color: 'red' });
    } finally {
      setQueueNameSaving(false);
    }
  };

  // UI state
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showLocationHelp, setShowLocationHelp] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);

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
          const isPending = await requestService.hasPendingRequest(user.id, selectedBranch.id);
          setHasPendingRequest(isPending);
        } catch (error) {
          console.error("Failed to check requests", error);
        }
      } else {
        setHasPendingRequest(false);
      }
    };
    checkPendingRequest();
  }, [user, selectedBranch, showRequestModal]);

  // Derived permissions
  const { canActuallyEdit, canEdit, isAdmin, isSuperAdmin } = usePermissions();

  const { isMallOpen, filterQueueByOperatingHours: filterQueue, loading: scheduleLoading } = useMallSchedule(selectedBranch?.id);

  const previousMallStateRef = useRef(isMallOpen);

  const isQueueDataLoading = queueLoading || isMutating;

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
      aria-busy={isQueueDataLoading}
      onKeyDownCapture={(e) => {
        if (isQueueDataLoading) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <LoadingOverlay
        visible={isQueueDataLoading}
        zIndex={190}
        overlayProps={{ blur: 2 }}
      />
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

      {user && (
        <>
          <Group justify="flex-end" align="center" wrap="wrap" gap="md">
            <Button
              onClick={() => setQueueNameModalOpen(true)}
              loading={queueNameLoading}
              size="sm"
            >
              Change your queue name
            </Button>
          </Group>

          <Modal
            opened={queueNameModalOpen}
            onClose={() => setQueueNameModalOpen(false)}
            title={<Text fw={600}>Change Queue Name</Text>}
            centered
            size="sm"
          >
            <Stack gap="md">
              <Text size="xs" c="dimmed">Name shown in queue autocomplete (max 10 chars)</Text>
              <TextInput
                placeholder="Your queue name"
                value={queueName}
                onChange={(e) => setQueueName(e.currentTarget.value.slice(0, 10))}
                maxLength={10}
                disabled={queueNameLoading}
              />
              <Group justify="flex-end">
                <Button variant="default" onClick={() => setQueueNameModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await handleSaveQueueName();
                    setQueueNameModalOpen(false);
                  }}
                  loading={queueNameSaving}
                  disabled={queueNameLoading || queueName.trim() === queueNameOriginal}
                >
                  Save
                </Button>
              </Group>
            </Stack>
          </Modal>
        </>
      )}

      {/* Cabinet Tabs - Only show when there are multiple cabinets */}
      {hasMultipleCabinets && (
        <Group gap="sm" mb="md" className="cabinet-toggles">
          {Array.from({ length: cabinetCount }, (_, i) => i + 1).map((cabNum) => {
            const isActive = selectedCabinet === cabNum;
            return (
              <Button
                key={cabNum}
                variant={isActive ? "filled" : "light"}
                color={isActive ? "primary" : "gray"}
                onClick={() => setSelectedCabinet(cabNum)}
                className={`cabinet-toggle-btn ${isActive ? 'is-active' : ''}`}
                size="md"
                radius="xl"
              >
                Cabinet {cabNum}
              </Button>
            );
          })}
        </Group>
      )}

      {/* Add/Edit Queue Form Modal */}
      <Modal
        opened={user && !scheduleLoading && isMallOpen && (showForm || editingId)}
        onClose={cancelEdit}
        title={editingId ? 'Edit Queue' : 'Add Queue'}
        centered
      >
        <Suspense fallback={<Skeleton height={400} />}>
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
        </Suspense>
      </Modal>

      <AccessRequestModal
        opened={showRequestModal}
        onClose={() => setShowRequestModal(false)}
      />

      <QueueRulesModal
        opened={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        branchId={selectedBranch?.id}
      />

      <QueueLogsModal
        opened={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        branchId={selectedBranch?.id}
      />

      {/* Header with credits and actions */}
      <div>
        {queueLoading || scheduleLoading ? (
          <Group justify="space-between" align="center">
            <Skeleton height={40} width={120} radius="md" />
            <Text size="sm" c="secondary" fw={500} italic>{loadingMessage}</Text>
          </Group>
        ) : (
          <Group justify="space-between" align="center">
            <Group gap="md">
              <Badge variant="light" size="lg">
                Credits: {(isMallOpen ? filterQueue(queue) : []).reduce((sum, item) => sum + (item.player1?.trim() ? 1 : 0) + (item.player2?.trim() ? 1 : 0), 0)}
              </Badge>
              <Button
                variant="subtle"
                size="compact-xs"
                leftSection={<IconFileText size={14} />}
                onClick={() => setShowRulesModal(true)}
                color="blue"
              >
                Queue Rules
              </Button>
              {(canEdit || isAdmin || isSuperAdmin) && (
                <Button
                  variant="subtle"
                  size="compact-xs"
                  onClick={() => setShowLogsModal(true)}
                >
                  Recent Logs
                </Button>
              )}
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
                  disabled={isQueueDataLoading}
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
                  Request Pending
                </Button>
              )}
              {user && canActuallyEdit && isMallOpen && queue.length > 0 && (
                <Button
                  variant="outline"
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  onClick={clearQueue}
                  disabled={isQueueDataLoading}
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
            isBusy={isQueueDataLoading}
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
            isBusy={isQueueDataLoading}
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
