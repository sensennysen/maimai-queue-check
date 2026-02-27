import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Stack, Group, Title, Text, Button, Loader, Paper, Image, Badge, Alert, Rating, Autocomplete, ActionIcon, Textarea, Center, Flex, Grid, Table, ScrollArea, Box } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconArrowLeft, IconAlertCircle, IconPlus, IconTrash, IconThumbUp, IconThumbDown, IconRefresh, IconWorld } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../hooks/useAuth';
import { useSongDatabaseContext } from '../hooks/useSongDatabaseContext';
import { discussionService } from '../services/supabase';
import { VERSION_MAPPING, CATEGORY_TRANSLATION, DIFFICULTY_COLORS, normalizeDifficulty } from '../config/maimai-constants';

export default function SongDiscussionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { songs, songMapById, loading: songsLoading } = useSongDatabaseContext();

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
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const baseSong = songMapById?.get(id);

  // Derive active chart type from navigation state if available, otherwise default to base song's own cardType
  const activeCardType = location.state?.cardType || baseSong?.cardType;

  // Find the specific card object for this chart type (e.g. DX vs Standard). 
  // songMapById.get(id) often returns the first card (Standard) if mapped by songId instead of cardId.
  const song = useMemo(() => {
    if (!songs || !baseSong) return null;
    if (activeCardType && baseSong.cardType !== activeCardType) {
      return songs.find(s => s.songId === baseSong.songId && s.cardType === activeCardType) || baseSong;
    }
    return baseSong;
  }, [songs, baseSong, activeCardType]);

  const currentSheets = song?.sheets || [];

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
          <Button onClick={() => navigate(-1)} leftSection={<IconArrowLeft size={16} />}>
            Go Back
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl" className="animate-fade-in">
      <Stack gap="xl">
        {/* Navigation */}
        <Group>
          <Button onClick={() => navigate(-1)} variant="subtle" leftSection={<IconArrowLeft size={16} />}>
            Go Back
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
        <Paper p={{ base: 'md', sm: 'xl' }} radius="md" withBorder>
          <Flex direction={{ base: 'column', sm: 'row' }} gap={{ base: 'md', sm: 'xl' }} align={{ base: 'center', sm: 'flex-start' }}>
            <Box style={{ flexShrink: 0, width: isMobile ? 120 : 200 }}>
              <Image
                src={import.meta.env.VITE_SONG_JACKETS_URL + song.imageName}
                alt={song.title}
                radius="md"
                w="100%"
                fallbackSrc="https://placehold.co/240x240?text=No+Image"
                style={{ boxShadow: 'var(--mantine-shadow-md)', aspectRatio: '1/1', objectFit: 'cover' }}
              />
            </Box>

            <Stack gap="xs" style={{ flex: 1, minWidth: 0, width: isMobile ? '100%' : 'auto' }} align={isMobile ? 'center' : 'flex-start'} ta={isMobile ? 'center' : 'left'}>
              <Group align="center" justify={isMobile ? 'center' : 'space-between'} w="100%" wrap="nowrap">
                <Title order={1} className="mobile-song-title" style={{ fontFamily: 'var(--font-heading)', wordBreak: 'break-word', flex: isMobile ? '0 1 auto' : 1 }}>
                  {song.title}
                </Title>
                <Box style={{ flexShrink: 0, display: isMobile ? 'none' : 'block' }}>
                  {activeCardType === 'dx' || activeCardType === 'dx_plus' ? (
                    <img src={new URL('../assets/music_dx.png', import.meta.url).href} alt="DX" style={{ height: 30, objectFit: 'contain' }} />
                  ) : (
                    <img src={new URL('../assets/music_standard.png', import.meta.url).href} alt="Standard" style={{ height: 30, objectFit: 'contain' }} />
                  )}
                </Box>
              </Group>

              <Text size={isMobile ? "sm" : "lg"} mt={isMobile ? 0 : "xs"}>Artist: <Text span fw={500}>{song.artist}</Text></Text>

              <Group gap="xs" mt={isMobile ? 0 : "sm"} mb={isMobile ? 0 : "sm"} justify={isMobile ? 'center' : 'flex-start'} w="100%">
                <Badge variant="light" color="blue" size={isMobile ? "sm" : "lg"}>
                  {CATEGORY_TRANSLATION[song.category] || song.category}
                </Badge>
              </Group>

              <Grid gutter={isMobile ? "xs" : "xl"} w="100%">
                <Grid.Col span={{ base: 6, sm: 4 }}>
                  <Text size="xs" c="dimmed">Version</Text>
                  <Text size={isMobile ? "sm" : "lg"} fw={500}>{VERSION_MAPPING[song.version] || song.version || '-'}</Text>
                </Grid.Col>
                {song.bpm && (
                  <Grid.Col span={{ base: 3, sm: 4 }}>
                    <Text size="xs" c="dimmed">BPM</Text>
                    <Text size={isMobile ? "sm" : "lg"} fw={500}>{song.bpm}</Text>
                  </Grid.Col>
                )}
                {song.releaseDate && (
                  <Grid.Col span={{ base: 3, sm: 4 }}>
                    <Text size="xs" c="dimmed">Released</Text>
                    <Text size={isMobile ? "sm" : "lg"} fw={500}>{isMobile ? song.releaseDate.split('-')[0] : song.releaseDate}</Text>
                  </Grid.Col>
                )}
              </Grid>
            </Stack>
          </Flex>
        </Paper>

        {/* Chart Details Section */}
        {currentSheets && currentSheets.length > 0 && (
          <Paper p="xl" radius="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between" align="flex-end">
                <Title order={3}>Chart Details</Title>
              </Group>

              <Group justify="space-between" align="center">
                {/* Region Availability */}
                <Group gap="xs" align="center">
                  <Text size="sm" fw={700}>Regions:</Text>
                  {(() => {
                    const firstSheet = currentSheets[0];
                    if (!firstSheet || !firstSheet.regions) return <Text size="sm" c="dimmed">Unknown</Text>;
                    return Object.entries(firstSheet.regions)
                      .map(([region, isAvailable]) => (
                        <Badge
                          key={region}
                          size="sm"
                          variant={isAvailable ? "light" : "outline"}
                          color={isAvailable ? "blue" : "gray"}
                          leftSection={<IconWorld size={10} />}
                          opacity={isAvailable ? 1 : 0.4}
                        >
                          {region.toUpperCase()}
                        </Badge>
                      ));
                  })()}
                </Group>
              </Group>

              {/* Difficulty Table */}
              <ScrollArea>
                <Table striped highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th className="sticky-col">Difficulty</Table.Th>
                      <Table.Th>Level</Table.Th>
                      <Table.Th>{isMobile ? 'Int. Lvl' : 'Internal Level'}</Table.Th>
                      <Table.Th>{isMobile ? 'Des.' : 'Designer'}</Table.Th>
                      <Table.Th>Tap</Table.Th>
                      <Table.Th>Hold</Table.Th>
                      <Table.Th>Slide</Table.Th>
                      <Table.Th>Touch</Table.Th>
                      <Table.Th>Break</Table.Th>
                      <Table.Th>Total</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {currentSheets.map((displaySheet, idx) => {
                      const diffName = normalizeDifficulty(displaySheet.difficulty);
                      const color = DIFFICULTY_COLORS[diffName] || 'gray';

                      return (
                        <Table.Tr key={`${displaySheet.type}-${displaySheet.difficulty}-${idx}`}>
                          <Table.Td className="sticky-col">
                            <Badge color={color} variant="filled" w="100%" size={isMobile ? "xs" : "sm"}>
                              {isMobile ? diffName.substring(0, 3).toUpperCase() : diffName}
                            </Badge>
                          </Table.Td>
                          <Table.Td fw={700}>{displaySheet.level}</Table.Td>
                          <Table.Td>{displaySheet.internalLevel || displaySheet.internalLevelValue || '-'}</Table.Td>
                          <Table.Td>
                            <Text size="xs" truncate maw={150} title={displaySheet.noteDesigner}>
                              {displaySheet.noteDesigner || '-'}
                            </Text>
                          </Table.Td>
                          <Table.Td>{displaySheet.noteCounts?.tap ?? '-'}</Table.Td>
                          <Table.Td>{displaySheet.noteCounts?.hold ?? '-'}</Table.Td>
                          <Table.Td>{displaySheet.noteCounts?.slide ?? '-'}</Table.Td>
                          <Table.Td>{displaySheet.noteCounts?.touch ?? '-'}</Table.Td>
                          <Table.Td>{displaySheet.noteCounts?.break ?? '-'}</Table.Td>
                          <Table.Td fw={700}>{displaySheet.noteCounts?.total ?? '-'}</Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Stack>
          </Paper>
        )}

        {/* Discussion Sections */}
        <Grid gutter="lg">
          {/* Tags and Ratings Column */}
          <Grid.Col span={{ base: 12, md: 4 }}>
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
                              let finalTagName;
                              const existingTag = availableTags.find(t => t.tag_name.toLowerCase() === tagInput.toLowerCase());
                              if (existingTag) {
                                tagId = existingTag.id;
                                finalTagName = existingTag.tag_name;
                              } else {
                                const newTag = await discussionService.addCustomTag(tagInput);
                                tagId = newTag.id;
                                finalTagName = newTag.tag_name;
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
                                    song_tags_dictionary: { tag_name: finalTagName }
                                  }
                                ]
                              }));
                              setNewTagValue('');
                              notifications.show({
                                title: 'Tag Added',
                                message: `Added tag "${finalTagName}" to song.`,
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
          </Grid.Col>

          {/* Comments Column */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper p="md" radius="md" withBorder className="comments-column">
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
          </Grid.Col>
        </Grid>
      </Stack >
    </Container >
  );
}
