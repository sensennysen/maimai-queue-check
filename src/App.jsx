import { useState } from 'react';
import { MantineProvider, Container, Title, Paper, Stack, Group, Button } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { BranchProvider } from './contexts/BranchContext';
import { useAuth } from './hooks/useAuth';
import { theme as mantineTheme } from './config/theme';
import QueueManager from './components/QueueManager';
import LoginForm from './components/LoginForm';
import ThemeToggle from './components/ThemeToggle';
import BranchSelector from './components/BranchSelector';
import Footer from './components/Footer';
import AdminPanelPage from './components/AdminPanelPage';
import PreferencesModal from './components/PreferencesModal';
import NotificationCenter from './components/NotificationCenter';
import PublicMonitor from './components/PublicMonitor';
import './App.css';

// The main application content (Queue check, Login, etc.)
function MainApp() {
  const { user, userRoles } = useAuth();
  const [currentPage, setCurrentPage] = useState('queue'); // 'queue' or 'admin-panel'
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [adminTargetTab, setAdminTargetTab] = useState(null);

  const handlePreferencesSaved = () => {
    // Real-time synchronization in AuthContext will handle updating userRoles state
    // automatically. We just need to close the modal.
    setShowPreferencesModal(false);
  };

  const handleOpenAdminPanel = (tab) => {
    setAdminTargetTab(tab);
    setCurrentPage('admin-panel');
  };

  return (
    <div className="App">
      {currentPage === 'queue' ? (
        <Container size="lg" py="xl">
          <Stack gap="lg">
            <Paper p="md" radius="md" withBorder className="app-header">
              <Group justify="space-between" align="center" gap="md" wrap="wrap">
                <Group gap="md">
                  <Title order={1} className="app-title">
                    maiPaQueueCheck PH
                  </Title>
                </Group>
              </Group>
            </Paper>

            <Group justify="space-between" gap="sm">
              <BranchSelector />
              <Group gap="sm">
                <NotificationCenter onOpenAdminPanel={handleOpenAdminPanel} />
                <ThemeToggle />
                <LoginForm
                  onOpenAdminPanel={handleOpenAdminPanel}
                  onOpenPreferences={() => setShowPreferencesModal(true)}
                />
              </Group>
            </Group>

            <main>
              <QueueManager />
            </main>

            <Footer />
          </Stack>
        </Container>
      ) : (
        <AdminPanelPage onBack={() => setCurrentPage('queue')} targetTab={adminTargetTab} />
      )}

      {user && (
        <PreferencesModal
          opened={showPreferencesModal}
          onClose={() => setShowPreferencesModal(false)}
          userId={user.id}
          userRoles={userRoles}
          initialPreferences={userRoles?.preferred_branches}
          initialDisplayName={userRoles?.display_name || user?.user_metadata?.full_name || ''}
          onSaveSuccess={handlePreferencesSaved}
        />
      )}
    </div>
  );
}

// Mantine wrapper that provides theme
function AppProviders() {
  const { isDark } = useTheme();

  return (
    <MantineProvider theme={mantineTheme} forceColorScheme={isDark ? 'dark' : 'light'}>
      <Notifications position="top-right" />
      <Routes>
        <Route path="/monitor" element={<PublicMonitor />} />
        <Route path="/*" element={<MainApp />} />
      </Routes>
      <Analytics />
    </MantineProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <BranchProvider>
          <AuthProvider>
            <AppProviders />
          </AuthProvider>
        </BranchProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
