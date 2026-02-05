import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Title, Text, Loader, Center, Alert, Badge, Group } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useMonitorData } from '../hooks/useMonitorData';
import { useBranch } from '../hooks/useBranch';
import { useTheme } from '../contexts/ThemeContext';
import './PublicMonitor.css';

export default function PublicMonitor() {
  const [searchParams] = useSearchParams();
  const urlBranchId = searchParams.get('branch_id');

  // Use hook to fetch data (uses URL param or context fallback)
  const { queueData, loading, error, isConnected, activeBranchId } = useMonitorData(urlBranchId);

  // Need to know branch name for the header
  const { branches } = useBranch();
  const branchName = branches.find(b => b.id === activeBranchId)?.arcade_name || 'Loading Branch...';

  // Force dark mode or specific theme for monitor? 
  // For now, respect user preference but maybe default to dark for screens?
  // Let's stick to system/user prop from ThemeContext
  const { isDark } = useTheme();

  if (loading && !queueData) {
    return (
      <Center style={{ height: '100vh' }}>
        <Loader size="xl" />
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

  // Get all cabinet numbers, sorted
  const cabinetNumbers = Object.keys(queueData).map(Number).sort((a, b) => a - b);

  return (
    <div className="public-monitor-container">
      <header className="monitor-header">
        <Title order={1}>{branchName} - Queue Monitor</Title>
        <Text c="dimmed" size="sm">
          Real-time updates • {isConnected ? 'Connected' : 'Connecting...'}
        </Text>
      </header>

      {cabinetNumbers.length === 0 ? (
        <Center h={400}>
          <Text c="dimmed" size="xl">No active cabinets found for this branch.</Text>
        </Center>
      ) : (
        <div className="monitor-grid">
          {cabinetNumbers.map(cabNum => {
            const { playing, waiting } = queueData[cabNum];
            return (
              <div key={cabNum} className="cabinet-column">
                <div className="cabinet-header">
                  <Title order={2} size="h3">Cabinet {cabNum}</Title>
                </div>

                <div className="monitor-section">
                  <Text className="section-title">Now Playing</Text>
                  <div className="monitor-list">
                    {playing.length > 0 ? (
                      playing.map(entry => (
                        <div key={entry.id} className="monitor-card playing">
                          <div className="monitor-card-content">
                            <span className="player-names">{entry.player1} {entry.player2 ? `& ${entry.player2}` : ''}</span>
                            <Badge color="green" variant="light">PLAYING</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="monitor-empty">Available</div>
                    )}
                  </div>
                </div>

                <div className="monitor-section">
                  <Text className="section-title">Waiting</Text>
                  <div className="monitor-list">
                    {waiting.length > 0 ? (
                      waiting.map((entry, index) => (
                        <div key={entry.id} className="monitor-card">
                          <div className="monitor-card-content">
                            <Group gap="xs">
                              <Badge variant="default" size="lg" circle>{index + 1}</Badge>
                              <span className="player-names">{entry.player1} {entry.player2 ? `& ${entry.player2}` : ''}</span>
                            </Group>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="monitor-empty">No matching entries</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
