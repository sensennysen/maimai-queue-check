import { useState, useEffect, useCallback } from 'react';
import { Stack, Group, Text, Title, Paper, Alert } from '@mantine/core';
import IconPencil from '@tabler/icons-react/dist/esm/icons/IconPencil.mjs';

import IconAlertCircle from '@tabler/icons-react/dist/esm/icons/IconAlertCircle.mjs';
import { feedService } from '../../services/supabase';
import { FeedPostCard } from '../feed/FeedPostCard';

/**
 * A section on the public profile page that displays a user's community posts.
 */
export function ProfilePostsSection({ userId, currentUser, isOwnProfile }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchPosts = useCallback(async () => {
    setLoading(true);

    try {
      const data = await feedService.getUserFeedPosts(userId);
      setPosts(data || []);
    } catch (err) {
      console.error('Failed to fetch user posts:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (loading) return null;

  return (
    <Paper p="lg" radius="md" className="profile-surface">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconPencil size={24} style={{ color: 'var(--mantine-color-primary)' }} />
            <Title order={2}>Community Posts</Title>
            <Text size="sm" c="dimmed" mt={4}>({posts.length})</Text>
          </Group>
        </Group>

        {posts.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} title="No Posts" color="gray" variant="light">
            {isOwnProfile
              ? "No posts to show yet. Posts you make on the feed will appear here!"
              : "This user hasn't shared any community posts yet."}
          </Alert>
        ) : (
          <Stack gap="sm">
            {posts.map(post => (
              <FeedPostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                onUpdate={(id, content) => setPosts(prev => prev.map(p => p.id === id ? { ...p, content } : p))}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
