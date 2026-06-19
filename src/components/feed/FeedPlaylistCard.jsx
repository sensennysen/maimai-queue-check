import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Paper, Group, Text, Avatar, Box } from '@mantine/core';
import IconChevronRight from '@tabler/icons-react/dist/esm/icons/IconChevronRight.mjs';
import IconMusic from '@tabler/icons-react/dist/esm/icons/IconMusic.mjs';
import IconMessageCircle from '@tabler/icons-react/dist/esm/icons/IconMessageCircle.mjs';
import { useSongDatabaseContext } from '../../hooks/useSongDatabaseContext';
import { getCompactRelativeTime, getRelativeTime, getProfileImageUrl } from '../../utils/formatters';

function PlaylistCover({ covers, title }) {
  const [failedCovers, setFailedCovers] = useState(() => new Set());
  const visibleCovers = covers.filter((src) => !failedCovers.has(src));

  if (visibleCovers.length === 0) {
    return (
      <Box
        role="img"
        aria-label={`Cover art unavailable for ${title}`}
        className="community-playlist-cover community-activity-cover-placeholder"
      >
        <IconMusic size={24} />
      </Box>
    );
  }

  return (
    <Box
      role="img"
      aria-label={`Cover art for ${title}`}
      className={`community-playlist-cover community-playlist-cover--${Math.min(visibleCovers.length, 4)}`}
    >
      {visibleCovers.map((src, index) => (
        <img
          key={`${src}-${index}`}
          src={src}
          alt=""
          onError={() => setFailedCovers((current) => new Set(current).add(src))}
        />
      ))}
    </Box>
  );
}

export function FeedPlaylistCard({ post, latestComment, onClick, className, layout = 'default' }) {
  const { songMapById } = useSongDatabaseContext();

  if (!post) return null;

  const author = post.author;
  const playlist = post.playlist;
  const songCount = playlist?.songs?.length || 0;
  const isStrip = layout === 'strip';
  const playlistTitle = playlist?.title || 'Untitled Playlist';
  const creatorName = author?.display_name || 'Unknown';
  const commentAuthorName = latestComment?.author?.display_name || 'Someone';
  const covers = (playlist?.songs || [])
    .map((entry) => {
      const song = entry.song_id ? songMapById?.get(entry.song_id) : entry;
      return song?.imageUrl || song?.image_url;
    })
    .filter(Boolean)
    .slice(0, 4);

  const handleKeyDown = (event) => {
    if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onClick();
  };

  if (isStrip) {
    return (
      <Paper
        component={Link}
        to={post.id ? `/shared-playlists?post=${post.id}` : '/shared-playlists'}
        p={0}
        radius="md"
        withBorder
        aria-label={`Open playlist ${playlistTitle}`}
        className={`community-playlist-strip community-discussion-card ${className || ''}`.trim()}
      >
        <Box className="community-playlist-info-zone">
          <PlaylistCover covers={covers} title={playlistTitle} />

          <Box className="community-playlist-info-copy">
            <Text fw={600} size="md" className="community-playlist-title" title={playlistTitle}>
              {playlistTitle}
            </Text>
            <Group gap={5} wrap="wrap" className="community-playlist-metadata">
              <Avatar
                src={getProfileImageUrl(author)}
                alt={creatorName}
                size={16}
                radius="xl"
                color="grape"
                className="community-playlist-creator-avatar"
              >
                {creatorName.charAt(0).toUpperCase()}
              </Avatar>
              <Text component="span" size="xs" fw={600} className="community-playlist-creator">
                {creatorName}
              </Text>
              <Text component="span" size="xs" className="community-playlist-metadata-detail">
                · {songCount} song{songCount !== 1 ? 's' : ''} · shared {getCompactRelativeTime(post.created_at)}
              </Text>
            </Group>
          </Box>

          <IconChevronRight size={18} stroke={1.8} className="community-discussion-chevron" aria-hidden="true" />
        </Box>

        <Box className="community-discussion-activity-strip">
          {latestComment ? (
            <Group gap="xs" wrap="nowrap" align="flex-start" className="community-discussion-activity-row">
              <Avatar
                src={getProfileImageUrl(latestComment.author)}
                alt={commentAuthorName}
                size={22}
                radius="xl"
                color="blue"
                className="community-discussion-avatar"
              >
                {commentAuthorName.charAt(0).toUpperCase()}
              </Avatar>
              <Text
                component="p"
                size="sm"
                className="community-discussion-reply-copy"
                title={latestComment.content || `${commentAuthorName} commented`}
              >
                <Text component="span" inherit fw={600} className="community-discussion-reply-author">
                  {commentAuthorName}
                </Text>
                {latestComment.content ? ` ${latestComment.content}` : ' commented'}
              </Text>
              <Text component="time" size="xs" className="community-discussion-timestamp">
                {getCompactRelativeTime(latestComment.createdAt)}
              </Text>
            </Group>
          ) : (
            <Text size="sm" className="community-discussion-empty-reply">
              No comments yet
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
      style={{ cursor: 'pointer' }}
      className={`glass-effect-hover ${className || ''}`.trim()}
    >
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <Box
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--mantine-radius-md)',
            background: 'var(--mantine-color-default-hover)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: 'var(--theme-secondary)',
          }}
        >
          <IconMusic size={20} />
        </Box>

        <Box style={{ flex: 1, overflow: 'hidden' }}>
          <Text fw={700} size="sm" lineClamp={1}>
            {playlistTitle}
          </Text>

          <Group gap="xs" mt={2}>
            <Avatar
              src={getProfileImageUrl(author)}
              size={16}
              radius="xl"
              color="grape"
            >
              {creatorName.charAt(0).toUpperCase()}
            </Avatar>
            <Text size="sm" c="dimmed" lineClamp={1}>
              {creatorName} - {songCount} song{songCount !== 1 ? 's' : ''}
            </Text>
            <Text size="sm" c="dimmed">
              - {getRelativeTime(post.created_at)}
            </Text>
          </Group>

          {post.content && (
            <Text size="sm" c="dimmed" lineClamp={1} mt={4} fs="italic">
              "{post.content}"
            </Text>
          )}

          {latestComment && (
            <Group gap={5} mt={5} wrap="nowrap" align="flex-start">
              <IconMessageCircle size={14} style={{ opacity: 0.5, flexShrink: 0, marginTop: 1 }} />
              <Text size="sm" c="dimmed" lineClamp={1}>
                <Text span fw={500} c="var(--mantine-color-text)">
                  {commentAuthorName}
                </Text>
                {' - '}{getRelativeTime(latestComment.createdAt)}
              </Text>
            </Group>
          )}

          {latestComment?.content && (
            <Text size="sm" c="dimmed" lineClamp={2} mt={4} fs="italic">
              "{latestComment.content}"
            </Text>
          )}
        </Box>
      </Group>
    </Paper>
  );
}
