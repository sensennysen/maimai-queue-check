import { Divider, Paper, Title, Stack, Group, Text, Loader, Rating } from '@mantine/core';

/**
 * RatingSection component to show global stats and user rating input
 * @param {object} discussionData - Current discussion data (ratings, etc)
 * @param {boolean} loading - Loading state for data
 * @param {object} user - Current user object
 * @param {boolean} isRatingLoading - Loading state for rating action
 * @param {Function} onRatingChange - Handler for rating change
 */
export function RatingSection({ discussionData, loading, user, isRatingLoading, onRatingChange }) {
  const averageRating = discussionData.ratings.length > 0
    ? discussionData.ratings.reduce((acc, r) => acc + r.rating, 0) / discussionData.ratings.length
    : null;

  const userRating = discussionData.ratings.find(r => r.user_id === user?.id)?.rating ?? 0;

  return (
    <Paper p="md" radius="md" withBorder className="song-community-card">
      <Title order={4}>Rating</Title>
      {loading ? <Loader size="sm" /> : (
        <Stack gap="md" mt="sm">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Text size="sm" fw={600}>Community avg.</Text>
            {averageRating === null ? (
              <Text size="sm" c="dimmed" fs="italic">No ratings yet</Text>
            ) : (
              <Group gap="xs" wrap="nowrap">
                <Rating value={averageRating} fractions={2} readOnly size="sm" />
                <Text size="sm" c="dimmed">({discussionData.ratings.length})</Text>
              </Group>
            )}
          </Group>

          <Divider />

          {user ? (
            <Stack gap="xs">
              <Text size="sm" fw={600}>Rate this song</Text>
              {isRatingLoading ? <Loader size="sm" /> : (
                <Rating
                  size="lg"
                  value={userRating}
                  onChange={onRatingChange}
                  aria-label={`Your rating: ${userRating || 'not rated'} out of 5`}
                />
              )}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed" fs="italic">
              Sign in to rate this song.
            </Text>
          )}
        </Stack>
      )}
    </Paper>
  );
}
