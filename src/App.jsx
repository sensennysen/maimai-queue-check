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
import './App.css';

// Mantine theme configuration that syncs with our CSS variables
function AppContent() {
  const { isDark } = useTheme();

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
        <Container size="lg" py="xl">
          <Stack gap="lg">
            <Paper p="md" radius="md" withBorder className="app-header">
              <Group justify="space-between" align="center" gap="md" wrap="wrap">
                <Group gap="md">
                  <Title order={1} className="app-title">
                    maiPaQueueCheck.ph
                  </Title>
                </Group>
                {/* <Text
                  size="lg"
                  className="app-subtitle"
                  style={{
                    color: getSubtitleColor(randomSubtitle.weight),
                    fontWeight: randomSubtitle.weight <= 2 ? 700 : 400,
                    textShadow: randomSubtitle.weight <= 2 ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none'
                  }}
                >
                  {randomSubtitle.text}
                </Text> */}
              </Group>
            </Paper>

            <Group justify="space-between" gap="sm">
              <BranchSelector />
              <Group gap="sm">
                <ThemeToggle />
                <LoginForm />
              </Group>
            </Group>

            <main>
              <QueueManager />
            </main>

            <Footer />
          </Stack>
        </Container>
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
