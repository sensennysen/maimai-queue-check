import { Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NotificationCenter from './NotificationCenter';
import UserAccountMenu from '../UserAccountMenu';
import { getActiveNavigationPath, getVisibleNavigation } from './navigation';

export default function MobileNavigation({ onOpenSearch, onOpenPreferences }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const navigation = getVisibleNavigation(user);
  const activePath = getActiveNavigationPath(location.pathname);

  return (
    <>
      <header className="app-mobile-header">
        <button type="button" className="app-mobile-brand" onClick={() => navigate(user ? '/feed' : '/queue')}>
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
                onClick={() => navigate(item.path)}
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
            <>
              <button type="button" className="app-icon-button" onClick={onOpenSearch} aria-label="Open search">
                <Search aria-hidden="true" />
              </button>
              <NotificationCenter />
            </>
          )}
          <UserAccountMenu onOpenPreferences={onOpenPreferences} showThemeToggleInMenu />
        </div>
      </header>

      <nav className="app-mobile-dock" aria-label="Primary navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.path;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={isActive ? 'is-active' : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
