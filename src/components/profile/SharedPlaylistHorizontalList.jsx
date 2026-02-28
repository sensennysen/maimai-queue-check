import { Box, Group, Image, Text } from '@mantine/core';
import { useMouseDragScroll } from '../../hooks/useMouseDragScroll';

export function SharedPlaylistHorizontalList({ songs, onSongClick }) {
  const { scrollRef, isDragging } = useMouseDragScroll();

  return (
    <div
      ref={scrollRef}
      className="hide-scrollbar"
      style={{
        display: 'flex',
        gap: '12px',
        paddingBottom: '4px',
        paddingTop: '4px',
        overflowX: 'auto',
        scrollBehavior: 'smooth',
        cursor: 'grab',
        width: '100%',
        userSelect: 'none'
      }}
    >
      <Group wrap="nowrap" gap="md" style={{ overflow: 'visible' }}>
        {songs.map((song, idx) => (
          <Image
            key={`${song.songId}-${idx}`}
            src={song.imageUrl}
            w={140}
            h={140}
            radius="md"
            fallbackSrc="https://placehold.co/140x140?text=?"
            fit="cover"
            style={{
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              pointerEvents: 'auto'
            }}
            className="song-jacket-hover"
            onClick={() => {
              if (!isDragging && onSongClick) {
                onSongClick();
              }
            }}
          />
        ))}
        {songs.length === 0 && (
          <Text size="sm" c="dimmed" fs="italic">No songs in this playlist.</Text>
        )}
      </Group>
    </div>
  );
}
