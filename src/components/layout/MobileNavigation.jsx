import { useEffect, useState } from 'react';
import { Menu as MenuIcon, Search } from 'lucide-react';
import { useMediaQuery } from '@mantine/hooks';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationCenterView } from './NotificationCenter';
import UserAccountMenu from '../UserAccountMenu';
import MobileMorePanel from './MobileMorePanel';
import { getActiveNavigationPath, getVisibleNavigation } from './navigation';

export default function MobileNavigation({ onOpenSearch, onOpenPreferences }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRoles } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const navigation = getVisibleNavigation(user);
  const activePath = getActiveNavigationPath(location.pathname);
  const notificationState = useNotifications(user, userRoles);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  const navigateTo = (path) => {
    setMoreOpen(false);
    navigate(path);
  };

  return (
    <>
      <header className="app-mobile-header">
        <button type="button" className="app-mobile-brand" onClick={() => navigateTo(user ? '/feed' : '/queue')}>
          <span className="app-brand-mark" aria-hidden="true">m</span>
          <strong>mPQCheckPH</strong>
        </button>

        <nav className="app-tablet-nav" aria-label="Primary navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigateTo(item.path)}
                className={isActive ? 'is-active' : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="app-mobile-actions">
          {user && (
            <button type="button" className="app-icon-button" onClick={onOpenSearch} aria-label="Open search">
              <Search aria-hidden="true" />
            </button>
          )}
          {!isMobile && user && <NotificationCenterView notificationState={notificationState} />}
          {!isMobile && <UserAccountMenu onOpenPreferences={onOpenPreferences} showThemeToggleInMenu />}
        </div>
      </header>

      {isMobile && moreOpen && (
        <MobileMorePanel
          onClose={() => setMoreOpen(false)}
          onOpenPreferences={onOpenPreferences}
          notificationState={notificationState}
        />
      )}

      <nav className="app-mobile-dock" aria-label="Primary navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.path;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigateTo(item.path)}
              className={!moreOpen && isActive ? 'is-active' : undefined}
              aria-current={!moreOpen && isActive ? 'page' : undefined}
            >
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((value) => !value)}
          className={moreOpen ? 'is-active app-mobile-more-tab' : 'app-mobile-more-tab'}
          aria-current={moreOpen ? 'page' : undefined}
          aria-expanded={moreOpen}
        >
          <span className="app-mobile-more-icon">
            <MenuIcon aria-hidden="true" />
            {notificationState.totalUnread > 0 && (
              <span className="app-mobile-more-badge" aria-label={`${notificationState.totalUnread} unread notifications`}>
                {notificationState.totalUnread > 9 ? '9+' : notificationState.totalUnread}
              </span>
            )}
          </span>
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
