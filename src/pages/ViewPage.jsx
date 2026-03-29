import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Container, Title, Text, Loader, Center, Alert, Badge, Group, Stack, ActionIcon, Paper, Skeleton, Table } from '@mantine/core';
import IconAlertCircle from '@tabler/icons-react/dist/esm/icons/IconAlertCircle.mjs';
import IconSun from '@tabler/icons-react/dist/esm/icons/IconSun.mjs';
import IconMoon from '@tabler/icons-react/dist/esm/icons/IconMoon.mjs';
import IconClockOff from '@tabler/icons-react/dist/esm/icons/IconClockOff.mjs';
import IconAlertTriangle from '@tabler/icons-react/dist/esm/icons/IconAlertTriangle.mjs';
import { useMonitorData } from '../hooks/useMonitorData';
import { useBranch } from '../hooks/useBranch';
import { useMallSchedule } from '../hooks/useMallSchedule';
import { useTheme } from '../contexts/ThemeContext';
import BranchSelector from '../components/layout/BranchSelector';
import { usePageVisibility } from '../hooks/usePageVisibility';
import QueueItem from '../features/queue/components/QueueItem';
import NowPlayingCard from '../features/queue/components/NowPlayingCard';
import './ViewPage.css';

export default function ViewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlBranchId = searchParams.get('branch_id');

  // Use hook to fetch data
  const { queueData, loading, error, activeBranchId, refreshData } = useMonitorData(urlBranchId);
  const { branches } = useBranch();
  const selectedBranch = branches.find(b => b.id === activeBranchId);
  const { isDark, toggleTheme } = useTheme();
  // Fetch schedule and open status
  const { isMallOpen, loading: scheduleLoading, schedule } = useMallSchedule(activeBranchId);

  const handleVisibilityChange = useCallback(() => {
    refreshData();
  }, [refreshData]);

  usePageVisibility(handleVisibilityChange);

  // Animation state for view page
  const [addedIds, setAddedIds] = useState(new Set());
  const [movedIds, setMovedIds] = useState(new Set());
  const [nowPlayingUpdatedCabs, setNowPlayingUpdatedCabs] = useState(new Set());
  const prevQueueDataRef = useRef(null);
  const firstLoadRef = useRef(true);

  // Detect real-time changes and trigger animations
  useEffect(() => {
    if (loading || !queueData || Object.keys(queueData).length === 0) return;

    // Skip animations on first load
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      prevQueueDataRef.current = queueData;
      return;
    }

    const prev = prevQueueDataRef.current;
    if (!prev) {
      prevQueueDataRef.current = queueData;
      return;
    }

    const newAdded = new Set();
    const newMoved = new Set();
    const updatedCabs = new Set();

    // Compare each cabinet
    for (const cabNum of Object.keys(queueData)) {
      const currCab = queueData[cabNum] || { playing: [], waiting: [] };
      const prevCab = prev[cabNum] || { playing: [], waiting: [] };

      // Detect new waiting entries
      const prevWaitingIds = new Set(prevCab.waiting.map(e => e.id));
      for (const entry of currCab.waiting) {
        if (!prevWaitingIds.has(entry.id)) {
          newAdded.add(entry.id);
        }
      }

      // Detect now-playing change
      const prevPlayingId = prevCab.playing[0]?.id;
      const currPlayingId = currCab.playing[0]?.id;
      if (currPlayingId && currPlayingId !== prevPlayingId) {
        updatedCabs.add(Number(cabNum));
      }

      // Detect order changes (reorder)
      const currWaitingIds = currCab.waiting.map(e => e.id);
      const prevWaitingOrder = prevCab.waiting.map(e => e.id);
      if (currWaitingIds.length === prevWaitingOrder.length && currWaitingIds.length > 0) {
        for (let i = 0; i < currWaitingIds.length; i++) {
          if (currWaitingIds[i] !== prevWaitingOrder[i] && prevWaitingIds.has(currWaitingIds[i])) {
            newMoved.add(currWaitingIds[i]);
          }
        }
      }
    }

    if (newAdded.size > 0) {
      setTimeout(() => {
        setAddedIds(newAdded);
        setTimeout(() => setAddedIds(new Set()), 700);
      }, 0);
    }
    if (newMoved.size > 0) {
      setTimeout(() => {
        setMovedIds(newMoved);
        setTimeout(() => setMovedIds(new Set()), 600);
      }, 0);
    }
    if (updatedCabs.size > 0) {
      setTimeout(() => {
        setNowPlayingUpdatedCabs(updatedCabs);
        setTimeout(() => setNowPlayingUpdatedCabs(new Set()), 700);
      }, 0);
    }

    prevQueueDataRef.current = queueData;
  }, [queueData, loading]);

  // Calculate credits (players in waiting list)
  const getCreditsCount = (waitingList) => {
    return waitingList.reduce((acc, item) => {
      return acc + (item.player1 ? 1 : 0) + (item.player2 ? 1 : 0);
    }, 0);
  };

  // If we don't have basic branch info yet, we must show full loader
  if (!selectedBranch) {
    return (
      <Center style={{ height: '100vh', flexDirection: 'column', gap: 'md' }}>
        <Loader size="xl" />
        <Text>Loading View...</Text>
      </Center>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  // Generate cabinet numbers based on branch config
  const cabinetCount = selectedBranch?.cab_count || 1;
  const cabinetNumbers = Array.from({ length: cabinetCount }, (_, i) => i + 1);

  // Are we waiting for initial data for this branch?
  const isQueueLoading = loading && Object.keys(queueData).length === 0;

  // Helper to format time to 12h AM/PM
  const formatTime12Hour = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const m = minutes || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  // Render Schedule List helper
  const renderSchedule = () => {
    if (!schedule || schedule.length === 0) return <Text c="secondary" italic>No schedule available</Text>;

    // Sort days if needed, but usually API passes them in order or we can just map
    // Assuming schedule comes in a reasonable order or we map simply
    return (
      <Table style={{ maxWidth: 400, margin: '1rem auto' }} verticalSpacing="xs">
        <Table.Tbody>
          {schedule.map((daySchedule, index) => (
            <Table.Tr key={index}>
              <Table.Td style={{ fontWeight: 500, borderBottom: 'none', textAlign: 'left' }}>{daySchedule.day}</Table.Td>
              <Table.Td style={{ textAlign: 'right', borderBottom: 'none' }}>
                {formatTime12Hour(daySchedule.time_open)} - {formatTime12Hour(daySchedule.time_close)}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    );
  };

  return (
    <div className="public-monitor-container">
      <Stack gap="lg">
        <Paper p="md" radius="md" withBorder className="app-header">
          <Group gap="md" justify="space-between" align="center">
            <Title
              order={1}
              className="app-title"
              onClick={() => navigate('/')}
              style={{ cursor: 'pointer' }}
            >
              maiPaQueueCheck PH
            </Title>
            <Badge size="lg" variant="gradient" gradient={{ from: 'var(--theme-primary)', to: 'var(--theme-secondary)', deg: 90 }}>View Mode</Badge>
          </Group>
        </Paper>
        {/* Info Alert replicating QueueManager.jsx */}
        <Alert icon={<IconAlertTriangle size={16} />} color="blue" variant="light">
          Info here might not reflect the actual queue in the branch
        </Alert>

        {/* Controls Row: Branch Selector and Theme Toggle */}
        <Group justify="space-between" align="center" mb="md">
          <BranchSelector />
          <ActionIcon
            variant="default"
            size="lg"
            aria-label="Toggle color scheme"
            onClick={toggleTheme}
          >
            {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
          </ActionIcon>
        </Group>

        {/* Content Area: Either Closed Message or Queue Grid */}
        {!isMallOpen && !scheduleLoading ? (
          <Paper p="xl" withBorder style={{ textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Stack align="center" gap="md">
              <IconClockOff size={60} color="var(--theme-text-muted)" />
              <Title order={2}>This arcade is currently closed</Title>
              <Text c="secondary" fw={600} tt="uppercase" lts={1} size="sm">Operating Hours</Text>
              {renderSchedule()}
            </Stack>
          </Paper>
        ) : (
          <div className="monitor-grid">
            {cabinetNumbers.map(cabNum => {
              const cabData = queueData[cabNum] || { playing: [], waiting: [] };
              const { playing, waiting } = cabData;
              const credits = getCreditsCount(waiting);

              const nowPlayingEntry = playing.length > 0 ? playing[0] : null;

              return (
                <div key={cabNum} className="cabinet-column">
                  <div className="cabinet-header">
                    <Group justify="space-between" align="center" style={{ width: '100%' }}>
                      <Title order={2} size="h3">Cabinet {cabNum}</Title>
                      {isQueueLoading ? (
                        <Skeleton height={26} width={100} radius="xl" />
                      ) : (
                        <Badge variant="filled" color={credits > 0 ? 'var(--theme-primary)' : 'gray'} size="xl">
                          Credits: {credits}
                        </Badge>
                      )}
                    </Group>
                  </div>

                  <div className="monitor-section">
                    <Text className="section-title">Now Playing</Text>
                    <div className="monitor-list">
                      {isQueueLoading ? (
                        <Skeleton height={80} radius="md" />
                      ) : (
                        <NowPlayingCard
                          nowPlaying={nowPlayingEntry}
                          canActuallyEdit={false}
                          isBusy={false}
                          isLoggedIn={false}
                          readOnly={true}
                          justUpdated={nowPlayingUpdatedCabs.has(cabNum)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="monitor-section">
                    <Text className="section-title" style={{ marginTop: '1rem' }}>Waiting</Text>
                    {/* waiting-list class ensures scrollability for >4 items */}
                    <div className="monitor-list waiting-list">
                      {isQueueLoading ? (
                        <>
                          <Skeleton height={60} radius="md" mb="sm" />
                          <Skeleton height={60} radius="md" mb="sm" />
                          <Skeleton height={60} radius="md" />
                        </>
                      ) : (
                        waiting.length > 0 ? (
                          waiting.map((entry, index) => (
                            <QueueItem
                              key={entry.id}
                              item={entry}
                              order={index + 1}
                              isNextUp={index === 0}
                              readOnly={true}
                              canActuallyEdit={false}
                              onEdit={() => { }}
                              onRemove={() => { }}
                              onMoveUp={() => { }}
                              onMoveDown={() => { }}
                              isAdded={addedIds.has(entry.id)}
                              isMoved={movedIds.has(entry.id)}
                            />
                          ))
                        ) : (
                          <div className="monitor-empty">No one in line</div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Stack>
    </div >
  );
}
