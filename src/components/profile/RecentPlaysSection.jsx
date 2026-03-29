import { useState, useCallback, useRef, memo } from 'react';
import {
  Paper, Group, Title, Box, Text, ActionIcon, Image,
  Modal
} from '@mantine/core';
import { useMediaQuery, useDisclosure } from '@mantine/hooks';
import {
  IconHistory, IconChevronLeft, IconChevronRight,
  IconInfoCircle
} from '@tabler/icons-react';
import { useRecentPlays } from '../../features/profile/hooks/useRecentPlays';
import { DIFFICULTY_COLORS, normalizeDifficulty, BASE_JACKET_URL } from '../../config/maimai-constants';
import { getRelativeTime } from '../../utils/formatters';
import { getGrade } from '../../utils/maimai-calc';
import { RecentPlayDetails } from './RecentPlayDetails';

const ITEMS_PER_PAGE = 10;

/* ─────────────────────────── Row ─────────────────────────── */
const RecentPlayRow = memo(({ play, globalIndex, onClick, isMobile, songMap }) => {
  const diffLabel = normalizeDifficulty(play.difficulty);
  const diffColor = DIFFICULTY_COLORS[diffLabel] || 'gray';
  const jacketUrl = songMap?.get(play.title) || play.jacket_url;
  const grade = getGrade(play.achievement);
  const isEven = globalIndex % 2 === 0;

  return (
    <Box
      onClick={() => onClick(play)}
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '36px 1fr auto' : '44px 1fr auto',
        alignItems: 'center',
        gap: isMobile ? '8px' : '10px',
        padding: '8px 6px',
        borderRadius: 10,
        cursor: 'pointer',
        backgroundColor: isEven
          ? 'transparent'
          : 'color-mix(in srgb, var(--theme-secondary) 5%, transparent)',
        transition: 'background-color 0.15s ease, transform 0.15s ease',
      }}
      onMouseEnter={e => {
        if (isMobile) return;
        e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--theme-secondary) 10%, transparent)';
        e.currentTarget.style.transform = 'translateX(2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = isEven
          ? 'transparent'
          : 'color-mix(in srgb, var(--theme-secondary) 5%, transparent)';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      {/* Jacket thumbnail */}
      <Box
        style={{
          width: isMobile ? 36 : 44,
          height: isMobile ? 36 : 44,
          borderRadius: 8,
          overflow: 'hidden',
          flexShrink: 0,
          background: 'var(--theme-surface)',
          position: 'relative',
        }}
      >
        <Box
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: diffColor,
            zIndex: 1,
          }}
        />
        <Image
          src={jacketUrl || (play.imageName ? `${BASE_JACKET_URL}${play.imageName}` : null)}
          alt={play.title}
          fit="cover"
          fallbackSrc="https://placehold.co/44x44?text=?"
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </Box>

      {/* Title + meta */}
      <Box style={{ minWidth: 0 }}>
        <Text
          size="sm"
          fw={700}
          lineClamp={1}
          style={{
            fontFamily: 'var(--font-heading)',
            color: 'var(--theme-text-primary)',
            marginBottom: 2,
            fontSize: isMobile ? '0.78rem' : '0.85rem',
          }}
        >
          {play.title}
        </Text>
        <Group gap={6} align="center" wrap="nowrap">
          <Box
            style={{
              background: diffColor,
              color: 'white',
              padding: '1px 6px',
              borderRadius: 6,
              fontSize: '8px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              lineHeight: '13px',
              flexShrink: 0,
            }}
          >
            {diffLabel} {play.level}
          </Box>
          <Text
            size="xs"
            style={{ color: 'var(--theme-text-muted)', fontSize: '10px' }}
          >
            {getRelativeTime(play.played_at)}
          </Text>
        </Group>
      </Box>

      {/* Achievement */}
      <Group gap={8} wrap="nowrap" align="center" style={{ flexShrink: 0 }}>
        <Box style={{ textAlign: 'right' }}>
          <Text
            fw={900}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: isMobile ? '13px' : '15px',
              lineHeight: 1,
              color: 'var(--theme-secondary)',
              letterSpacing: '-0.02em',
            }}
          >
            {parseFloat(play.achievement).toFixed(isMobile ? 2 : 4)}%
          </Text>
          <Text
            style={{
              fontSize: '9px',
              color: 'var(--theme-text-muted)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {grade}
          </Text>
        </Box>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          onClick={e => { e.stopPropagation(); onClick(play); }}
        >
          <IconInfoCircle size={16} />
        </ActionIcon>
      </Group>
    </Box>
  );
});
RecentPlayRow.displayName = 'RecentPlayRow';

