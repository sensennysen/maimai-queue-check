import { Paper, Title, Stack, Group, Text, Loader, Rating } from '@mantine/core';

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
    : 0;

  const userRating = discussionData.ratings.find(r => r.user_id === user?.id)?.rating || 0;

  return (
    <Paper p="md" radius="md" withBorder>
      <Title order={4} mb="sm">Rating</Title>
      {loading ? <Loader size="sm" /> : (
        <Stack gap="sm">
          <Group justify="space-between">
            <Text size="sm" fw={500}>Global Average</Text>
            <Group gap="xs">
              <Rating
                value={averageRating}
                fractions={2}
                readOnly
              />
              <Text size="xs" c="dimmed">({discussionData.ratings.length})</Text>
            </Group>
          </Group>

          {user ? (
            <Stack gap={4} mt="xs">
              <Text size="sm" fw={700} c="blue">How do you like this song?</Text>
              <Group justify="space-between">
                <Text size="xs" fw={500} c="dimmed" tt="uppercase">Your Rating</Text>
                {isRatingLoading ? <Loader size="sm" /> : (
                  <Rating
                    size="lg"
                    value={userRating}
                    onChange={onRatingChange}
                  />
                )}
              </Group>
            </Stack>
          ) : (
            <Text size="xs" c="dimmed" fs="italic" ta="center" mt="xs">
              Log in to rate this song
            </Text>
          )}
        </Stack>
      )}
    </Paper>
  );
}
