import { MantineProvider, Container, Title, Text, Paper, Stack } from '@mantine/core'
import '@mantine/core/styles.css'
import QueueManager from './components/QueueManager'
import './App.css'

function App() {
  return (
    <MantineProvider>
      <div className="App">
        <Container size="lg" py="xl">
          <Stack gap="lg">
            <Paper p="xl" radius="md" withBorder className="app-header">
              <Title order={1} ta="center" c="white" mb="xs">
                🎵 Maimai Queue Manager
              </Title>
              <Text ta="center" c="dimmed" size="lg">
                Manage your maimai rhythm game queue efficiently
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

export default App