/* ─────────────────────────── Section ─────────────────────────── */
export const RecentPlaysSection = memo(({ userId, initialData }) => {
  const { plays, loading, songMap } = useRecentPlays(userId, initialData);
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState('next');
  const [selectedPlay, setSelectedPlay] = useState(null);
  const [opened, { open, close }] = useDisclosure(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Swipe handling
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const minSwipeDistance = 50;

  const totalPages = Math.ceil(plays.length / ITEMS_PER_PAGE);
  const visiblePlays = plays.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setDirection('next');
      setCurrentPage(p => p + 1);
    }
  }, [currentPage, totalPages]);

  const handlePrev = useCallback(() => {
    if (currentPage > 0) {
      setDirection('prev');
      setCurrentPage(p => p - 1);
    }
  }, [currentPage]);

  const handleRowClick = useCallback((play) => {
    setSelectedPlay(play);
    open();
  }, [open]);

  const onTouchStart = (e) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const onTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (Math.abs(distance) < minSwipeDistance) return;
    if (distance > 0) handleNext();
    else handlePrev();
  };

  if (loading || plays.length === 0) return null;

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder className="animate-fade-in delay-500">
      <style>{`
        @keyframes recentSlideFromRight {
          from { transform: translateX(20px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes recentSlideFromLeft {
          from { transform: translateX(-20px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        .recent-slide-next { animation: recentSlideFromRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .recent-slide-prev { animation: recentSlideFromLeft  0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* Header */}
      <Group justify="space-between" mb="md" align="center">
        <Group gap="xs">
          <IconHistory size={22} style={{ color: 'var(--theme-secondary)' }} />
          <Title order={2}>Recent Plays</Title>
        </Group>

        {totalPages > 1 && !isMobile && (
          <Group gap={6}>
            <ActionIcon
              variant="light"
              color="secondary"
              radius="xl"
              onClick={handlePrev}
              disabled={currentPage === 0}
              size="sm"
              style={{ opacity: currentPage === 0 ? 0.3 : 1, transition: 'all 0.2s ease' }}
            >
              <IconChevronLeft size={16} />
            </ActionIcon>
            <ActionIcon
              variant="light"
              color="secondary"
              radius="xl"
              onClick={handleNext}
              disabled={currentPage === totalPages - 1}
              size="sm"
              style={{ opacity: currentPage === totalPages - 1 ? 0.3 : 1, transition: 'all 0.2s ease' }}
            >
              <IconChevronRight size={16} />
            </ActionIcon>
          </Group>
        )}
      </Group>

      {/* Play rows — animated on page change */}
      <Box
        key={currentPage}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={direction === 'next' ? 'recent-slide-next' : 'recent-slide-prev'}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          minHeight: 52 * ITEMS_PER_PAGE,
          touchAction: 'pan-y',
        }}
      >
        {visiblePlays.map((play, localIndex) => {
          const globalIndex = currentPage * ITEMS_PER_PAGE + localIndex;
          return (
            <RecentPlayRow
              key={play.id || globalIndex}
              play={play}
              globalIndex={globalIndex}
              onClick={handleRowClick}
              isMobile={isMobile}
              songMap={songMap}
            />
          );
        })}
      </Box>

      {/* Dot page indicator */}
      {totalPages > 1 && (
        <Group justify="center" gap={6} mt="md">
          {Array.from({ length: totalPages }).map((_, i) => (
            <Box
              key={i}
              onClick={() => {
                setDirection(i > currentPage ? 'next' : 'prev');
                setCurrentPage(i);
              }}
              style={{
                width: i === currentPage ? 18 : 6,
                height: 6,
                borderRadius: 999,
                background: i === currentPage
                  ? 'var(--theme-secondary)'
                  : 'color-mix(in srgb, var(--theme-secondary) 20%, transparent)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          ))}
        </Group>
      )}

      {/* Play Details Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={<Text fw={900} style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Play Details</Text>}
        centered
        size="lg"
        radius="md"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        transitionProps={{ transition: 'slide-up', duration: 250 }}
      >
        {selectedPlay && (
          <RecentPlayDetails
            play={selectedPlay}
            isMobile={isMobile}
            songMap={songMap}
          />
        )}
      </Modal>
    </Paper>
  );
});

RecentPlaysSection.displayName = 'RecentPlaysSection';
