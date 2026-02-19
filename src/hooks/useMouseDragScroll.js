
import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * Hook to enable mouse drag scrolling on a container.
 * Returns ref to be attached to the scrollable element (viewport of ScrollArea)
 * and an isDragging boolean to prevent click events during drag.
 */
export function useMouseDragScroll() {
  const [node, setNode] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const isDown = useRef(false);

  // Set the ref via callback
  const scrollRef = useCallback((el) => {
    setNode(el);
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!isDown.current || !node) return;
    
    // Explicitly prevent default to stop text selection/native dragging
    e.preventDefault();
    
    const x = e.pageX;
    const walkX = x - startX.current;
    
    if (Math.abs(walkX) > 3) {
      setIsDragging(true);
    }
    // eslint-disable-next-line
    node.scrollLeft = startScrollLeft.current - walkX;
  }, [node]);

  const onMouseUp = useCallback(() => {
    if (!isDown.current) return;
    
    isDown.current = false;
    if (node) {
      node.style.cursor = 'grab';
    }
    document.body.style.removeProperty('user-select');
    
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    
    // Defer resetting isDragging to ensure click handlers have time to check it
    setTimeout(() => {
      setIsDragging(false);
    }, 100);
  }, [node, onMouseMove]);

  const onMouseDown = useCallback((e) => {
    if (!node) return;

    // Only handle left click (0) and ignore if clicking on interactive elements
    if (e.button !== 0) return;
    if (e.target.closest('button, a, input, [role="button"]')) return;

    // Prevent default to stop browser selection/ghost dragging
    e.preventDefault();

    isDown.current = true;
    startX.current = e.pageX;
    startScrollLeft.current = node.scrollLeft;
    
    node.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [node, onMouseMove, onMouseUp]);

  useEffect(() => {
    if (node) {
      node.style.cursor = 'grab';
      node.addEventListener('mousedown', onMouseDown);

      return () => {
        node.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [node, onMouseDown, onMouseMove, onMouseUp]);

  return { scrollRef, isDragging };
}
