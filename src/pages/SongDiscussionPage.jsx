import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Container, Stack, Group, Title, Text, Button, Loader, Paper, Image, Badge, Alert, Rating, Autocomplete, ActionIcon, Textarea, Center, Flex, Grid, Table, ScrollArea, Box, Avatar, Modal, HoverCard, Tooltip } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconThumbUpFilled, IconThumbDownFilled, IconAlertCircle, IconPlus, IconTrash, IconThumbUp, IconThumbDown, IconRefresh, IconWorld, IconPlaylistAdd, IconBook, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../hooks/useAuth';
import { useSongDatabaseContext } from '../hooks/useSongDatabaseContext';
import { discussionService } from '../services/supabase';
import { VERSION_MAPPING, CATEGORY_TRANSLATION, DIFFICULTY_COLORS, normalizeDifficulty } from '../config/maimai-constants';
import { AddToPlaylistModal } from '../components/modals/AddToPlaylistModal';
import { VoterListModal } from '../components/common/VoterListModal';
import { getRelativeTime, getProfileImageUrl } from '../utils/formatters';

export default function SongDiscussionPage() {
  const { id } = useParams();
  const { songs, songMapById, loading: songsLoading } = useSongDatabaseContext();

  const getRelativeTimeCb = useCallback((dateString) => getRelativeTime(dateString), []);
  const [discussionData, setDiscussionData] = useState({ ratings: [], comments: [], tags: [] });
  const [availableTags, setAvailableTags] = useState([]);
  const [discussionLoading, setDiscussionLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [isTaggingLoading, setIsTaggingLoading] = useState(false);
  const [newTagValue, setNewTagValue] = useState('');
  const [newCommentValue, setNewCommentValue] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [addToPlaylistOpened, setAddToPlaylistOpened] = useState(false);
  const [glossaryOpened, setGlossaryOpened] = useState(false);
  const [votersOpened, setVotersOpened] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [initialVoterTab, setInitialVoterTab] = useState('likes');
  const { user, userRoles } = useAuth();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isMobileOrTablet = useMediaQuery('(max-width: 991px)');

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
        discussionService.getAvailableTags(userRoles?.is_super_admin)
      ]);
      setDiscussionData(data);
      setAvailableTags(tags);
    } catch (err) {
      console.error('Failed to load discussion data', err);
      setError(err);
    } finally {
      setDiscussionLoading(false);
    }
  }, [id, song, userRoles]);

  useEffect(() => {
    loadDiscussion();
  }, [loadDiscussion]);

  if (songsLoading) {
    return (
      <Container size="xl" py="xl">
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
      <Container size="xl" py="xl">
        <Stack align="center" gap="md">
          <Title order={2}>Song Not Found</Title>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl" className="animate-fade-in">
      <Stack gap="xl">
        {/* Navigation */}
        <Group justify="space-between">
          <Button
            variant="light"
            color="teal"
            leftSection={<IconPlaylistAdd size={16} />}
            onClick={() => setAddToPlaylistOpened(true)}
          >
            Add to Playlist
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
        <Paper p={{ base: 'md', md: 'lg' }} radius="md" withBorder>
          <Flex direction={{ base: 'column', md: 'row' }} gap={{ base: 'md', md: 'xl' }} align="center">
            {/* Image */}
            <Box style={{ flexShrink: 0, width: isMobileOrTablet ? 160 : 180 }}>
              <Image
                src={import.meta.env.VITE_SONG_JACKETS_URL + song.imageName}
                alt={song.title}
                radius="md"
                w="100%"
                fallbackSrc="https://placehold.co/240x240?text=No+Image"
                style={{ boxShadow: 'var(--mantine-shadow-md)', aspectRatio: '1/1', objectFit: 'cover' }}
              />
            </Box>

            {/* Content for the rest */}
            <Box flex={1} w="100%">
              <Grid gutter={{ base: 'md', md: 'xl' }} align="center">
                {/* Box 1: Title and Artist */}
                <Grid.Col span={{ base: 12, md: 5 }}>
                  <Stack gap="sm" align={isMobileOrTablet ? 'center' : 'flex-start'} ta={isMobileOrTablet ? 'center' : 'left'}>
                    <Title order={2} className="mobile-song-title" style={{ fontFamily: 'var(--font-heading)', wordBreak: 'break-word', marginTop: '4px' }}>
                      {song.title}
                    </Title>
                    <Text size={isMobileOrTablet ? "sm" : "md"} mt={-8}>Artist: <Text span fw={500}>{song.artist}</Text></Text>
                  </Stack>
                </Grid.Col>

                {/* Box 2 & 3: Info container on mobile/tablet */}
                <Grid.Col span={{ base: 12, md: 7 }}>
                  <Box>
                    <Grid gutter={{ base: 'xs', sm: 'md', md: 'xl' }} align="center">
                      {/* Category and Version */}
                      <Grid.Col span={{ base: 6, lg: 5 }}>
                        <Stack gap="md" align={isMobileOrTablet ? 'center' : 'flex-start'} ta={isMobileOrTablet ? 'center' : 'left'} h="100%" justify="center">
                          <Box>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>CATEGORY</Text>
                            <Badge variant="light" color="blue" size="md" radius="sm" style={{ whiteSpace: 'normal', height: 'auto', padding: '4px 8px' }}>
                              {CATEGORY_TRANSLATION[song.category] || song.category}
                            </Badge>
                          </Box>

                          <Box>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>VERSION</Text>
                            <Text size="md" fw={500}>{VERSION_MAPPING[song.version] || song.version || '-'}</Text>
                          </Box>
                        </Stack>
                      </Grid.Col>

                      {/* Type, BPM, Released */}
                      <Grid.Col span={{ base: 6, lg: 7 }}>
                        <Stack gap="md" align={isMobileOrTablet ? 'center' : 'flex-start'} ta={isMobileOrTablet ? 'center' : 'left'} h="100%" justify="center">
                          <Box>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>TYPE</Text>
                            {activeCardType === 'dx' || activeCardType === 'dx_plus' ? (
                              <img src={new URL('../assets/music_dx.png', import.meta.url).href} alt="DX" style={{ height: 26, objectFit: 'contain' }} />
                            ) : (
                              <img src={new URL('../assets/music_standard.png', import.meta.url).href} alt="Standard" style={{ height: 26, objectFit: 'contain' }} />
                            )}
                          </Box>

                          <Group gap="xl" align="flex-start" justify={isMobileOrTablet ? 'center' : 'flex-start'} wrap="nowrap">
                            {song.bpm && (
                              <Box mt={isMobileOrTablet ? 0 : 2}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>BPM</Text>
                                <Text size="base" fw={500}>{song.bpm}</Text>
                              </Box>
                            )}

                            {song.releaseDate && (
                              <Box mt={isMobileOrTablet ? 0 : 2} style={(song.bpm && !isMobileOrTablet) ? { borderLeft: '1px solid var(--mantine-color-default-border)', paddingLeft: 'var(--mantine-spacing-xl)' } : {}}>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>RELEASED</Text>
                                <Text size="base" fw={500}>{isMobileOrTablet ? song.releaseDate.split('-')[0] : song.releaseDate}</Text>
                              </Box>
                            )}
                          </Group>
                        </Stack>
                      </Grid.Col>
                    </Grid>
                  </Box>
                </Grid.Col>
              </Grid>
            </Box>
          </Flex>
        </Paper>

        {/* Chart Details Section */}
        {
          currentSheets && currentSheets.length > 0 && (
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
          )
        }

        {/* Discussion Sections */}
        <Grid gutter="lg">
          {/* Tags and Ratings Column */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="lg">
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
                      <Stack gap={4} mt="xs">
                        <Text size="sm" fw={700} c="blue">How do you like this song?</Text>
                        <Group justify="space-between">
                          <Text size="xs" fw={500} c="dimmed" tt="uppercase">Your Rating</Text>
                          {isRatingLoading ? <Loader size="sm" /> : (
                            <Rating
                              size="lg"
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
                      </Stack>
                    ) : (
                      <Text size="xs" c="dimmed" fs="italic" ta="center" mt="xs">
                        Log in to rate this song
                      </Text>
                    )}
                  </Stack>
                )}
              </Paper>

              <Paper p="md" radius="md" withBorder>
                <Group justify="space-between" align="center" mb="sm">
                  <Title order={4}>Tags</Title>
                  <Tooltip label="Tag Glossary">
                    <ActionIcon variant="light" color="blue" onClick={() => setGlossaryOpened(true)}>
                      <IconBook size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
                {discussionLoading ? <Loader size="sm" /> : (
                  <Stack gap="sm">
                    {discussionData.tags.length > 0 ? (
                      <Group gap="xs">
                        {Object.values(
                          discussionData.tags.reduce((acc, tagItem) => {
                            const name = tagItem.song_tags_dictionary?.tag_name;
                            if (name) {
                              if (!acc[name]) {
                                acc[name] = {
                                  tagId: tagItem.tag_id,
                                  tagName: name,
                                  description: tagItem.song_tags_dictionary?.description,
                                  count: 0,
                                  users: [],
                                  hasAdded: false
                                };
                              }
                              acc[name].count += 1;
                              if (tagItem.user_profiles) {
                                acc[name].users.push(tagItem.user_profiles);
                              }
                              if (user && tagItem.user_id === user.id) {
                                acc[name].hasAdded = true;
                              }
                            }
                            return acc;
                          }, {})
                        )
                          .sort((a, b) => b.count - a.count)
                          .map((tagObj) => (
                            <HoverCard width={280} shadow="md" withArrow openDelay={200} closeDelay={400} key={tagObj.tagName}>
                              <HoverCard.Target>
                                <Badge
                                  variant={tagObj.hasAdded ? "filled" : "light"}
                                  color="blue"
                                  size="lg"
                                  style={{ cursor: user ? 'pointer' : 'default', paddingRight: tagObj.hasAdded ? 0 : undefined }}
                                  onClick={async () => {
                                    if (!user) return;
                                    if (!tagObj.hasAdded) {
                                      // Quick Add
                                      setIsTaggingLoading(true);
                                      try {
                                        await discussionService.addSongTag(id, tagObj.tagId, user.id);
                                        setDiscussionData(prev => ({
                                          ...prev,
                                          tags: [
                                            ...prev.tags,
                                            {
                                              song_id: id,
                                              tag_id: tagObj.tagId,
                                              user_id: user.id,
                                              song_tags_dictionary: { tag_name: tagObj.tagName, description: tagObj.description },
                                              user_profiles: { display_name: userRoles?.display_name || 'You', display_photo_url: userRoles?.display_photo_url }
                                            }
                                          ]
                                        }));
                                        notifications.show({ title: 'Tag Added', message: `Added tag "${tagObj.tagName}".`, color: 'green' });
                                      } catch (err) {
                                        console.error('Failed to add tag', err);
                                        notifications.show({ title: 'Error', message: 'Failed to add tag.', color: 'red' });
                                      } finally {
                                        setIsTaggingLoading(false);
                                      }
                                    }
                                  }}
                                  rightSection={
                                    tagObj.hasAdded ? (
                                      <ActionIcon size="xs" color="blue" radius="xl" variant="transparent"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          setIsTaggingLoading(true);
                                          try {
                                            await discussionService.removeSongTag(id, tagObj.tagId, user.id);
                                            setDiscussionData(prev => ({
                                              ...prev,
                                              tags: prev.tags.filter(t => !(t.tag_id === tagObj.tagId && t.user_id === user.id))
                                            }));
                                            notifications.show({ title: 'Tag Removed', message: `Removed tag "${tagObj.tagName}".`, color: 'blue' });
                                          } catch (err) {
                                            console.error('Failed to remove tag', err);
                                            notifications.show({ title: 'Error', message: 'Failed to remove tag.', color: 'red' });
                                          } finally {
                                            setIsTaggingLoading(false);
                                          }
                                        }}
                                      >
                                        <IconX size={10} />
                                      </ActionIcon>
                                    ) : null
                                  }
                                >
                                  {tagObj.tagName} <Text span size="xs" c={tagObj.hasAdded ? "white" : "dimmed"} ml={4}>({tagObj.count})</Text>
                                </Badge>
                              </HoverCard.Target>
                              <HoverCard.Dropdown>
                                <Stack gap="xs">
                                  <Text size="sm" fw={700}>{tagObj.tagName}</Text>
                                  {tagObj.description ? (
                                    <Text size="xs" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>{tagObj.description}</Text>
                                  ) : (
                                    <Text size="xs" c="dimmed" fs="italic">No description available.</Text>
                                  )}
                                  <Box mt="xs">
                                    <Text size="xs" fw={500} mb={4}>Added by:</Text>
                                    <Avatar.Group spacing="sm">
                                      {tagObj.users.slice(0, 5).map((u, i) => (
                                        <Tooltip key={i} label={u?.display_name || 'Unknown'}>
                                          <Avatar src={getProfileImageUrl(u)} size="sm" radius="xl" />
                                        </Tooltip>
                                      ))}
                                      {tagObj.users.length > 5 && (
                                        <Tooltip label={`${tagObj.users.length - 5} more`}>
                                          <Avatar size="sm" radius="xl">+{tagObj.users.length - 5}</Avatar>
                                        </Tooltip>
                                      )}
                                    </Avatar.Group>
                                  </Box>
                                  {user && !tagObj.hasAdded && (
                                    <Text size="xs" c="blue" mt="xs" fw={500}>Click badge to add this tag</Text>
                                  )}
                                </Stack>
                              </HoverCard.Dropdown>
                            </HoverCard>
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
                      <Stack gap="xs" mt="xs">
                        <Group wrap="nowrap" align="flex-end">
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

                              const existingTag = availableTags.find(t => t.tag_name.toLowerCase() === tagInput.toLowerCase());

                              if (existingTag) {
                                setIsTaggingLoading(true);
                                try {
                                  await discussionService.addSongTag(id, existingTag.id, user.id);
                                  setDiscussionData(prev => ({
                                    ...prev,
                                    tags: [
                                      ...prev.tags,
                                      {
                                        song_id: id,
                                        tag_id: existingTag.id,
                                        user_id: user.id,
                                        song_tags_dictionary: { tag_name: existingTag.tag_name, description: existingTag.description },
                                        user_profiles: { display_name: userRoles?.display_name || 'You', display_photo_url: userRoles?.display_photo_url }
                                      }
                                    ]
                                  }));
                                  setNewTagValue('');
                                  notifications.show({
                                    title: 'Tag Added',
                                    message: `Added tag "${existingTag.tag_name}" to song.`,
                                    color: 'green'
                                  });
                                } catch (err) {
                                  console.error('Failed to add existing tag', err);
                                  notifications.show({ title: 'Error', message: 'Failed to add tag.', color: 'red' });
                                } finally {
                                  setIsTaggingLoading(false);
                                }
                              } else {
                                // Open description prompt for new tags
                                const description = window.prompt(`Enter a description for the new tag "${tagInput}" (optional):`);
                                if (description === null) return; // Cancelled

                                setIsTaggingLoading(true);
                                try {
                                  const isSuperAdmin = !!userRoles?.is_super_admin;
                                  const status = isSuperAdmin ? 'approved' : 'pending';
                                  const newTag = await discussionService.addCustomTag(tagInput, description, status);
                                  await discussionService.addSongTag(id, newTag.id, user.id);

                                  setDiscussionData(prev => ({
                                    ...prev,
                                    tags: [
                                      ...prev.tags,
                                      {
                                        song_id: id,
                                        tag_id: newTag.id,
                                        user_id: user.id,
                                        song_tags_dictionary: { tag_name: newTag.tag_name, description: newTag.description },
                                        user_profiles: { display_name: userRoles?.display_name || 'You', display_photo_url: userRoles?.display_photo_url }
                                      }
                                    ]
                                  }));
                                  setNewTagValue('');
                                  notifications.show({
                                    title: isSuperAdmin ? 'Tag Added' : 'Tag Requested',
                                    message: isSuperAdmin
                                      ? `Custom tag "${newTag.tag_name}" has been added and auto-approved.`
                                      : `Custom tag "${newTag.tag_name}" has been requested and is pending moderation.`,
                                    color: isSuperAdmin ? 'green' : 'blue'
                                  });
                                } catch (err) {
                                  console.error('Failed to create custom tag', err);
                                  notifications.show({ title: 'Error', message: 'Failed to create tag.', color: 'red' });
                                } finally {
                                  setIsTaggingLoading(false);
                                }
                              }
                            }}
                          >
                            <IconPlus size={16} />
                          </ActionIcon>
                        </Group>
                        {!availableTags.find(t => t.tag_name.toLowerCase() === newTagValue.trim().toLowerCase()) && newTagValue.trim() !== '' && (
                          <Text size="xs" c="dimmed">
                            This is a new tag. You can add a description after clicking the plus icon.
                          </Text>
                        )}
                      </Stack>
                    ) : (
                      <Text size="xs" c="dimmed" fs="italic" ta="center" mt="xs">
                        Log in to add tags
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
                      const upvotes = comment.song_comment_votes?.filter(v => v.vote_type === 1) || [];
                      const downvotes = comment.song_comment_votes?.filter(v => v.vote_type === -1) || [];
                      const myVote = comment.song_comment_votes?.find(v => v.user_id === user?.id)?.vote_type || 0;

                      return (
                        <Paper key={comment.id} p="sm" radius="md" withBorder bg="var(--mantine-color-default-hover)">
                          <Group justify="space-between" align="flex-start" mb="xs">
                            <Group gap="xs">
                              <Avatar
                                src={getProfileImageUrl(comment.user_profiles)}
                                size={40}
                                radius="xl"
                                component={Link}
                                to={`/p/${comment.user_profiles?.slug || comment.user_id}`}
                                style={{ cursor: 'pointer' }}
                              />
                              <Stack gap={0}>
                                <Text
                                  fw={500}
                                  size="sm"
                                  component={Link}
                                  to={`/p/${comment.user_profiles?.slug || comment.user_id}`}
                                  style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                  {comment.user_profiles?.display_name || 'Unknown User'}
                                </Text>
                                <Text c="dimmed" size="xs" title={new Date(comment.created_at).toLocaleString()}>
                                  {getRelativeTimeCb(comment.created_at)}
                                </Text>
                              </Stack>
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

                          <Group gap={8} mt="sm">
                            <Group gap={4}>
                              <ActionIcon
                                variant={myVote === 1 ? 'light' : 'subtle'}
                                color={myVote === 1 ? 'blue' : 'gray'}
                                size="md"
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
                                          filteredVotes.push({ user_id: user.id, vote_type: nextVote, user_profiles: { display_name: userRoles?.display_name || 'You', display_photo_url: userRoles?.display_photo_url } });
                                        }
                                        return { ...c, song_comment_votes: filteredVotes };
                                      })
                                    }));
                                  } catch (err) {
                                    console.error('Failed to vote', err);
                                  }
                                }}
                              >
                                {myVote === 1 ? <IconThumbUpFilled size={20} /> : <IconThumbUp size={20} />}
                              </ActionIcon>
                              {upvotes.length > 0 && (
                                <Text
                                  size="sm"
                                  c="dimmed"
                                  fw={myVote === 1 ? 700 : 400}
                                  onClick={() => {
                                    setSelectedCommentId(comment.id);
                                    setInitialVoterTab('likes');
                                    setVotersOpened(true);
                                  }}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {upvotes.length}
                                </Text>
                              )}
                            </Group>

                            <Group gap={4}>
                              <ActionIcon
                                variant={myVote === -1 ? 'light' : 'subtle'}
                                color={myVote === -1 ? 'red' : 'gray'}
                                size="md"
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
                                          filteredVotes.push({ user_id: user.id, vote_type: nextVote, user_profiles: { display_name: userRoles?.display_name || 'You', display_photo_url: userRoles?.display_photo_url } });
                                        }
                                        return { ...c, song_comment_votes: filteredVotes };
                                      })
                                    }));
                                  } catch (err) {
                                    console.error('Failed to vote', err);
                                  }
                                }}
                              >
                                {myVote === -1 ? <IconThumbDownFilled size={20} /> : <IconThumbDown size={20} />}
                              </ActionIcon>
                              {downvotes.length > 0 && (
                                <Text
                                  size="sm"
                                  c="dimmed"
                                  fw={myVote === -1 ? 700 : 400}
                                  onClick={() => {
                                    setSelectedCommentId(comment.id);
                                    setInitialVoterTab('dislikes');
                                    setVotersOpened(true);
                                  }}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {downvotes.length}
                                </Text>
                              )}
                            </Group>
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

      <AddToPlaylistModal
        opened={addToPlaylistOpened}
        onClose={() => setAddToPlaylistOpened(false)}
        songData={{
          id: song.id,
          songId: song.songId,
          title: song.title,
          imageUrl: import.meta.env.VITE_SONG_JACKETS_URL + song.imageName
        }}
      />

      <VoterListModal
        opened={votersOpened}
        onClose={() => setVotersOpened(false)}
        title="Comment Voters"
        fetchVoters={() => discussionService.getSongCommentVoters(selectedCommentId)}
        initialTab={initialVoterTab}
      />

      {/* Tag Glossary Modal */}
      <Modal
        opened={glossaryOpened}
        onClose={() => setGlossaryOpened(false)}
        title={<Title order={3}>Tag Glossary</Title>}
        size="lg"
      >
        <Stack gap="md">
          {availableTags.length === 0 ? (
            <Text c="dimmed">No tags available in the dictionary.</Text>
          ) : (
            availableTags.map((tag) => (
              <Paper key={tag.id} p="sm" withBorder radius="md">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Stack gap={4} style={{ flex: 1 }}>
                    <Badge variant="light" color="blue" size="lg">{tag.tag_name}</Badge>
                    {tag.description ? (
                      <Text size="sm" mt="xs">{tag.description}</Text>
                    ) : (
                      <Text size="sm" c="dimmed" mt="xs" fs="italic">No description available.</Text>
                    )}
                  </Stack>
                </Group>
              </Paper>
            ))
          )}
        </Stack>
      </Modal>
    </Container >
  );
}
