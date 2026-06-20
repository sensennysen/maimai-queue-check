import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Paper, Group, Text, Avatar, Badge, Stack, Box, UnstyledButton } from '@mantine/core';
import IconChevronRight from '@tabler/icons-react/dist/esm/icons/IconChevronRight.mjs';
import IconMessageCircle from '@tabler/icons-react/dist/esm/icons/IconMessageCircle.mjs';
import IconMusic from '@tabler/icons-react/dist/esm/icons/IconMusic.mjs';
import { getCompactRelativeTime, getRelativeTime, getProfileImageUrl } from '../../utils/formatters';

const CATEGORY_COLORS = {
  'POPS & ANIME': 'pink',
  niconico: 'red',
  '\u6771\u65b9Project': 'cyan',
  'GAME & VARIETY': 'violet',
  maimai: 'yellow',
  'ORIGINAL & JOYPOLIS': 'teal',
  '\u30b2\u30ad\u30c1\u30e5\u30a6MAI': 'orange',
};

export function FeedSongCard({ song, songId, latestComment, onClick, variant = 'new', className }) {
  const displayTitle = song?.title || songId || 'Unknown Song';
  const displayArtist = song?.artist;
  const category = song?.category;
  const categoryColor = CATEGORY_COLORS[category] || 'gray';
  const isTrending = variant === 'trending';
  const isDiscussion = variant === 'discussion' || isTrending;
  const [artworkFailed, setArtworkFailed] = useState(false);
  const categories = (Array.isArray(song?.categories) ? song.categories : [category]).filter(Boolean);
  const visibleCategories = categories.slice(0, 2);
  const hiddenCategoryCount = Math.max(0, categories.length - visibleCategories.length);
  const authorName = latestComment?.author?.display_name || 'Someone';

  useEffect(() => {
    setArtworkFailed(false);
  }, [song?.imageUrl]);

  const handleKeyDown = (event) => {
    if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onClick();
  };

  const songArtwork = song?.imageUrl && !artworkFailed ? (
    <img
      src={song.imageUrl}
      alt={`${displayTitle} jacket`}
      className="community-activity-cover-image"
      onError={() => setArtworkFailed(true)}
    />
  ) : (
    <Box className="community-activity-cover-placeholder" aria-label={`${displayTitle} jacket unavailable`}>
      <IconMusic size={24} />
    </Box>
  );

  if (variant === 'attachment') {
    return (
      <UnstyledButton
        type="button"
        onClick={onClick}
        aria-label={`Open song reference for ${displayTitle}`}
        className={`community-post-song-attachment ${className || ''}`.trim()}
      >
        <Box className="community-post-song-jacket">
          {songArtwork}
        </Box>

        <Box className="community-post-song-copy">
          <Group gap={6} wrap="nowrap">
            <Text fw={650} size="sm" lineClamp={1} className="community-post-song-title">
              {displayTitle}
            </Text>
            {category && (
              <Badge size="xs" color={categoryColor} variant="light" className="community-post-song-tag">
                {category}
              </Badge>
            )}
          </Group>
          <Text size="xs" c="dimmed" lineClamp={1} className="community-post-song-subtitle">
            {displayArtist || 'Unknown artist'}
          </Text>
        </Box>

        <IconChevronRight
          size={18}
          stroke={1.8}
          className="community-post-song-chevron"
          aria-hidden="true"
        />
      </UnstyledButton>
    );
  }

  if (isTrending) {
    return (
      <Paper
        component={Link}
        to={`/songs/${songId}`}
        p={0}
        radius="md"
        withBorder
        aria-label={`Open discussion for ${displayTitle}`}
        className={`community-trending-card community-discussion-card ${className || ''}`.trim()}
      >
        <Box className="community-discussion-info-zone">
          <Box className="community-discussion-jacket">
            {songArtwork}
          </Box>

          <Box className="community-discussion-song-copy">
            <Text fw={600} size="md" className="community-discussion-title" title={displayTitle}>
              {displayTitle}
            </Text>
            <Text component="div" size="sm" className="community-discussion-metadata">
              <Text component="span" inherit className="community-discussion-artist">
                {displayArtist || 'Unknown artist'}
              </Text>
              {visibleCategories.length > 0 && (
                <>
                  <Text component="span" inherit className="community-discussion-separator"> · </Text>
                  <Text component="span" inherit className="community-discussion-categories">
                    {visibleCategories.join(' · ')}
                    {hiddenCategoryCount > 0 ? ` +${hiddenCategoryCount}` : ''}
                  </Text>
                </>
              )}
            </Text>
          </Box>

          <IconChevronRight size={18} stroke={1.8} className="community-discussion-chevron" aria-hidden="true" />
        </Box>

        <Box className="community-discussion-activity-strip">
          {latestComment ? (
            <Group gap="xs" wrap="nowrap" align="flex-start" className="community-discussion-activity-row">
              <Avatar
                src={getProfileImageUrl(latestComment.author)}
                alt={authorName}
                size={22}
                radius="xl"
                color="blue"
                className="community-discussion-avatar"
              >
                {authorName.charAt(0).toUpperCase()}
              </Avatar>
              <Text
                component="p"
                size="sm"
                className="community-discussion-reply-copy"
                title={latestComment.content || `${authorName} replied`}
              >
                <Text component="span" inherit fw={600} className="community-discussion-reply-author">
                  {authorName}
                </Text>
                {latestComment.content ? ` ${latestComment.content}` : ' replied'}
              </Text>
              <Text component="time" size="xs" className="community-discussion-timestamp">
                {getCompactRelativeTime(latestComment.createdAt)}
              </Text>
            </Group>
          ) : (
            <Text size="sm" className="community-discussion-empty-reply">
              No replies yet
            </Text>
          )}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      p="sm"
      radius="md"
      withBorder
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      className={`glass-effect-hover ${className || ''}`.trim()}
    >
      <Group gap={isTrending ? 'md' : 'sm'} wrap="nowrap" align="center">
        <Box
          className={isTrending ? 'community-trending-jacket' : undefined}
          style={{
            width: isTrending ? 220 : 48,
            height: isTrending ? 120 : 48,
            borderRadius: 'var(--mantine-radius-md)',
            overflow: 'hidden',
            flexShrink: 0,
            backgroundColor: 'var(--mantine-color-default-hover)',
          }}
        >
          {song?.imageUrl ? (
            <img
              src={song.imageUrl}
              alt={displayTitle}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = '';
                e.currentTarget.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--theme-primary)"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg></div>';
              }}
            />
          ) : (
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--theme-primary)',
              }}
            >
              <IconMusic size={isTrending ? 32 : 20} />
            </Box>
          )}
        </Box>

        <Box style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <Group gap={6} wrap="wrap" mb={2}>
            <Text fw={700} size={isTrending ? 'xl' : 'sm'} lineClamp={1} style={{ maxWidth: '100%' }}>
              {displayTitle}
            </Text>
            {category && (
              <Badge size="xs" color={categoryColor} variant="light" style={{ flexShrink: 0 }}>
                {category}
              </Badge>
            )}
          </Group>
          {displayArtist && (
            <Text size={isTrending ? 'sm' : 'xs'} c="dimmed" lineClamp={1}>
              {displayArtist}
            </Text>
          )}

          {isDiscussion && latestComment && (
            <Group gap={6} mt={6} wrap="nowrap" align="flex-start">
              <Avatar
                src={getProfileImageUrl(latestComment.author)}
                size={isTrending ? 24 : 18}
                radius="xl"
                color="blue"
              >
                {(latestComment.author?.display_name || '?').charAt(0)}
              </Avatar>
              <Stack gap={0} style={{ flex: 1, overflow: 'hidden' }}>
                <Text size={isTrending ? 'sm' : 'xs'} c="dimmed" lineClamp={1}>
                  <Text span fw={500} c="var(--mantine-color-text)">
                    {latestComment.author?.display_name || 'Someone'}
                  </Text>
                  {' commented - '}{getRelativeTime(latestComment.createdAt)}
                </Text>
                {latestComment.content && (
                  <Text size={isTrending ? 'sm' : 'xs'} c="dimmed" lineClamp={isTrending ? 2 : 1} fs="italic">
                    "{latestComment.content}"
                  </Text>
                )}
              </Stack>
            </Group>
          )}

          {variant === 'new' && song?.releaseDate && (
            <Text size="xs" c="dimmed" mt={2}>
              Added {getRelativeTime(song.releaseDate)}
            </Text>
          )}
        </Box>

        {isDiscussion && !isTrending && (
          <Box style={{ color: 'var(--theme-primary)', opacity: 0.6, flexShrink: 0 }}>
            <IconMessageCircle size={16} />
          </Box>
        )}
      </Group>
    </Paper>
  );
}
