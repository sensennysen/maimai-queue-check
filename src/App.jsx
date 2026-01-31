import { useState } from 'react';
import { MantineProvider, Container, Title, Text, Paper, Stack, Group } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { BranchProvider } from './contexts/BranchContext';
import { subtitleMessages } from './data/subtitleMessages';
import { theme as mantineTheme } from './config/theme';
import QueueManager from './components/QueueManager';
import LoginForm from './components/LoginForm';
import ThemeToggle from './components/ThemeToggle';
import BranchSelector from './components/BranchSelector';
import Footer from './components/Footer';
import BranchManagerPage from './components/BranchManagerPage';
import './App.css';

// Mantine theme configuration that syncs with our CSS variables
function AppContent() {
  const { isDark } = useTheme();
  const [currentPage, setCurrentPage] = useState('queue'); // 'queue' or 'branch-manager'

  // Random subtitle selection - using weighted chances
  // eslint-disable-next-line
  const [randomSubtitle] = useState(() => {
    const totalWeight = subtitleMessages.reduce((sum, msg) => sum + msg.weight, 0);
    let random = Math.random() * totalWeight;

    for (const msg of subtitleMessages) {
      if (random < msg.weight) {
        return { text: msg.text };
      }
      random -= msg.weight;
    }

    // Fallback
    const firstMsg = subtitleMessages[0];
    return { text: firstMsg.text };
  });

  return (
    <MantineProvider theme={mantineTheme} forceColorScheme={isDark ? 'dark' : 'light'}>
      <Notifications position="top-right" />
      <div className="App">
        {currentPage === 'queue' ? (
          <Container size="lg" py="xl">
            <Stack gap="lg">
              <Paper p="md" radius="md" withBorder className="app-header">
                <Group justify="space-between" align="center" gap="md" wrap="wrap">
                  <Group gap="md">
                    <Title order={1} className="app-title">
                      maiPaQueueCheck.ph
                    </Title>
                  </Group>
                </Group>
              </Paper>

              <Group justify="space-between" gap="sm">
                <BranchSelector />
                <Group gap="sm">
                  <ThemeToggle />
                  <LoginForm onOpenAdminPanel={() => setCurrentPage('branch-manager')} />
                </Group>
              </Group>

              <main>
                <QueueManager />
              </main>

              <Footer />
            </Stack>
          </Container>
        ) : (
          <BranchManagerPage onBack={() => setCurrentPage('queue')} />
        )}
      </div>
      <Analytics />
    </MantineProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BranchProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BranchProvider>
    </ThemeProvider>
  );
}

export default App;
