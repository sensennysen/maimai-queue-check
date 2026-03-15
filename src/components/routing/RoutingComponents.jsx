import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Component to handle redirection from /profile to the user's specific public profile slug.
 */
export function ProfileRedirect() {
  const { user, userRoles, loading: authLoading } = useAuth();
  
  if (authLoading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (userRoles?.slug) return <Navigate to={`/p/${userRoles.slug}`} replace />;
  
  // If no slug yet, fallback to main app
  return <Navigate to="/" replace />;
}

/**
 * Component to protect routes that require authentication.
 */
export function ProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  
  if (authLoading) return null;
  if (!user) return <Navigate to="/" replace />;
  
  return children;
}
