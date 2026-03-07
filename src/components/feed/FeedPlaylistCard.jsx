import { Paper, Group, Text, Avatar, Badge, Stack, Box } from '@mantine/core';
import IconPlaylist from '@tabler/icons-react/dist/esm/icons/IconPlaylist.mjs';
import IconMessageCircle from '@tabler/icons-react/dist/esm/icons/IconMessageCircle.mjs';
import { getRelativeTime, getProfileImageUrl } from '../../utils/formatters';

export function FeedPlaylistCard({ post, latestComment, songMapById, onClick }) {
  if (!post) return null;

  const author = post.author;
  const playlist = post.playlist;
  const songCount = playlist?.songs?.length || 0;

  return (
    <Paper
      p="sm"
      radius="md"
      withBorder
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      className="glass-effect-hover"
    >
      <Group gap="sm" wrap="nowrap" align="flex-start">
        {/* Playlist icon */}
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
          <IconPlaylist size={20} />
        </Box>

        <Box style={{ flex: 1, overflow: 'hidden' }}>
          {/* Playlist title */}
          <Text fw={600} size="sm" lineClamp={1}>
            {playlist?.title || 'Untitled Playlist'}
          </Text>

          {/* Author + song count */}
          <Group gap="xs" mt={2}>
            <Avatar
              src={getProfileImageUrl(author)}
              size={16}
              radius="xl"
              color="grape"
            >
              {(author?.display_name || '?').charAt(0)}
            </Avatar>
            <Text size="xs" c="dimmed">
              {author?.display_name || 'Unknown'} · {songCount} song{songCount !== 1 ? 's' : ''}
            </Text>
            <Text size="xs" c="dimmed">
              · {getRelativeTime(post.created_at)}
            </Text>
          </Group>

          {/* Post content preview */}
          {post.content && (
            <Text size="xs" c="dimmed" lineClamp={1} mt={4} fs="italic">
              "{post.content}"
            </Text>
          )}

          {/* Latest comment preview */}
          {latestComment && (
            <Group gap={5} mt={5} wrap="nowrap" align="flex-start">
              <IconMessageCircle size={12} style={{ opacity: 0.5, flexShrink: 0, marginTop: 1 }} />
              <Text size="xs" c="dimmed" lineClamp={1}>
                <Text span fw={500} c="var(--mantine-color-text)">
                  {latestComment.author?.display_name || 'Someone'}
                </Text>
                {' • '}{getRelativeTime(latestComment.createdAt)}
              </Text>
            </Group>
          )}
        </Box>
      </Group>
    </Paper>
  );
}
