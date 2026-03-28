import { lazy, Suspense, useMemo } from 'react';
import { MantineProvider, Container, Stack, Loader, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/tiptap/styles.css';
import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { BranchProvider } from './contexts/BranchContext';
import { SongDatabaseProvider } from './contexts/SongDatabaseContext';
import { FeatureFlagProvider } from './contexts/FeatureFlagContext';
import { theme as mantineTheme, themes } from './config/theme';
import { ProtectedRoute, ProfileRedirect } from './components/routing/RoutingComponents';
import QueueManager from './features/queue/components/QueueManager';
import Footer from './components/layout/Footer';
import GlobalNavbar from './components/layout/GlobalNavbar';
import BranchSelector from './components/layout/BranchSelector';
import ErrorBoundary from './components/layout/ErrorBoundary';
import './App.css';

// Lazy load pages
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AuditLogsPage = lazy(() => import('./features/admin/pages/AuditLogsPage'));
const ExportBest50Page = lazy(() => import('./pages/ExportBest50Page'));
const ViewPage = lazy(() => import('./pages/ViewPage'));
const SongsPage = lazy(() => import('./pages/SongsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const SongDiscussionPage = lazy(() => import('./pages/SongDiscussionPage'));
const SharedPlaylistsPage = lazy(() => import('./features/playlists/SharedPlaylistsPage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));

// The main application content (Queue check, Login, etc.)
function MainApp() {
  return (
    <div className="App">
      <Container size="xl" py="xl">
        <Stack gap="lg">
          <BranchSelector />
          <main className="animate-fade-in delay-100">
            <QueueManager />
          </main>
        </Stack>
      </Container>
    </div>
  );
}

// Mantine must wrap ErrorBoundary so the boundary fallback (Mantine components) still has a provider.
function MantineAppShell() {
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
      <ErrorBoundary>
        <Notifications position="top-right" />
        <GlobalNavbar />
        <Suspense fallback={
          <Container size="xl" py="xl">
            <Stack align="center" justify="center" style={{ minHeight: '60vh' }}>
              <Loader size="xl" color="pink" type="bars" />
            </Stack>
          </Container>
        }>
          <Routes>
            <Route path="/profile/export" element={<ExportBest50Page />} />
            <Route path="/profile" element={<ProfileRedirect />} />
            <Route path="/view" element={<ViewPage />} />
            <Route path="/songs" element={<SongsPage />} />
            <Route path="/songs/:id" element={<SongDiscussionPage />} />
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            <Route path="/shared-playlists" element={<ProtectedRoute><SharedPlaylistsPage /></ProtectedRoute>} />
            <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/p/:slug" element={<PublicProfilePage />} />
            <Route path="/" element={<MainApp />} />
            <Route path="*" element={<MainApp />} />
          </Routes>
        </Suspense>
        <Footer />
        <Analytics />
      </ErrorBoundary>
    </MantineProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <BranchProvider>
          <AuthProvider>
            <SongDatabaseProvider>
              <FeatureFlagProvider>
                <MantineAppShell />
              </FeatureFlagProvider>
            </SongDatabaseProvider>
          </AuthProvider>
        </BranchProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
