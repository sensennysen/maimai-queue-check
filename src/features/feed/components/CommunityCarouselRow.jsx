import { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { Box, ActionIcon } from '@mantine/core';
import IconChevronLeft from '@tabler/icons-react/dist/esm/icons/IconChevronLeft.mjs';
import IconChevronRight from '@tabler/icons-react/dist/esm/icons/IconChevronRight.mjs';

/**
 * Horizontal row: touch/trackpad scroll everywhere; on desktop only, optional prev/next buttons.
 * Scrollbars are hidden; desktop uses buttons instead.
 */
export function CommunityCarouselRow({
  children,
  isDesktop,
  rowClassName,
  scrollAmount = 280,
  watchKey,
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const left = scrollLeft > 2;
    const right = scrollLeft + clientWidth < scrollWidth - 2;
    setCanScrollLeft(left);
    setCanScrollRight(right);
  }, []);

  useLayoutEffect(() => {
    updateScrollState();
  }, [updateScrollState, watchKey]);

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

  const scrollByPage = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = el.clientWidth > 0 ? el.clientWidth * 0.92 : scrollAmount;
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  const scrollRow = (
    <Box
      ref={scrollRef}
      className={['community-carousel-scroll-row', rowClassName].filter(Boolean).join(' ').trim()}
    >
      {children}
    </Box>
  );

  if (!isDesktop) {
    return scrollRow;
  }

  return (
    <Box pos="relative" className="community-carousel-wrap community-carousel-wrap--desktop">
      {scrollRow}
      {canScrollLeft ? (
        <Box className="community-carousel-nav-wrap community-carousel-nav-wrap--left">
          <ActionIcon
            variant="default"
            className="community-carousel-nav"
            size="lg"
            radius="xl"
            onClick={() => scrollByPage(-1)}
            aria-label="Scroll left"
          >
            <IconChevronLeft size={18} stroke={2} />
          </ActionIcon>
        </Box>
      ) : null}
      {canScrollRight ? (
        <Box className="community-carousel-nav-wrap community-carousel-nav-wrap--right">
          <ActionIcon
            variant="default"
            className="community-carousel-nav"
            size="lg"
            radius="xl"
            onClick={() => scrollByPage(1)}
            aria-label="Scroll right"
          >
            <IconChevronRight size={18} stroke={2} />
          </ActionIcon>
        </Box>
      ) : null}
    </Box>
  );
}
