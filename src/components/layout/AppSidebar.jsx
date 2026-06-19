import { Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import BranchSelector from './BranchSelector';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from './ThemeToggle';
import UserAccountMenu from '../UserAccountMenu';
import { getActiveNavigationPath, getVisibleNavigation } from './navigation';

export default function AppSidebar({ onOpenSearch, onOpenPreferences }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const navigation = getVisibleNavigation(user);
  const activePath = getActiveNavigationPath(location.pathname);

  return (
    <aside className="app-sidebar" aria-label="Primary navigation">
      <button type="button" className="app-brand" onClick={() => navigate(user ? '/feed' : '/queue')}>
        <span className="app-brand-mark" aria-hidden="true">m</span>
        <span>
          <strong>maiPaQueueCheck</strong>
          <small>Philippines</small>
        </span>
      </button>

      {user && (
        <button type="button" className="app-search-trigger" onClick={onOpenSearch}>
          <Search aria-hidden="true" />
          <span>Search</span>
          <kbd>⌘ K</kbd>
        </button>
      )}

      <nav className="app-sidebar-nav">
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

      <div className="app-sidebar-branch">
        <div className="app-sidebar-label">
          <span>Current branch</span>
        </div>
        <BranchSelector />
      </div>

      <div className="app-sidebar-spacer" aria-hidden="true" />

      <div className="app-sidebar-utilities">
        {user && <NotificationCenter />}
        <ThemeToggle />
        <span className="app-sidebar-utility-spacer" />
        <UserAccountMenu onOpenPreferences={onOpenPreferences} variant="sidebar" />
      </div>
    </aside>
  );
}
