import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PreferencesModal from '../modals/PreferencesModal';
import AppSidebar from './AppSidebar';
import GlobalSearchDialog from './GlobalSearchDialog';
import MobileNavigation from './MobileNavigation';
import './AppShell.css';

const unframedRoutes = ['/view', '/profile/export'];

export default function AppShell({ children }) {
  const location = useLocation();
  const { user } = useAuth();
  const [searchOpened, setSearchOpened] = useState(false);
  const [preferencesOpened, setPreferencesOpened] = useState(false);
  const isUnframed = unframedRoutes.includes(location.pathname);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!user || event.defaultPrevented) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpened(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user]);

  if (isUnframed) return children;

  return (
    <>
      <MobileNavigation
        onOpenSearch={() => setSearchOpened(true)}
        onOpenPreferences={() => setPreferencesOpened(true)}
      />

      <div className="app-shell">
        <AppSidebar
          onOpenSearch={() => setSearchOpened(true)}
          onOpenPreferences={() => setPreferencesOpened(true)}
        />

        <div className="app-shell-main">
          {children}
        </div>
      </div>

      {user && (
        <>
          <GlobalSearchDialog opened={searchOpened} onOpenChange={setSearchOpened} />
          <PreferencesModal opened={preferencesOpened} onClose={() => setPreferencesOpened(false)} />
        </>
      )}
    </>
  );
}
