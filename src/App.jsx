import { useState, lazy, Suspense, useMemo } from 'react';
import { MantineProvider, Container, Title, Paper, Stack, Box, Loader, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/tiptap/styles.css';
import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { BranchProvider } from './contexts/BranchContext';
import { SongDatabaseProvider } from './contexts/SongDatabaseContext';
import { useAuth } from './hooks/useAuth';
import { theme as mantineTheme, themes } from './config/theme';
import QueueManager from './features/queue/components/QueueManager';
// import LoginForm from './components/LoginForm'; // Assuming this stayed, if not update
import ThemeToggle from './components/layout/ThemeToggle';
import NotificationCenter from './components/layout/NotificationCenter';
import GlobalHeader from './components/layout/GlobalHeader';
import Footer from './components/layout/Footer';
import PreferencesModal from './components/modals/PreferencesModal';
import './App.css';

// Lazy load pages
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
// ProfilePage is removed in favor of PublicProfilePage
const ExportBest50Page = lazy(() => import('./pages/ExportBest50Page'));
const ViewPage = lazy(() => import('./pages/ViewPage'));
const SongsPage = lazy(() => import('./pages/SongsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
import LoginForm from './components/LoginForm';

const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const SongDiscussionPage = lazy(() => import('./pages/SongDiscussionPage'));
const SharedPlaylistsPage = lazy(() => import('./pages/SharedPlaylistsPage'));

// The main application content (Queue check, Login, etc.)
function MainApp() {
  return (
    <div className="App">
      <main className="animate-fade-in delay-200">
        <QueueManager />
      </main>
    </div>
  );
}

// Mantine wrapper that provides theme
function AppProviders() {
  const { isDark, currentTheme } = useTheme();
  const { user } = useAuth();
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);

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

  // Redirect /profile to the user's public slug
  const ProfileRedirect = () => {
    const { user, userRoles, loading: authLoading } = useAuth();
    if (authLoading) return null;
    if (!user) return <Navigate to="/" replace />;
    if (userRoles?.slug) return <Navigate to={`/p/${userRoles.slug}`} replace />;
    // If no slug yet, fallback to main app or a default view
    return <Navigate to="/" replace />;
  };

  return (
    <MantineProvider theme={dynamicTheme} forceColorScheme={isDark ? 'dark' : 'light'}>
      <Notifications position="top-right" />

      <Container size="xl" py="lg">
        <GlobalHeader onOpenPreferences={() => setShowPreferencesModal(true)} />

        <Suspense fallback={
          <Stack align="center" justify="center" style={{ minHeight: '60vh' }}>
            <Loader size="xl" color="pink" type="bars" />
          </Stack>
        }>
          <Routes>
            <Route path="/profile/export" element={<ExportBest50Page />} />
            <Route path="/profile" element={<ProfileRedirect />} />
            <Route path="/view" element={<ViewPage />} />
            <Route path="/songs" element={<SongsPage />} />
            <Route path="/songs/:id" element={<SongDiscussionPage />} />
            <Route path="/shared-playlists" element={<SharedPlaylistsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/p/:slug" element={<PublicProfilePage />} />
            <Route path="/*" element={<MainApp />} />
          </Routes>
        </Suspense>

        <Box mt="xl" className="animate-fade-in delay-300">
          <Footer />
        </Box>
      </Container>

      {user && (
        <PreferencesModal
          opened={showPreferencesModal}
          onClose={() => setShowPreferencesModal(false)}
        />
      )}
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
            <SongDatabaseProvider>
              <FeatureFlagProvider>
                <AppProviders />
              </FeatureFlagProvider>
            </SongDatabaseProvider>
          </AuthProvider>
        </BranchProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
