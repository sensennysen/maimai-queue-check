import { MantineProvider, Container, Title, Text, Paper, Stack, Group, createTheme } from '@mantine/core'
import '@mantine/core/styles.css'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { subtitleMessages } from './data/subtitleMessages'
import QueueManager from './components/QueueManager'
import ThemeToggle from './components/ThemeToggle'
import './App.css'

// Mantine theme configuration that syncs with our CSS variables
function AppContent() {
  const { isDark } = useTheme()
  
  // Random subtitle selection
  const randomSubtitle = subtitleMessages[Math.floor(Math.random() * subtitleMessages.length)]
  
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
  })

  return (
    <MantineProvider theme={mantineTheme} forceColorScheme={isDark ? 'dark' : 'light'}>
      <div className="App">
        <Container size="lg" py="xl">
          <Stack gap="lg">
            <Paper p="xl" radius="md" withBorder className="app-header">
              <Group justify="space-between" align="center" mb="xs">
                <Title order={1} ta="center" c="white" className="app-title" style={{ flex: 1 }}>
                  maimai Fairview Queue
                </Title>
                <ThemeToggle />
              </Group>
              <Text ta="center" c="white" size="lg" className="app-subtitle">
                {randomSubtitle}
              </Text>
            </Paper>
            
            <main>
              <QueueManager />
            </main>
          </Stack>
        </Container>
      </div>
    </MantineProvider>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
