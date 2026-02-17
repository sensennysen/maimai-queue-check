import { useState, lazy, Suspense, useMemo } from 'react';
import { MantineProvider, Container, Title, Paper, Stack, Group, Button, LoadingOverlay, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { BranchProvider } from './contexts/BranchContext';
import { useAuth } from './hooks/useAuth';
import { theme as mantineTheme, themes } from './config/theme';
import QueueManager from './features/queue/components/QueueManager';
// import LoginForm from './components/LoginForm'; // Assuming this stayed, if not update
import ThemeToggle from './components/layout/ThemeToggle';
import BranchSelector from './components/layout/BranchSelector';
import Footer from './components/layout/Footer';
import PreferencesModal from './components/modals/PreferencesModal';
import NotificationCenter from './components/layout/NotificationCenter';
import './App.css';

// Lazy load pages
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ExportBest50Page = lazy(() => import('./pages/ExportBest50Page'));
const ViewPage = lazy(() => import('./pages/ViewPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
import LoginForm from './components/LoginForm';

// The main application content (Queue check, Login, etc.)
function MainApp() {
  const { user, userRoles } = useAuth();
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

  const handlePreferencesSaved = () => {
    // Real-time synchronization in AuthContext will handle updating userRoles state
    // automatically. We just need to close the modal.
    setShowPreferencesModal(false);
  };

  return (
    <div className="App">
      <Container size="lg" py="xl">
        <Stack gap="lg">
          <Paper p="md" radius="md" withBorder className="app-header animate-fade-in">
            <Group justify="space-between" align="center" gap="md" wrap="wrap">
              <Group gap="md">
                <Title order={1} className="app-title">
                  maiPaQueueCheck PH
                </Title>
              </Group>
            </Group>
          </Paper>

          <Group justify="space-between" gap="sm" className="animate-fade-in delay-100">
            <BranchSelector />
            <Group gap="sm">
              {user && <NotificationCenter />}
              <ThemeToggle />
              <LoginForm
                onOpenPreferences={() => setShowPreferencesModal(true)}
              />
            </Group>
          </Group>

          <main className="animate-fade-in delay-200">
            <QueueManager />
          </main>

          <div className="animate-fade-in delay-300">
            <Footer />
          </div>
        </Stack>
      </Container>

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
  const { isDark, currentTheme } = useTheme();

  const dynamicTheme = useMemo(() => {
    const selectedPalette = themes[currentTheme] || themes.circle;

    // Create a new theme instance overriding the colors
    return createTheme({
      ...mantineTheme,
      colors: {
        ...mantineTheme.colors,
        primary: selectedPalette.colors.primary,
        secondary: selectedPalette.colors.secondary,
        accent: selectedPalette.colors.accent,
      },
    });
  }, [currentTheme]);

  return (
    <MantineProvider theme={dynamicTheme} forceColorScheme={isDark ? 'dark' : 'light'}>
      <Notifications position="top-right" />
      <Suspense fallback={<LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} loaderProps={{ color: 'pink', type: 'bars' }} />}>
        <Routes>
          <Route path="/profile/export" element={<ExportBest50Page />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/view" element={<ViewPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/*" element={<MainApp />} />
        </Routes>
      </Suspense>
      <Analytics />
    </MantineProvider>
  );
}

import { FeatureFlagProvider } from './contexts/FeatureFlagContext';

// ... (imports remain the same)

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <BranchProvider>
          <AuthProvider>
            <FeatureFlagProvider>
              <AppProviders />
            </FeatureFlagProvider>
          </AuthProvider>
        </BranchProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
