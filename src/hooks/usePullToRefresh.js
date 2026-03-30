import { useState, useRef } from 'react';

export function usePullToRefresh(onRefresh, disabled = false) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshingByPull, setIsRefreshingByPull] = useState(false);
  const pullStartYRef = useRef(null);
  const canPullRef = useRef(false);

  const triggerPullRefresh = async () => {
    if (isRefreshingByPull || disabled) return;
    setIsRefreshingByPull(true);
    try {
      await Promise.resolve(onRefresh());
    } finally {
      setTimeout(() => {
        setPullDistance(0);
        setIsRefreshingByPull(false);
      }, 240);
    }
  };

  const handleTouchStart = (e) => {
    if (window.scrollY > 0 || disabled || isRefreshingByPull) {
      pullStartYRef.current = null;
      canPullRef.current = false;
      return;
    }
    pullStartYRef.current = e.touches?.[0]?.clientY ?? null;
    canPullRef.current = true;
  };

  const handleTouchMove = (e) => {
    if (!canPullRef.current || pullStartYRef.current == null || disabled || isRefreshingByPull) return;
    const currentY = e.touches?.[0]?.clientY ?? pullStartYRef.current;
    const delta = currentY - pullStartYRef.current;
    if (delta <= 0) {
      setPullDistance(0);
      return;
    }
    const next = Math.min(96, delta * 0.5);
    setPullDistance(next);
  };

  const handleTouchEnd = async () => {
    canPullRef.current = false;
    pullStartYRef.current = null;
    if (pullDistance >= 64 && !disabled && !isRefreshingByPull) {
      await triggerPullRefresh();
      return;
    }
    setPullDistance(0);
  };

  return {
    pullDistance,
    isRefreshingByPull,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    }
  };
}
