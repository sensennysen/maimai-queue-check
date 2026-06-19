import { useState } from 'react';
import { ArrowLeft, Bell, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import UserAccountMenu from '../UserAccountMenu';
import { NotificationPanel } from './NotificationCenter';
import './MobileMorePanel.css';

export default function MobileMorePanel({ onClose, onOpenPreferences, notificationState }) {
  const { user } = useAuth();
  const [view, setView] = useState('menu');

  if (view === 'notifications') {
    return (
      <section className="mobile-more-page" aria-label="Notifications">
        <header className="mobile-more-page-header">
          <button type="button" onClick={() => setView('menu')} aria-label="Back to More">
            <ArrowLeft aria-hidden="true" />
          </button>
          <h2>Notifications</h2>
        </header>
        <div className="mobile-more-notifications">
          <NotificationPanel notificationState={notificationState} onNavigate={onClose} />
        </div>
      </section>
    );
  }

  const notificationsRow = user ? (
    <button type="button" className="mobile-more-row" onClick={() => setView('notifications')}>
      <span className="mobile-more-row-icon" aria-hidden="true">
        <Bell />
      </span>
      <span>Notifications</span>
      {notificationState.totalUnread > 0 && (
        <span className="mobile-more-unread" aria-label={`${notificationState.totalUnread} unread notifications`}>
          {notificationState.totalUnread > 99 ? '99+' : notificationState.totalUnread}
        </span>
      )}
      <ChevronRight aria-hidden="true" />
    </button>
  ) : null;

  return (
    <section className="mobile-more-page" aria-label="More">
      <UserAccountMenu
        variant="mobile-page"
        onOpenPreferences={onOpenPreferences}
        mobileLeadingContent={notificationsRow}
        onMobileNavigate={onClose}
      />
    </section>
  );
}
