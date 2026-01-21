import { useState } from 'react';
import { MantineProvider, Container, Title, Text, Paper, Stack, Group, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { subtitleMessages } from './data/subtitleMessages';
import QueueManager from './components/QueueManager';
import LoginForm from './components/LoginForm';
import ThemeToggle from './components/ThemeToggle';
import Footer from './components/Footer';
import './App.css';

// Mantine theme configuration that syncs with our CSS variables
function AppContent() {
  const { isDark } = useTheme();

  // Random subtitle selection - using weighted chances
  const [randomSubtitle] = useState(() => {
    const totalWeight = subtitleMessages.reduce((sum, msg) => sum + msg.weight, 0);
    let random = Math.random() * totalWeight;

    for (const msg of subtitleMessages) {
      if (random < msg.weight) {
        const chance = ((msg.weight / totalWeight) * 100).toFixed(2);
        return { text: msg.text };
      }
      random -= msg.weight;
    }

    // Fallback
    const firstMsg = subtitleMessages[0];
    const chance = ((firstMsg.weight / totalWeight) * 100).toFixed(2);
    return { text: firstMsg.text };
  });

  const getSubtitleColor = (weight) => {
    if (weight === 10) return undefined;
    if (weight > 5) return '#CD7F32'; // Bronze
    if (weight > 2) return '#C0C0C0'; // Silver
    return '#FFD700'; // Gold
  };

  const mantineTheme = createTheme({
    colorScheme: isDark ? 'dark' : 'light',
    colors: {
      primary: ['#FFE5F3', '#FFB3D9', '#FF80BF', '#FF4FB7', '#FF1FA5', '#E6008C', '#B30066', '#80004D', '#4D0033', '#1A0019'],
      secondary: ['#E8FDFE', '#A8F5F8', '#6BEFF3', '#31E0E7', '#00D4DB', '#00B8C0', '#009BA3', '#007E86', '#006169', '#00444C'],
      accent: ['#FFFCE6', '#FFFAB3', '#FFF780', '#FFE35A', '#FFD000', '#E6BB00', '#B39200', '#806900', '#4D4000', '#1A1600'],
    },
    primaryColor: 'primary',
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    headings: {
      fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
      fontWeight: 600,
    },
  });

  return (
    <MantineProvider theme={mantineTheme} forceColorScheme={isDark ? 'dark' : 'light'}>
      <Notifications position="top-right" />
      <div className="App">
        <Container size="lg" py="xl">
          <Stack gap="lg">
            <Paper p="md" radius="md" withBorder className="app-header">
              <Group justify="space-between" align="center" gap="md" wrap="wrap">
                <Title order={1} className="app-title">
                  maimai Fairview Queue
                </Title>
                <Text
                  size="lg"
                  className="app-subtitle"
                  style={{
                    color: getSubtitleColor(randomSubtitle.weight),
                    fontWeight: randomSubtitle.weight <= 2 ? 700 : 400,
                    textShadow: randomSubtitle.weight <= 2 ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none'
                  }}
                >
                  {randomSubtitle.text}
                </Text>
              </Group>
            </Paper>

            <Group justify="flex-end" gap="sm">
              <ThemeToggle />
              <LoginForm />
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
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
