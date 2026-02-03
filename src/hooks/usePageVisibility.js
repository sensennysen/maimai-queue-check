import { useState, useEffect } from 'react';

/**
 * Hook to track page visibility and execute a callback when it changes
 * @param {Function} onVisible - Callback to run when page becomes visible
 */
export const usePageVisibility = (onVisible) => {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isCurrentlyVisible = !document.hidden;
      setIsVisible(isCurrentlyVisible);
      
      if (isCurrentlyVisible && onVisible) {
        onVisible();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onVisible]);

  return isVisible;
};
