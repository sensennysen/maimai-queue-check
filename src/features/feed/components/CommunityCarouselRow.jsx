import { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { Box } from '@mantine/core';

/**
 * Horizontal row with native touch/trackpad scrolling, optional mouse dragging,
 * centered card snapping, and pagination dots.
 */
export function CommunityCarouselRow({
  children,
  rowClassName,
  watchKey,
  itemCount = 0,
  showIndicators = false,
  centerItems = false,
  draggable = false,
  onEndReached,
  preserveScrollOnWatchChange = false,
  ariaLabel = 'Carousel',
}) {
  const scrollRef = useRef(null);
  const endReachedItemCountRef = useRef(0);
  const dragRef = useRef({
    active: false,
    captured: false,
    pointerId: null,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
  });
  const suppressClickUntilRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const getItems = useCallback(() => {
    const inner = scrollRef.current?.firstElementChild;
    return inner ? Array.from(inner.children) : [];
  }, []);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, clientWidth } = el;
    const items = getItems();
    const viewportCenter = scrollLeft + clientWidth / 2;
    const viewportRect = el.getBoundingClientRect();

    if (items.length > 0) {
      if (scrollLeft <= 2) {
        setActiveIndex(0);
        if (
          onEndReached
          && el.scrollWidth <= clientWidth + 2
          && endReachedItemCountRef.current !== items.length
        ) {
          endReachedItemCountRef.current = items.length;
          onEndReached();
        }
        return;
      }

      if (scrollLeft >= el.scrollWidth - clientWidth - 2) {
        setActiveIndex(items.length - 1);
        if (onEndReached && endReachedItemCountRef.current !== items.length) {
          endReachedItemCountRef.current = items.length;
          onEndReached();
        }
        return;
      }

      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      items.forEach((item, index) => {
        const itemRect = item.getBoundingClientRect();
        const itemCenter = itemRect.left - viewportRect.left + scrollLeft + itemRect.width / 2;
        const distance = Math.abs(itemCenter - viewportCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex(closestIndex);
    }
  }, [getItems, onEndReached]);

  const scrollToIndex = useCallback((index, behavior = 'smooth') => {
    const el = scrollRef.current;
    const items = getItems();
    const target = items[Math.max(0, Math.min(index, items.length - 1))];
    if (!el || !target) return;

    const viewportRect = el.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetCenter = targetRect.left - viewportRect.left + el.scrollLeft + targetRect.width / 2;
    const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
    const targetLeft = Math.max(0, Math.min(targetCenter - el.clientWidth / 2, maxScrollLeft));
    el.scrollTo({ left: targetLeft, behavior });
  }, [getItems]);

  useLayoutEffect(() => {
    if (!preserveScrollOnWatchChange) {
      setActiveIndex(0);
      if (scrollRef.current) scrollRef.current.scrollLeft = 0;
    }
    updateScrollState();
  }, [preserveScrollOnWatchChange, updateScrollState, watchKey]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(() => {
      updateScrollState();
    });
    ro.observe(el);
    const inner = el.firstElementChild;
    if (inner) ro.observe(inner);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, watchKey]);

  const handlePointerDown = (event) => {
    if (!draggable || event.pointerType === 'touch' || event.button !== 0) return;
    const el = scrollRef.current;
    if (!el) return;

    dragRef.current = {
      active: true,
      captured: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: el.scrollLeft,
      moved: false,
    };
  };

  const handlePointerMove = (event) => {
    const el = scrollRef.current;
    const drag = dragRef.current;
    if (!el || !drag.active) return;

    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 4 && !drag.moved) {
      drag.moved = true;
      drag.captured = true;
      el.setPointerCapture(event.pointerId);
      el.classList.add('community-carousel-scroll-row--dragging');
    }

    if (!drag.moved) return;
    event.preventDefault();
    el.scrollLeft = drag.startScrollLeft - delta;
  };

  const finishDrag = (event) => {
    const el = scrollRef.current;
    const drag = dragRef.current;
    if (!el || !drag.active) return;

    if (drag.captured && el.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
    if (drag.captured) el.classList.remove('community-carousel-scroll-row--dragging');
    drag.active = false;
    drag.captured = false;
    drag.pointerId = null;

    if (drag.moved) {
      suppressClickUntilRef.current = Date.now() + 250;
      scrollToIndex(activeIndex);
    }
  };

  return (
    <Box
      pos="relative"
      className={[
        'community-carousel-wrap',
        showIndicators ? 'community-carousel-wrap--with-indicators' : '',
      ].filter(Boolean).join(' ')}
      role="region"
      aria-label={ariaLabel}
    >
      <Box
        ref={scrollRef}
        className={[
          'community-carousel-scroll-row',
          centerItems ? 'community-carousel-scroll-row--centered' : '',
          draggable ? 'community-carousel-scroll-row--draggable' : '',
          rowClassName,
        ].filter(Boolean).join(' ').trim()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onDragStart={(event) => event.preventDefault()}
        onClickCapture={(event) => {
          if (Date.now() < suppressClickUntilRef.current) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        {children}
      </Box>

      {showIndicators && itemCount > 1 ? (
        <Box className="community-carousel-indicators" role="group" aria-label={`${ariaLabel} navigation`}>
          {Array.from({ length: itemCount }, (_, index) => (
            <button
              key={index}
              type="button"
              className={[
                'community-carousel-indicator',
                index === activeIndex ? 'community-carousel-indicator--active' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => scrollToIndex(index)}
              aria-label={`Go to card ${index + 1} of ${itemCount}`}
              aria-current={index === activeIndex ? 'true' : undefined}
            />
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
