import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Container, Stack, Group, Title, Text, Button, Loader, Paper, Image, Badge, SimpleGrid, Alert } from '@mantine/core';
import { IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';
import { useSongDatabaseContext } from '../hooks/useSongDatabaseContext';
import { discussionService } from '../services/supabase';
import { VERSION_MAPPING, CATEGORY_TRANSLATION } from '../config/maimai-constants';

export default function SongDiscussionPage() {
  const { id } = useParams();
  const { songMapById, loading: songsLoading } = useSongDatabaseContext();
  const [discussionData, setDiscussionData] = useState({ ratings: [], comments: [], tags: [] });
  const [discussionLoading, setDiscussionLoading] = useState(true);
  const [error, setError] = useState(null);

  const song = songMapById?.get(id);

  useEffect(() => {
    async function loadDiscussion() {
      if (!song) return; // Wait until song is resolved
      try {
        setDiscussionLoading(true);
        const data = await discussionService.getSongDiscussionData(id);
        setDiscussionData(data);
      } catch (err) {
        console.error('Failed to load discussion data', err);
        setError(err);
      } finally {
        setDiscussionLoading(false);
      }
    }
    loadDiscussion();
  }, [id, song]);

  if (songsLoading) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" justify="center" style={{ minHeight: '60vh' }}>
          <Loader size="xl" color="pink" type="bars" />
          <Text c="dimmed">Loading song details...</Text>
        </Stack>
      </Container>
    );
  }

  if (!song) {
    // If not loading and no song found, either redirect or show not found
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md">
          <Title order={2}>Song Not Found</Title>
          <Button component={Link} to="/songs" leftSection={<IconArrowLeft size={16} />}>
            Back to Songs
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl" className="animate-fade-in">
      <Stack gap="xl">
        {/* Navigation */}
        <Group>
          <Button component={Link} to="/songs" variant="subtle" leftSection={<IconArrowLeft size={16} />}>
            Back to Songs
          </Button>
        </Group>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
            Failed to load discussion data. Please try again later.
          </Alert>
        )}

        {/* Header containing Song Basic Info */}
        <Paper p="xl" radius="md" withBorder>
          <Group wrap="nowrap" align="flex-start" gap="xl">
            <Image
              src={import.meta.env.VITE_SONG_JACKETS_URL + song.imageName}
              alt={song.title}
              radius="md"
              w={{ base: 120, sm: 160 }}
              h={{ base: 120, sm: 160 }}
              fallbackSrc="https://placehold.co/240x240?text=No+Image"
              style={{ boxShadow: 'var(--mantine-shadow-md)', flexShrink: 0 }}
            />

            <Stack gap="xs" style={{ flex: 1 }}>
              <Title order={2} style={{ fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>
                {song.title}
              </Title>
              <Text size="sm" c="dimmed" fw={700} tt="uppercase">Artist</Text>
              <Text size="md">{song.artist}</Text>

              <Group gap="xs" mt="sm">
                <Badge variant="light" color="blue">
                  {CATEGORY_TRANSLATION[song.category] || song.category}
                </Badge>
                <Badge variant="outline" color="gray">
                  {VERSION_MAPPING[song.version] || song.version}
                </Badge>
                {song.bpm && (
                  <Badge variant="dot" color="teal">
                    BPM {song.bpm}
                  </Badge>
                )}
              </Group>
            </Stack>
          </Group>
        </Paper>

        {/* Discussion Sections placeholders */}
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
          {/* Tags and Ratings Column */}
          <Stack gap="lg">
            <Paper p="md" radius="md" withBorder>
              <Title order={4} mb="sm">Tags</Title>
              {discussionLoading ? <Loader size="sm" /> : (
                <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
                  {JSON.stringify(discussionData.tags)}
                </Text>
              )}
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Title order={4} mb="sm">Rating</Title>
              {discussionLoading ? <Loader size="sm" /> : (
                <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
                  {JSON.stringify(discussionData.ratings)}
                </Text>
              )}
            </Paper>
          </Stack>

          {/* Comments Column */}
          <Paper p="md" radius="md" withBorder style={{ gridColumn: 'span 2' }}>
            <Title order={4} mb="sm">Comments</Title>
            {discussionLoading ? <Loader size="sm" /> : (
              <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
                {JSON.stringify(discussionData.comments)}
              </Text>
            )}
          </Paper>
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
