import { lazy, Suspense, useMemo } from 'react';
import { MantineProvider, Container, Stack, Loader, createTheme } from '@mantine/core';
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
import Footer from './components/layout/Footer';
import GlobalNavbar from './components/layout/GlobalNavbar';
import BranchSelector from './components/layout/BranchSelector';
import './App.css';

// Lazy load pages
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
// ProfilePage is removed in favor of PublicProfilePage
const ExportBest50Page = lazy(() => import('./pages/ExportBest50Page'));
const ViewPage = lazy(() => import('./pages/ViewPage'));
const SongsPage = lazy(() => import('./pages/SongsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));

const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const SongDiscussionPage = lazy(() => import('./pages/SongDiscussionPage'));
const SharedPlaylistsPage = lazy(() => import('./pages/SharedPlaylistsPage'));
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

          <div className="animate-fade-in delay-200">
            <Footer />
          </div>
        </Stack>
      </Container>
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

  // Redirect /profile to the user's public slug
  const ProfileRedirect = () => {
    const { user, userRoles, loading: authLoading } = useAuth();
    if (authLoading) return null;
    if (!user) return <Navigate to="/" replace />;
    if (userRoles?.slug) return <Navigate to={`/p/${userRoles.slug}`} replace />;
    // If no slug yet, fallback to main app or a default view
    return <Navigate to="/" replace />;
  };

  const ProtectedRoute = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    if (authLoading) return null;
    if (!user) return <Navigate to="/" replace />;
    return children;
  };

  return (
    <MantineProvider theme={dynamicTheme} forceColorScheme={isDark ? 'dark' : 'light'}>
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
