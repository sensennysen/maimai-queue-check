import { useState, useRef } from 'react';
import { Paper, Group, Title, Box, Image, Text, ActionIcon } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconStar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { DIFFICULTY_COLORS, BASE_JACKET_URL } from '../../../config/maimai-constants';

/**
 * MostPlayedSection — ranked table layout with carousel-style pagination, swipe support, and slide animation
 */
export function MostPlayedSection({
  profile,
  privacy,
  isOwner,
  songMapByTitle,
  onSongClick
}) {
  const songs = profile?.maimai_best_scores?.most_played;
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState('next'); // 'next' or 'prev'
  const itemsPerPage = 5;
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Swipe handling refs
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const minSwipeDistance = 50;

  if (!songs || songs.length === 0) return null;

  const totalPages = Math.ceil(songs.length / itemsPerPage);

  // Paginated songs for current view
  const visibleSongs = songs.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setDirection('next');
      setCurrentPage(p => p + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setDirection('prev');
      setCurrentPage(p => p - 1);
    }
  };

  // Swipe logic
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

    if (distance > 0) handleNext(); // swipe left -> next
    else handlePrev(); // swipe right -> prev
  };

  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder className="animate-fade-in delay-400">
      {/* Animation keyframes */}
      <style>
        {`
          @keyframes slideInFromRight {
            from { transform: translateX(20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideInFromLeft {
            from { transform: translateX(-20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .most-played-slide-next {
            animation: slideInFromRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .most-played-slide-prev {
            animation: slideInFromLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}
      </style>

      <Group justify="space-between" mb="md" align="center">
        <Group gap="xs">
          <IconStar size={22} style={{ color: 'var(--theme-primary)', fill: 'var(--theme-primary)' }} />
          <Title order={2}>Most Played Songs</Title>
        </Group>

        {totalPages > 1 && !isMobile && (
          <Group gap={6}>
            <ActionIcon
              variant="light"
              color="primary"
              radius="xl"
              onClick={handlePrev}
              disabled={currentPage === 0}
              size="md"
              style={{
                opacity: currentPage === 0 ? 0.3 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <IconChevronLeft size={16} />
            </ActionIcon>
            <ActionIcon
              variant="light"
              color="primary"
              radius="xl"
              onClick={handleNext}
              disabled={currentPage === totalPages - 1}
              size="sm"
              style={{
                opacity: currentPage === totalPages - 1 ? 0.3 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <IconChevronRight size={16} />
            </ActionIcon>
          </Group>
        )}
      </Group>

      {/* Table wrapping Box handles touch events and page transition animation */}
      <Box
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        key={currentPage} // Triggers animation on page change
        className={direction === 'next' ? 'most-played-slide-next' : 'most-played-slide-prev'}
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 0, 
          minHeight: 52 * 5,
          touchAction: 'pan-y'
        }}
      >
        {visibleSongs.map((song, localIndex) => {
          const globalIndex = currentPage * itemsPerPage + localIndex;
          const matchedSong = songMapByTitle?.get(song.title);
          const canViewDetails = isOwner || privacy.show_most_played_details === true;
          const diffColor = DIFFICULTY_COLORS[song.difficulty];
          const isEven = localIndex % 2 === 0;

          return (
            <Box
              key={globalIndex}
              onClick={() => canViewDetails && onSongClick(song, matchedSong)}
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 44px 1fr auto',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 6px',
                borderRadius: 10,
                cursor: canViewDetails ? 'pointer' : 'default',
                backgroundColor: isEven
                  ? 'transparent'
                  : 'color-mix(in srgb, var(--theme-primary) 4%, transparent)',
                transition: 'background-color 0.15s ease, transform 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!canViewDetails || isMobile) return;
                e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--theme-primary) 8%, transparent)';
                e.currentTarget.style.transform = 'translateX(2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = isEven
                  ? 'transparent'
                  : 'color-mix(in srgb, var(--theme-primary) 4%, transparent)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              {/* Rank number */}
              <Text
                size="sm"
                fw={globalIndex < 3 ? 900 : 600}
                ta="center"
                style={{
                  color: globalIndex === 0
                    ? '#FFB300'
                    : globalIndex === 1
                      ? '#A8A8A8'
                      : globalIndex === 2
                        ? '#B87333'
                        : 'var(--theme-text-muted)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: globalIndex < 3 ? '14px' : '12px',
                  lineHeight: 1,
                }}
              >
                {globalIndex + 1}
              </Text>

              {/* Album art thumbnail */}
              <Box
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: 'var(--theme-surface)'
                }}
              >
                <Image
                  src={matchedSong?.imageUrl || (song.imageName ? `${BASE_JACKET_URL}${song.imageName}` : null)}
                  alt={song.title}
                  fit="cover"
                  fallbackSrc="https://placehold.co/44x44?text=?"
                  style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>

              {/* Title + difficulty */}
              <Box style={{ minWidth: 0 }}>
                <Text
                  size="md"
                  fw={700}
                  lineClamp={1}
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--theme-text-primary)',
                    marginBottom: 2,
                    fontSize: '0.9rem'
                  }}
                >
                  {song.title}
                </Text>
                <Group gap={6} align="center" wrap="nowrap">
                  {/* Difficulty pill */}
                  {song.difficulty && (
                    <Box
                      style={{
                        background: diffColor || 'rgba(150,150,150,0.5)',
                        color: 'white',
                        padding: '1px 6px',
                        borderRadius: 6,
                        fontSize: '10px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        flexShrink: 0,
                        lineHeight: '14px',
                      }}
                    >
                      {song.difficulty}
                    </Box>
                  )}
                </Group>
              </Box>

              {/* Play count */}
              <Box style={{ textAlign: 'right', flexShrink: 0 }}>
                <Text
                  fw={900}
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '15px',
                    lineHeight: 1,
                    color: 'var(--theme-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {song.play_count}
                </Text>
                <Text
                  size="11px"
                  style={{ color: 'var(--theme-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                >
                  plays
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Dots Indicator */}
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
                  ? 'var(--theme-primary)'
                  : 'color-mix(in srgb, var(--theme-primary) 20%, transparent)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
          ))}
        </Group>
      )}
    </Paper>
  );
}
