import { useState, useEffect } from 'react';

/**
 * Hook to track whether the document/page is currently visible and active.
 * Executes a provided callback whenever the visibility state transitions to 'visible'.
 * @param {Function} onVisible - Callback function to run when the page becomes visible.
 * @returns {boolean} The current visibility status (true if visible).
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
