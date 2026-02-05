import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Title, Text, Loader, Center, Alert, Badge, Group, Stack, ActionIcon, Paper, Skeleton } from '@mantine/core';
import { IconAlertCircle, IconWifi, IconWifiOff, IconSun, IconMoon, IconClockOff, IconAlertTriangle } from '@tabler/icons-react';
import { useMonitorData } from '../hooks/useMonitorData';
import { useBranch } from '../hooks/useBranch';
import { useMallSchedule } from '../hooks/useMallSchedule';
import { useTheme } from '../contexts/ThemeContext';
import BranchSelector from './BranchSelector';
import QueueItem from './QueueItem';
import NowPlayingCard from './NowPlayingCard';
import './ViewPage.css';

export default function ViewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlBranchId = searchParams.get('branch_id');

  // Use hook to fetch data
  const { queueData, loading, error, activeBranchId } = useMonitorData(urlBranchId);
  const { branches } = useBranch();
  const selectedBranch = branches.find(b => b.id === activeBranchId);
  const { isDark, toggleTheme } = useTheme();
  const { isMallOpen, loading: scheduleLoading } = useMallSchedule(activeBranchId);

  // Calculate credits (players in waiting list)
  const getCreditsCount = (waitingList) => {
    return waitingList.reduce((acc, item) => {
      return acc + (item.player1 ? 1 : 0) + (item.player2 ? 1 : 0);
    }, 0);
  };

  // If we don't have basic branch info yet, we must show full loader
  // This state is just for initial page load where we don't know the branch name yet.
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
      <Container size="md" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  // Handle closed state
  if (!isMallOpen && !scheduleLoading) {
    return (
      <div className="public-monitor-container">
        <Container size="sm" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Stack align="center" gap="xl">
            <IconClockOff size={80} color="var(--mantine-color-gray-5)" />
            <Title order={1}>{selectedBranch?.arcade_name}</Title>
            <Text size="xl" c="dimmed">This branch is currently closed.</Text>
            <BranchSelector />
          </Stack>
        </Container>
      </div>
    );
  }

  // Generate cabinet numbers based on branch config
  const cabinetCount = selectedBranch?.cab_count || 1;
  const cabinetNumbers = Array.from({ length: cabinetCount }, (_, i) => i + 1);

  // Are we waiting for initial data for this branch?
  const isQueueLoading = loading && Object.keys(queueData).length === 0;

  return (
    <div className="public-monitor-container">
      <Stack gap="lg">
        {/* Main Header replicating App.jsx */}
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
            <Badge size="lg" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>View Mode</Badge>
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

        {/* Queue Grid */}
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
                      <Badge variant="filled" color="blue" size="xl">
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
                            // Event handlers not needed but safer to pass defaults or ignore in readOnly
                            onEdit={() => { }}
                            onRemove={() => { }}
                            onMoveUp={() => { }}
                            onMoveDown={() => { }}
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
      </Stack>
    </div >
  );
}
