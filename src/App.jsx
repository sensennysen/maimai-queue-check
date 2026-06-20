import { lazy, Suspense, useMemo } from 'react';
import { MantineProvider, Container, Stack, Loader, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/tiptap/styles.css';
import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { BranchProvider } from './contexts/BranchContext';
import { SongDatabaseProvider } from './contexts/SongDatabaseContext';
import { FeatureFlagProvider } from './contexts/FeatureFlagContext';
import { theme as mantineTheme, themes } from './config/theme';
import { ProtectedRoute, ProfileRedirect } from './components/routing/RoutingComponents';
import QueueManager from './features/queue/components/QueueManager';
import BranchSelector from './components/layout/BranchSelector';
import AppShell from './components/layout/AppShell';
import ErrorBoundary from './components/layout/ErrorBoundary';
import './App.css';
import ConsentBanner from './components/legal/ConsentBanner';
import { useAuth } from './hooks/useAuth';
import { buildSongModalUrl } from './features/songs/utils/songModalNavigation';

// Lazy load pages
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AuditLogsPage = lazy(() => import('./features/admin/pages/AuditLogsPage'));
const ExportBest50Page = lazy(() => import('./pages/ExportBest50Page'));
const ViewPage = lazy(() => import('./pages/ViewPage'));
const SongsPage = lazy(() => import('./pages/SongsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const ProfileBest50Page = lazy(() => import('./pages/ProfileBest50Page'));
const SharedPlaylistsPage = lazy(() => import('./features/playlists/SharedPlaylistsPage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));

// Queue page content
function QueuePage() {
  return (
    <div className="App queue-page">
      <Container size="xl" py={0}>
        <Stack gap="lg">
          <div className="queue-page-branch">
            <BranchSelector />
          </div>
          <main className="animate-fade-in delay-100">
            <QueueManager />
          </main>
        </Stack>
      </Container>
    </div>
  );
}

function HomeRoute() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/feed" replace />;

  return <Navigate to="/queue" replace />;
}

function LegacySongRoute() {
  const { id } = useParams();
  const location = useLocation();
  return (
    <Navigate
      to={buildSongModalUrl(id, { cardType: location.state?.cardType, tab: 'community' })}
      replace
    />
  );
}

// Mantine must wrap ErrorBoundary so the boundary fallback (Mantine components) still has a provider.
function MantineAppShell() {
  const { isDark, currentTheme } = useTheme();
  const { user } = useAuth();

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

  // Check for per-user analytics opt-out
  const analyticsKey = user ? `smf_analytics_opt_out_${user.id}` : 'smf_analytics_opt_out_guest';
  const isOptedOut = localStorage.getItem(analyticsKey) === 'true';

  return (
    <MantineProvider theme={dynamicTheme} forceColorScheme={isDark ? 'dark' : 'light'}>
      <ErrorBoundary>
        <Notifications position="top-right" />
        <AppShell>
          <Suspense fallback={
            <Container size="xl" py="xl">
              <Stack align="center" justify="center" style={{ minHeight: '60vh' }}>
                <Loader size="xl" color="blue" type="bars" />
              </Stack>
            </Container>
          }>
            <Routes>
              <Route path="/profile/export" element={<ExportBest50Page />} />
              <Route path="/profile" element={<ProfileRedirect />} />
              <Route path="/queue" element={<QueuePage />} />
              <Route path="/view" element={<ViewPage />} />
              <Route path="/songs" element={<SongsPage />} />
              <Route path="/songs/:id" element={<LegacySongRoute />} />
              <Route path="/search" element={<Navigate to="/feed" replace />} />
              <Route path="/shared-playlists" element={<ProtectedRoute><SharedPlaylistsPage /></ProtectedRoute>} />
              <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="/p/:slug" element={<PublicProfilePage />} />
              <Route path="/p/:slug/best50" element={<ProfileBest50Page />} />
              <Route path="/" element={<HomeRoute />} />
              <Route path="*" element={<QueuePage />} />
            </Routes>
          </Suspense>
        </AppShell>
        <ConsentBanner />
        {!isOptedOut && <Analytics />}
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
