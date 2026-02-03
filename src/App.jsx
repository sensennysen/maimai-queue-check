import { useState, useEffect, useRef } from 'react';
import { MantineProvider, Container, Title, Text, Paper, Stack, Group } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { Analytics } from '@vercel/analytics/react';
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
import PreferredBranchesModal from './components/PreferredBranchesModal';
import './App.css';

// Mantine theme configuration that syncs with our CSS variables
function AppContent() {
  const { isDark } = useTheme();
  const { user, userRoles, loading: authLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('queue'); // 'queue' or 'admin-panel'
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const hasCheckedPreferences = useRef(false);

  // Check for missing preferences
  useEffect(() => {
    if (!authLoading && user && userRoles) {
      // Logic: If user is logged in, has roles loaded, and preferred_branches is empty/null
      // We only want to auto-open ONCE per session to avoid annoyance, but the requirement implies strict enforcement.
      // Let's settle on: Auto-open if empty, and we haven't manually closed it in this session (or just check once).
      // Actually, "If the user doesn't have any preferred branches... display a modal".
      // Let's use a flag to only pop it once per page load to be safe.

      const hasPreferences = userRoles.preferred_branches && userRoles.preferred_branches.length > 0;

      if (!hasPreferences && !hasCheckedPreferences.current) {
        hasCheckedPreferences.current = true;
        // Defer state update to avoid cascading render warning
        setTimeout(() => setShowPreferencesModal(true), 0);
      }
    }
  }, [authLoading, user, userRoles]);

  const handlePreferencesSaved = () => {
    // To reflect changes immediately in the UI (like the Login dropdown badges), 
    // we would ideally refresh userRoles. Since AuthContext doesn't expose a generic refresh,
    // a page reload is a safe brute-force way to ensure all contexts sync up with the new DB state.
    // Or we could rely on supabase realtime if we set it up, but reload is safer for now.
    window.location.reload();
  };

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
                      maiPaQueueCheck PH
                    </Title>
                  </Group>
                </Group>
              </Paper>

              <Group justify="space-between" gap="sm">
                <BranchSelector />
                <Group gap="sm">
                  <ThemeToggle />
                  <LoginForm
                    onOpenAdminPanel={() => setCurrentPage('admin-panel')}
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
          <AdminPanelPage onBack={() => setCurrentPage('queue')} />
        )}

        {user && (
          <PreferredBranchesModal
            opened={showPreferencesModal}
            onClose={() => setShowPreferencesModal(false)}
            userId={user.id}
            initialPreferences={userRoles?.preferred_branches}
            onSaveSuccess={handlePreferencesSaved}
          />
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
