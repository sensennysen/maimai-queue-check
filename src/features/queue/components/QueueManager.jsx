import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { Stack, Title, Group, Text, Button, Paper, Flex, Alert, Modal, Skeleton, TextInput, Box, UnstyledButton } from '@mantine/core';
import IconTrash from '@tabler/icons-react/dist/esm/icons/IconTrash.mjs';
import IconPlus from '@tabler/icons-react/dist/esm/icons/IconPlus.mjs';
import IconEdit from '@tabler/icons-react/dist/esm/icons/IconEdit.mjs';
import IconCheck from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconAlertCircle from '@tabler/icons-react/dist/esm/icons/IconAlertCircle.mjs';
import IconAlertTriangle from '@tabler/icons-react/dist/esm/icons/IconAlertTriangle.mjs';
import IconMapPin from '@tabler/icons-react/dist/esm/icons/IconMapPin.mjs';
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
import { closedMessages } from '../../../data/subtitleMessages';
import { usePermissions } from '../../../hooks/usePermissions';
import { notifications } from '@mantine/notifications';
import { requestService, userService } from '../../../services/supabase';
import AccessRequestModal from '../../../components/modals/AccessRequestModal';
import DeleteConfirmDialog from '../../../components/modals/DeleteConfirmDialog';
import QueueRulesModal from './QueueRulesModal';
import QueueLogsModal from './QueueLogsModal';
import BranchSelector from '../../../components/layout/BranchSelector';
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

  const handleVisibilityChange = useCallback(() => {
    refreshData();
  }, [refreshData]);

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
  const [clearQueueConfirmOpen, setClearQueueConfirmOpen] = useState(false);
  const [pendingRemovalId, setPendingRemovalId] = useState(null);

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
  const addQueueEntry = useCallback(async (player1, player2) => {
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
  }, [addEntry]);

  const updateQueueEntry = useCallback(async (id, player1, player2) => {
    try {
      await updateEntry(id, player1, player2);
      setEditingId(null);
      setShowForm(false);
    } catch {
      // Error handled by hook
    }
  }, [updateEntry]);

  const clearQueue = useCallback(async () => {
    try {
      await clearAllQueue();
      setEditingId(null);
      setClearQueueConfirmOpen(false);
    } catch {
      // Error handled by hook
    }
  }, [clearAllQueue]);

  const startEdit = useCallback((id) => {
    setEditingId(id);
    setShowForm(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setShowForm(false);
  }, []);

  const finishGame = useCallback(async () => {
    try {
      await endGame();
      // Trigger now-playing pulse
      setNowPlayingUpdated(true);
      setTimeout(() => setNowPlayingUpdated(false), 700);
    } catch {
      // Error handled by hook
    }
  }, [endGame]);

  const startGame = useCallback(async () => {
    try {
      await startNextGame();
      // Trigger now-playing pulse
      setNowPlayingUpdated(true);
      setTimeout(() => setNowPlayingUpdated(false), 700);
    } catch {
      // Error handled by hook
    }
  }, [startNextGame]);

  const visibleQueue = useMemo(
    () => (isMallOpen ? filterQueue(queue) : []),
    [filterQueue, isMallOpen, queue]
  );
  const visibleQueueRef = useRef(visibleQueue);
  visibleQueueRef.current = visibleQueue;

  // Animation wrappers
  const handleRemoveWithAnimation = useCallback(async (id) => {
    setRemovingId(id);
    // Wait for exit animation to play
    await new Promise(resolve => setTimeout(resolve, 400));
    try {
      await removeQueueEntry(id);
    } finally {
      setRemovingId(null);
    }
  }, [removeQueueEntry]);

  const handleMoveUpWithAnimation = useCallback(async (id) => {
    try {
      // Find the item being moved and the one above it
      const waitingItems = visibleQueueRef.current;
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
  }, [moveUp]);

  const handleMoveDownWithAnimation = useCallback(async (id) => {
    try {
      // Find the item being moved and the one below it
      const waitingItems = visibleQueueRef.current;
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
  }, [moveDown]);

  return (
    <Stack
      gap="md"
      className="queue-manager-root"
      style={{ position: 'relative' }}
      aria-busy={isQueueDataLoading}
      onKeyDownCapture={(e) => {
        if (isQueueDataLoading) {
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

      <header className="queue-page-header">
        <div className="queue-page-branch-desktop">
          <BranchSelector />
        </div>
        <div className="queue-page-actions">
          {user && (
            <Button
              onClick={() => setQueueNameModalOpen(true)}
              loading={queueNameLoading}
              size="sm"
              variant="outline"
            >
              Edit Your Queue Name
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            leftSection={<IconFileText size={14} />}
            onClick={() => setShowRulesModal(true)}
          >
            Rules
          </Button>
          {(canEdit || isAdmin || isSuperAdmin) && (
            <Button variant="outline" size="sm" onClick={() => setShowLogsModal(true)}>
              Logs
            </Button>
          )}
        </div>
      </header>

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
                size="sm"
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
              size="sm"
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
          <Modal
            opened={queueNameModalOpen}
            onClose={() => setQueueNameModalOpen(false)}
            aria-label="Queue Name"
            centered
            size="sm"
            padding={0}
            radius={24}
            withCloseButton={false}
            styles={{
              content: { overflow: 'hidden' },
              body: { padding: 0 }
            }}
          >
            {/* ── Fixed Header ─────────────────────────────────────────── */}
            <Box
              className="queue-modal-header app-modal-header"
              style={{
                background: 'linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary), var(--theme-secondary) 40%))',
                padding: '24px 24px 20px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Group gap="sm" style={{ position: 'relative', zIndex: 1 }}>
                <Box
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3)',
                  }}
                >
                  <IconPlus size={18} color="var(--theme-primary-contrast)" strokeWidth={2.2} />
                </Box>
                <Box>
                  <Text
                    size="lg"
                    fw={800}
                    style={{
                      fontFamily: 'var(--font-heading)',
                      color: 'var(--theme-primary-contrast)',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.1,
                    }}
                  >
                    Queue Name
                  </Text>
                  <Text size="xs" style={{ color: 'var(--theme-primary-contrast)', opacity: 0.8, marginTop: 2 }}>
                    Update your display name in the queue
                  </Text>
                </Box>
              </Group>

              <UnstyledButton
                onClick={() => setQueueNameModalOpen(false)}
                aria-label="Close"
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.2)',
                  color: 'var(--theme-primary-contrast)',
                  fontSize: 12,
                  fontWeight: 700,
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.2s ease',
                  zIndex: 10,
                }}
                className="header-close-pill"
              >
                Cancel
              </UnstyledButton>
            </Box>

            <Stack gap="md" p="lg">
              <Box
                style={{
                  borderRadius: 18,
                  padding: '16px',
                  background: 'var(--theme-surface)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  border: '1px solid var(--theme-border)',
                }}
              >
                <TextInput
                  label={<Text size="sm" fw={700} style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.02em' }}>Queue Display Name</Text>}
                  placeholder="Your queue name"
                  description="Visible when joining or being added by others"
                  value={queueName}
                  onChange={(e) => setQueueName(e.currentTarget.value.slice(0, 10))}
                  maxLength={10}
                  variant="filled"
                  styles={{ input: { background: 'var(--theme-bg-soft)', borderRadius: 12, minHeight: 46 } }}
                  disabled={queueNameLoading}
                />
              </Box>

              <Group justify="flex-end" gap="sm">
                <Button variant="subtle" onClick={() => setQueueNameModalOpen(false)} color="gray">
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    await handleSaveQueueName();
                    setQueueNameModalOpen(false);
                  }}
                  loading={queueNameSaving}
                  disabled={queueNameLoading || queueName.trim() === queueNameOriginal}
                  leftSection={<IconCheck size={16} />}
                >
                  Save Name
                </Button>
              </Group>
            </Stack>
          </Modal>
        </>
      )}

      {/* Cabinet Tabs - Only show when there are multiple cabinets */}
      {hasMultipleCabinets && (
        <Group gap="sm" mb="md" className="cabinet-toggles" aria-label="Select cabinet">
          {Array.from({ length: cabinetCount }, (_, i) => i + 1).map((cabNum) => {
            const isActive = selectedCabinet === cabNum;
            return (
              <Button
                key={cabNum}
                variant={isActive ? "filled" : "light"}
                color={isActive ? "primary" : "blue"}
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
        aria-label={editingId ? 'Edit Queue Entry' : 'Add to Queue'}
        centered
        padding={0}
        radius={24}
        withCloseButton={false}
        styles={{
          content: {
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 40px)'
          },
          body: {
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden'
          }
        }}
      >
        {/* ── Fixed Header ─────────────────────────────────────────── */}
        <Box
          className="queue-modal-header app-modal-header"
          style={{
            background: 'linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary), var(--theme-secondary) 40%))',
            padding: '24px 24px 20px',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <Group gap="sm" style={{ position: 'relative', zIndex: 1 }}>
            <Box
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3)',
              }}
            >
              {editingId ? (
                <IconEdit size={18} color="var(--theme-primary-contrast)" strokeWidth={2.2} />
              ) : (
                <IconPlus size={18} color="var(--theme-primary-contrast)" strokeWidth={2.2} />
              )}
            </Box>
            <Box>
              <Text
                size="lg"
                fw={800}
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--theme-primary-contrast)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}
              >
                {editingId ? 'Edit Queue Entry' : 'Add to Queue'}
              </Text>
              <Text size="xs" style={{ color: 'var(--theme-primary-contrast)', opacity: 0.8, marginTop: 2 }}>
                {editingId ? 'Modify existing players' : 'Join the current waiting list'}
              </Text>
            </Box>
          </Group>

          <UnstyledButton
            onClick={cancelEdit}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              padding: '4px 12px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.2)',
              color: 'var(--theme-primary-contrast)',
              fontSize: 12,
              fontWeight: 700,
              backdropFilter: 'blur(4px)',
              transition: 'all 0.2s ease',
              zIndex: 10,
            }}
            className="header-close-pill"
          >
            Cancel
          </UnstyledButton>
        </Box>

        <Box style={{ flex: 1, overflowY: 'auto' }}>
          <Stack gap="md" p="lg">
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
                onCancel={cancelEdit}
              />
            </Suspense>
          </Stack>
        </Box>
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

      <DeleteConfirmDialog
        opened={clearQueueConfirmOpen}
        onClose={() => setClearQueueConfirmOpen(false)}
        onConfirm={clearQueue}
        loading={isMutating}
        title="Clear entire queue?"
        message="Every waiting entry will be removed. This action cannot be undone."
        confirmLabel="Clear queue"
      />

      <DeleteConfirmDialog
        opened={Boolean(pendingRemovalId)}
        onClose={() => setPendingRemovalId(null)}
        onConfirm={async () => {
          await handleRemoveWithAnimation(pendingRemovalId);
          setPendingRemovalId(null);
        }}
        loading={isMutating}
        title="Remove queue entry?"
        message="This matchup will be removed from the waiting list."
        confirmLabel="Remove entry"
      />

      {user && canActuallyEdit && isMallOpen && (
        <div className="queue-primary-actions">
          {!showForm && !editingId && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setShowForm(true)}
              variant="outline"
              disabled={isQueueDataLoading}
            >
              Add Queue
            </Button>
          )}
          {queue.length > 0 && (
            <Button
              variant="outline"
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={() => setClearQueueConfirmOpen(true)}
              disabled={isQueueDataLoading}
            >
              Clear All
            </Button>
          )}
        </div>
      )}

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
          <>
            <QueueList
              queue={visibleQueue}
              nowPlaying={nowPlaying}
              onEdit={startEdit}
              onRemove={setPendingRemovalId}
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

            {user && !canEdit && !isAdmin && (
              <div className="queue-action-bar">
                {!hasPendingRequest ? (
                  <Button variant="outline" size="sm" onClick={() => setShowRequestModal(true)}>
                    Request edit access
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Request pending
                  </Button>
                )}
              </div>
            )}
          </>
        )
      )}
    </Stack>
  );
}

export default QueueManager;
