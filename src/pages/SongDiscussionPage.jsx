import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Stack, Group, Title, Text, Button, Loader, Paper, Image, Badge, SimpleGrid, Alert, Rating, Autocomplete, ActionIcon, Textarea, Center, Flex } from '@mantine/core';
import { IconArrowLeft, IconAlertCircle, IconPlus, IconTrash, IconThumbUp, IconThumbDown, IconRefresh } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../hooks/useAuth';
import { useSongDatabaseContext } from '../hooks/useSongDatabaseContext';
import { discussionService } from '../services/supabase';
import { VERSION_MAPPING, CATEGORY_TRANSLATION } from '../config/maimai-constants';

export default function SongDiscussionPage() {
  const { id } = useParams();
  const { songMapById, loading: songsLoading } = useSongDatabaseContext();

  // Helper for relative time formatting
  const getRelativeTime = useCallback((dateString) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = date - now;
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

    if (Math.abs(diffInDays) > 7) {
      return date.toLocaleDateString();
    }

    const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));
    if (Math.abs(diffInHours) >= 24) {
      return rtf.format(diffInDays, 'day');
    }

    const diffInMinutes = Math.round(diffInMs / (1000 * 60));
    if (Math.abs(diffInMinutes) >= 60) {
      return rtf.format(diffInHours, 'hour');
    }

    if (Math.abs(diffInMinutes) < 1) {
      return 'just now';
    }

    return rtf.format(diffInMinutes, 'minute');
  }, []);
  const [discussionData, setDiscussionData] = useState({ ratings: [], comments: [], tags: [] });
  const [availableTags, setAvailableTags] = useState([]);
  const [discussionLoading, setDiscussionLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [isTaggingLoading, setIsTaggingLoading] = useState(false);
  const [newTagValue, setNewTagValue] = useState('');
  const [newCommentValue, setNewCommentValue] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const { user } = useAuth();

  const song = songMapById?.get(id);

  const loadDiscussion = useCallback(async () => {
    if (!song) return; // Wait until song is resolved
    try {
      setError(null);
      setDiscussionLoading(true);
      const [data, tags] = await Promise.all([
        discussionService.getSongDiscussionData(id),
        discussionService.getAvailableTags()
      ]);
      setDiscussionData(data);
      setAvailableTags(tags);
    } catch (err) {
      console.error('Failed to load discussion data', err);
      setError(err);
    } finally {
      setDiscussionLoading(false);
    }
  }, [id, song]);

  useEffect(() => {
    loadDiscussion();
  }, [loadDiscussion]);

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
            <Group justify="space-between" align="center">
              <Text size="sm">Failed to load discussion data. Please try again.</Text>
              <Button size="xs" color="red" variant="light" leftSection={<IconRefresh size={14} />} onClick={loadDiscussion}>
                Retry
              </Button>
            </Group>
          </Alert>
        )}

        {/* Header containing Song Basic Info */}
        <Paper p="xl" radius="md" withBorder>
          <Flex direction={{ base: 'column', sm: 'row' }} gap="xl" align={{ base: 'center', sm: 'flex-start' }}>
            <Image
              src={import.meta.env.VITE_SONG_JACKETS_URL + song.imageName}
              alt={song.title}
              radius="md"
              w={{ base: 120, sm: 160 }}
              h={{ base: 120, sm: 160 }}
              fallbackSrc="https://placehold.co/240x240?text=No+Image"
              style={{ boxShadow: 'var(--mantine-shadow-md)', flexShrink: 0 }}
            />

            <Stack gap="xs" style={{ flex: 1 }} align={{ base: 'center', sm: 'flex-start' }} ta={{ base: 'center', sm: 'left' }}>
              <Title order={2} style={{ fontFamily: 'var(--font-heading)', lineHeight: 1.2, wordBreak: 'break-word' }}>
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
          </Flex>
        </Paper>

        {/* Discussion Sections placeholders */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {/* Tags and Ratings Column */}
          <Stack gap="lg">
            <Paper p="md" radius="md" withBorder>
              <Title order={4} mb="sm">Tags</Title>
              {discussionLoading ? <Loader size="sm" /> : (
                <Stack gap="sm">
                  {discussionData.tags.length > 0 ? (
                    <Group gap="xs">
                      {Object.entries(
                        discussionData.tags.reduce((acc, currentInfo) => {
                          const name = currentInfo.song_tags_dictionary?.tag_name;
                          if (name) {
                            acc[name] = (acc[name] || 0) + 1;
                          }
                          return acc;
                        }, {})
                      )
                        .sort((a, b) => b[1] - a[1]) // Sort by count descending
                        .map(([tagName, count]) => (
                          <Badge key={tagName} variant="light" color="blue" size="lg">
                            {tagName} <Text span size="xs" c="dimmed" ml={4}>({count})</Text>
                          </Badge>
                        ))}
                    </Group>
                  ) : (
                    <Paper p="sm" bg="var(--mantine-color-default-hover)" radius="md">
                      <Center>
                        <Text size="sm" c="dimmed" fs="italic">No tags yet. Be the first!</Text>
                      </Center>
                    </Paper>
                  )}

                  {user ? (
                    <Group wrap="nowrap" mt="xs" align="flex-end">
                      <Autocomplete
                        label="Add Tag"
                        placeholder="Select or type..."
                        data={availableTags.map(t => t.tag_name)}
                        value={newTagValue}
                        onChange={setNewTagValue}
                        style={{ flex: 1 }}
                        disabled={isTaggingLoading}
                        maxLength={30}
                      />
                      <ActionIcon
                        variant="filled"
                        color="blue"
                        size="input-sm"
                        loading={isTaggingLoading}
                        onClick={async () => {
                          const tagInput = newTagValue.trim();
                          if (!tagInput) return;

                          setIsTaggingLoading(true);
                          try {
                            // Find tag in dictionary, or create if missing
                            let tagId;
                            const existingTag = availableTags.find(t => t.tag_name.toLowerCase() === tagInput.toLowerCase());
                            if (existingTag) {
                              tagId = existingTag.id;
                            } else {
                              const newTag = await discussionService.addCustomTag(tagInput);
                              tagId = newTag.id;
                              setAvailableTags(prev => [...prev, newTag]);
                            }

                            // Link tag to song
                            await discussionService.addSongTag(id, tagId, user.id);

                            // Optimistically update the UI directly
                            setDiscussionData(prev => ({
                              ...prev,
                              tags: [
                                ...prev.tags,
                                {
                                  song_id: id,
                                  tag_id: tagId,
                                  user_id: user.id,
                                  song_tags_dictionary: { tag_name: existingTag ? existingTag.tag_name : tagInput }
                                }
                              ]
                            }));
                            setNewTagValue('');
                            notifications.show({
                              title: 'Tag Added',
                              message: `Added tag "${existingTag ? existingTag.tag_name : tagInput}" to song.`,
                              color: 'green'
                            });
                          } catch (err) {
                            console.error('Failed to add tag', err);
                            const errMsg = err.message || '';
                            if (errMsg.includes('unique_song_user_tag')) {
                              notifications.show({
                                title: 'Duplicate Tag',
                                message: 'You have already added this tag to this song.',
                                color: 'yellow'
                              });
                            } else {
                              notifications.show({
                                title: 'Error',
                                message: 'Failed to add tag. Please try again.',
                                color: 'red'
                              });
                            }
                          } finally {
                            setIsTaggingLoading(false);
                          }
                        }}
                      >
                        <IconPlus size={16} />
                      </ActionIcon>
                    </Group>
                  ) : (
                    <Text size="xs" c="dimmed" fs="italic" ta="center" mt="xs">
                      Log in to add tags
                    </Text>
                  )}
                </Stack>
              )}
            </Paper>

            <Paper p="md" radius="md" withBorder>
              <Title order={4} mb="sm">Rating</Title>
              {discussionLoading ? <Loader size="sm" /> : (
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>Global Average</Text>
                    <Group gap="xs">
                      <Rating
                        value={discussionData.ratings.length > 0
                          ? discussionData.ratings.reduce((acc, r) => acc + r.rating, 0) / discussionData.ratings.length
                          : 0}
                        fractions={2}
                        readOnly
                      />
                      <Text size="xs" c="dimmed">({discussionData.ratings.length})</Text>
                    </Group>
                  </Group>

                  {user ? (
                    <Group justify="space-between">
                      <Text size="sm" fw={500}>Your Rating</Text>
                      {isRatingLoading ? <Loader size="sm" /> : (
                        <Rating
                          value={discussionData.ratings.find(r => r.user_id === user.id)?.rating || 0}
                          onChange={async (val) => {
                            setIsRatingLoading(true);
                            try {
                              if (val === 0) {
                                await discussionService.removeSongRating(id, user.id);
                                setDiscussionData(prev => ({
                                  ...prev,
                                  ratings: prev.ratings.filter(r => r.user_id !== user.id)
                                }));
                              } else {
                                await discussionService.upsertSongRating(id, user.id, val);
                                setDiscussionData(prev => {
                                  const existing = prev.ratings.find(r => r.user_id === user.id);
                                  if (existing) {
                                    return {
                                      ...prev,
                                      ratings: prev.ratings.map(r => r.user_id === user.id ? { ...r, rating: val } : r)
                                    };
                                  }
                                  return {
                                    ...prev,
                                    ratings: [...prev.ratings, { user_id: user.id, rating: val }]
                                  };
                                });
                              }
                            } catch (err) {
                              console.error('Failed to update rating', err);
                            } finally {
                              setIsRatingLoading(false);
                            }
                          }}
                        />
                      )}
                    </Group>
                  ) : (
                    <Text size="xs" c="dimmed" fs="italic" ta="center" mt="xs">
                      Log in to rate this song
                    </Text>
                  )}
                </Stack>
              )}
            </Paper>
          </Stack>

          {/* Comments Column */}
          <Paper p="md" radius="md" withBorder style={{ gridColumn: 'span 1', gridColumnEnd: 'min(-1, span 2)' }} className="comments-column">
            <Stack gap="md">
              <Title order={4}>Comments ({discussionData.comments.length})</Title>

              {user ? (
                <Stack gap="xs">
                  <Textarea
                    placeholder="Leave a comment..."
                    value={newCommentValue}
                    onChange={(e) => setNewCommentValue(e.currentTarget.value)}
                    disabled={isSubmittingComment}
                    minRows={2}
                    autosize
                  />
                  <Group justify="flex-end">
                    <Button
                      size="sm"
                      loading={isSubmittingComment}
                      disabled={!newCommentValue.trim()}
                      onClick={async () => {
                        const content = newCommentValue.trim();
                        if (!content) return;
                        setIsSubmittingComment(true);
                        try {
                          const newComment = await discussionService.addComment(id, user.id, content);
                          setDiscussionData(prev => ({
                            ...prev,
                            comments: [{ ...newComment, song_comment_votes: [] }, ...prev.comments]
                          }));
                          setNewCommentValue('');
                          notifications.show({
                            title: 'Comment Added', message: 'Your comment has been posted.', color: 'green'
                          });
                        } catch (err) {
                          console.error('Failed to post comment', err);
                          notifications.show({
                            title: 'Error', message: 'Failed to post comment.', color: 'red'
                          });
                        } finally {
                          setIsSubmittingComment(false);
                        }
                      }}
                    >
                      Post Comment
                    </Button>
                  </Group>
                </Stack>
              ) : (
                <Text size="sm" c="dimmed" fs="italic">Log in to post a comment.</Text>
              )}

              {discussionLoading ? <Loader size="sm" /> : (
                <Stack gap="md" mt="sm">
                  {discussionData.comments.length > 0 ? discussionData.comments.map(comment => {
                    const upvotes = comment.song_comment_votes?.filter(v => v.vote_type === 1).length || 0;
                    const downvotes = comment.song_comment_votes?.filter(v => v.vote_type === -1).length || 0;
                    const myVote = comment.song_comment_votes?.find(v => v.user_id === user?.id)?.vote_type || 0;

                    return (
                      <Paper key={comment.id} p="sm" radius="md" withBorder bg="var(--mantine-color-default-hover)">
                        <Group justify="space-between" align="flex-start" mb="xs">
                          <Group gap="xs">
                            <Text fw={500} size="sm">{comment.user_profiles?.display_name || 'Unknown User'}</Text>
                            <Text c="dimmed" size="xs" title={new Date(comment.created_at).toLocaleString()}>
                              {getRelativeTime(comment.created_at)}
                            </Text>
                          </Group>
                          {user && user.id === comment.user_id && (
                            <ActionIcon
                              color="red"
                              variant="subtle"
                              size="sm"
                              title="Delete comment"
                              onClick={async () => {
                                if (window.confirm("Are you sure you want to delete this comment?")) {
                                  try {
                                    await discussionService.deleteComment(comment.id, user.id);
                                    setDiscussionData(prev => ({
                                      ...prev,
                                      comments: prev.comments.filter(c => c.id !== comment.id)
                                    }));
                                    notifications.show({ title: 'Comment Deleted', message: 'Comment has been removed.', color: 'green' });
                                  } catch (err) {
                                    console.error('Failed to delete comment', err);
                                    notifications.show({ title: 'Error', message: 'Failed to delete comment.', color: 'red' });
                                  }
                                }
                              }}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          )}
                        </Group>
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {comment.content}
                        </Text>

                        <Group gap="xs" mt="sm">
                          <Button
                            variant={myVote === 1 ? 'light' : 'subtle'}
                            color={myVote === 1 ? 'blue' : 'gray'}
                            size="compact-xs"
                            leftSection={<IconThumbUp size={14} />}
                            disabled={!user}
                            onClick={async () => {
                              try {
                                const nextVote = myVote === 1 ? 0 : 1;
                                await discussionService.voteComment(comment.id, user.id, nextVote);
                                setDiscussionData(prev => ({
                                  ...prev,
                                  comments: prev.comments.map(c => {
                                    if (c.id !== comment.id) return c;
                                    const filteredVotes = (c.song_comment_votes || []).filter(v => v.user_id !== user.id);
                                    if (nextVote !== 0) {
                                      filteredVotes.push({ user_id: user.id, vote_type: nextVote });
                                    }
                                    return { ...c, song_comment_votes: filteredVotes };
                                  })
                                }));
                              } catch (err) {
                                console.error('Failed to vote', err);
                              }
                            }}
                          >
                            {upvotes > 0 ? upvotes : ''}
                          </Button>
                          <Button
                            variant={myVote === -1 ? 'light' : 'subtle'}
                            color={myVote === -1 ? 'red' : 'gray'}
                            size="compact-xs"
                            leftSection={<IconThumbDown size={14} />}
                            disabled={!user}
                            onClick={async () => {
                              try {
                                const nextVote = myVote === -1 ? 0 : -1;
                                await discussionService.voteComment(comment.id, user.id, nextVote);
                                setDiscussionData(prev => ({
                                  ...prev,
                                  comments: prev.comments.map(c => {
                                    if (c.id !== comment.id) return c;
                                    const filteredVotes = (c.song_comment_votes || []).filter(v => v.user_id !== user.id);
                                    if (nextVote !== 0) {
                                      filteredVotes.push({ user_id: user.id, vote_type: nextVote });
                                    }
                                    return { ...c, song_comment_votes: filteredVotes };
                                  })
                                }));
                              } catch (err) {
                                console.error('Failed to vote', err);
                              }
                            }}
                          >
                            {downvotes > 0 ? downvotes : ''}
                          </Button>
                        </Group>
                      </Paper>
                    );
                  }) : (
                    <Paper p="xl" bg="var(--mantine-color-default-hover)" radius="md" mt="sm">
                      <Center>
                        <Stack align="center" gap="xs">
                          <IconAlertCircle size={32} opacity={0.3} />
                          <Text size="sm" c="dimmed" fs="italic" ta="center">
                            No comments yet. Be the first to start the discussion!
                          </Text>
                        </Stack>
                      </Center>
                    </Paper>
                  )}
                </Stack>
              )}
            </Stack>
          </Paper>
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
