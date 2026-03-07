import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Container, Stack, Group, Title, Text, Button, Paper,
  Grid, Avatar, Divider, ActionIcon, Box, Tabs, Alert,
  Skeleton, ScrollArea, Anchor, Modal
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import IconRefresh from '@tabler/icons-react/dist/esm/icons/IconRefresh.mjs';
import IconArrowLeft from '@tabler/icons-react/dist/esm/icons/IconArrowLeft.mjs';
import IconChevronRight from '@tabler/icons-react/dist/esm/icons/IconChevronRight.mjs';
import IconMusic from '@tabler/icons-react/dist/esm/icons/IconMusic.mjs';
import IconMessageCircle from '@tabler/icons-react/dist/esm/icons/IconMessageCircle.mjs';
import IconPlaylist from '@tabler/icons-react/dist/esm/icons/IconPlaylist.mjs';
import IconUsers from '@tabler/icons-react/dist/esm/icons/IconUsers.mjs';
import IconSparkles from '@tabler/icons-react/dist/esm/icons/IconSparkles.mjs';
import IconAlertCircle from '@tabler/icons-react/dist/esm/icons/IconAlertCircle.mjs';
import { useAuth } from '../hooks/useAuth';
import { useSongDatabaseContext } from '../hooks/useSongDatabaseContext';
import { useBranch } from '../hooks/useBranch';
import { feedService, followService } from '../services/supabase';
import { getRelativeTime, getProfileImageUrl } from '../utils/formatters';
import { FeedSongCard } from '../components/feed/FeedSongCard';
import { FeedPlaylistCard } from '../components/feed/FeedPlaylistCard';
import { FeedPlayerCard } from '../components/feed/FeedPlayerCard';

const SECTION_LIMIT = 10;

function SectionHeader({ icon, title, subtitle, onRefresh, loading, rightSection }) {
  return (
    <Group justify="space-between" align="flex-end" mb="sm">
      <Stack gap={2}>
        <Group gap="xs">
          <Box style={{ color: 'var(--theme-primary)' }}>{icon}</Box>
          <Title order={3} style={{ fontFamily: 'var(--font-heading)' }}>{title}</Title>
        </Group>
        {subtitle && <Text size="xs" c="dimmed">{subtitle}</Text>}
      </Stack>
      <Group gap="xs">
        {rightSection}
        {onRefresh && (
          <ActionIcon variant="subtle" size="sm" onClick={onRefresh} loading={loading}>
            <IconRefresh size={16} />
          </ActionIcon>
        )}
      </Group>
    </Group>
  );
}

function SectionSkeleton({ rows = 3 }) {
  return (
    <Stack gap="sm">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={70} radius="md" />
      ))}
    </Stack>
  );
}

export default function FeedPage() {
  const navigate = useNavigate();
  const { user, userRoles } = useAuth();
  const { songs, loading: songsLoading, requestFetch, songMapById } = useSongDatabaseContext();
  const { branches } = useBranch();
  const hasLoadedPlayers = useRef(false);

  // Create mapping of branch ID to name for player cards (acronym preferred)
  const branchMap = useMemo(() => {
    const map = {};
    branches.forEach(b => {
      map[b.id] = b.acronym || b.short_name || b.arcade_name;
    });
    return map;
  }, [branches]);

  // State for each section
  const [newSongs, setNewSongs] = useState([]);
  const [songDiscussions, setSongDiscussions] = useState([]);
  const [playlistDiscussions, setPlaylistDiscussions] = useState([]);
  const [newPosts, setNewPosts] = useState([]);
  const [suggestedPlayers, setSuggestedPlayers] = useState([]);
  const [followedIds, setFollowedIds] = useState(new Set());
  const [morePlayersOpened, setMorePlayersOpened] = useState(false);

  // Loading / error state per section
  const [loadingDiscussions, setLoadingDiscussions] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [newContentAlert, setNewContentAlert] = useState(false);

  // Request song DB on mount
  useEffect(() => {
    requestFetch();
  }, [requestFetch]);

  // Derive new songs from the song database (20 newest by release date)
  // Filter only for songs available in the 'international' region
  useEffect(() => {
    if (!songs || songs.length === 0) return;
    const sorted = [...songs]
      .filter(s => {
        if (s.isMissingMetadata || s.category === 'Unknown') return false;
        // Check if at least one sheet is available in intl region
        return s.sheets?.some(sheet => sheet.regions?.intl === true);
      })
      .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
      .slice(0, SECTION_LIMIT * 2);
    setNewSongs(sorted);
  }, [songs]);

  // Fetch song discussions
  const fetchSongDiscussions = useCallback(async () => {
    setLoadingDiscussions(true);
    try {
      const data = await feedService.getSongsWithRecentDiscussions(SECTION_LIMIT);
      setSongDiscussions(data || []);
    } catch (err) {
      console.error('Failed to load song discussions:', err);
    } finally {
      setLoadingDiscussions(false);
    }
  }, []);

  // Fetch playlist discussions + new posts
  const fetchPlaylistData = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const [discussions, posts] = await Promise.all([
        feedService.getPlaylistsWithRecentDiscussions(SECTION_LIMIT),
        feedService.getNewPlaylistPosts(SECTION_LIMIT),
      ]);
      setPlaylistDiscussions(discussions || []);
      setNewPosts(posts || []);
    } catch (err) {
      console.error('Failed to load playlist data:', err);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  // Fetch suggested players (login + branches required)
  const fetchSuggestedPlayers = useCallback(async () => {
    if (!user) return;
    const mainBranch = userRoles?.main_branch || null;
    const preferredBranches = userRoles?.preferred_branches || [];
    if (!mainBranch && preferredBranches.length === 0) return;

    setLoadingPlayers(true);
    try {
      const [players, followedSet] = await Promise.all([
        feedService.getSuggestedPlayers(user.id, mainBranch, preferredBranches, 15),
        followService.getBulkFollowStatus(user.id, []),
      ]);
      // Pre-fetch follow status for all suggested players
      if (players?.length > 0) {
        const ids = players.map(p => p.id);
        const followed = await followService.getBulkFollowStatus(user.id, ids);
        setFollowedIds(followed);

        // Filter out already followed users from the displayed list
        const filteredPlayers = players.filter(p => !followed.has(p.id));
        setSuggestedPlayers(filteredPlayers);
      } else {
        setSuggestedPlayers([]);
      }
    } catch (err) {
      console.error('Failed to load suggested players:', err);
    } finally {
      setLoadingPlayers(false);
    }
  }, [user?.id, userRoles?.id, userRoles?.main_branch, userRoles?.preferred_branches]); // Re-fetch if user profile or branch preferences change

  // Initial loads
  useEffect(() => {
    fetchSongDiscussions();
    fetchPlaylistData();
  }, [fetchSongDiscussions, fetchPlaylistData]);

  useEffect(() => {
    if (user && userRoles?.user_id && !hasLoadedPlayers.current) {
      fetchSuggestedPlayers();
      hasLoadedPlayers.current = true;
    }
  }, [fetchSuggestedPlayers, user, userRoles?.user_id]);

  // Reset flag if user changes
  useEffect(() => {
    hasLoadedPlayers.current = false;
  }, [user?.id]);

  // Handle follow/unfollow on suggested players
  const handleFollow = useCallback(async (targetId) => {
    if (!user) {
      notifications.show({ title: 'Login required', message: 'Please log in to follow players.', color: 'blue' });
      return;
    }
    const isCurrentlyFollowing = followedIds.has(targetId);
    // Optimistic update
    setFollowedIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyFollowing) next.delete(targetId);
      else next.add(targetId);
      return next;
    });
    try {
      if (isCurrentlyFollowing) {
        await followService.unfollow(user.id, targetId);
      } else {
        await followService.follow(user.id, targetId);
        notifications.show({ title: 'Followed!', message: 'You are now following this player.', color: 'green', autoClose: 2000 });
      }
    } catch {
      // Revert optimistic update
      setFollowedIds(prev => {
        const next = new Set(prev);
        if (isCurrentlyFollowing) next.add(targetId);
        else next.delete(targetId);
        return next;
      });
      notifications.show({ title: 'Error', message: 'Failed to update follow status.', color: 'red' });
    }
  }, [user?.id, followedIds]);

  const handleRefreshAll = () => {
    fetchSongDiscussions();
    fetchPlaylistData();
    fetchSuggestedPlayers();
    setNewContentAlert(false);
  };

  const isLoading = loadingDiscussions || loadingPosts;

  return (
    <Container size="lg" py="xl" className="animate-fade-in">
      <Stack gap="xl">
        {/* Header */}
        <Stack gap={4}>
          <Button
            onClick={() => navigate(-1)}
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            px={0}
            w="fit-content"
            size="sm"
          >
            Back
          </Button>
          <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
            <Stack gap={2}>
              <Group gap="sm">
                <IconSparkles size={32} style={{ color: 'var(--theme-primary)' }} />
                <Title order={1} style={{ fontFamily: 'var(--font-heading)' }}>
                  Community Feed
                </Title>
              </Group>
              <Text c="dimmed" size="sm">
                Discover new songs, discussions, and players in the community
              </Text>
            </Stack>
            <Button
              variant="subtle"
              leftSection={<IconRefresh size={16} />}
              onClick={handleRefreshAll}
              loading={isLoading}
              size="sm"
            >
              Refresh
            </Button>
          </Group>
        </Stack>

        {/* New content alert */}
        {newContentAlert && (
          <Alert
            color="blue"
            variant="light"
            icon={<IconSparkles size={16} />}
            withCloseButton
            onClose={() => setNewContentAlert(false)}
          >
            New content is available — <Anchor component="button" onClick={handleRefreshAll}>Refresh now</Anchor>
          </Alert>
        )}

        <Grid gutter="xl">
          {/* Left column — main content */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="xl">

              {/* ─── New Songs ─── */}
              <section>
                <SectionHeader
                  icon={<IconMusic size={22} />}
                  title="New Songs"
                  subtitle="Recently added to the maimai database"
                  onRefresh={() => requestFetch()}
                  loading={songsLoading}
                />
                {songsLoading ? (
                  <SectionSkeleton rows={3} />
                ) : newSongs.length === 0 ? (
                  <Text c="dimmed" size="sm" ta="center" py="md">No songs found</Text>
                ) : (
                  <ScrollArea.Autosize mah={420} type="scroll">
                    <Stack gap="xs">
                      {newSongs.map(song => (
                        <FeedSongCard
                          key={song.cardId || song.songId || song.id}
                          song={song}
                          onClick={() => navigate(`/songs/${song.cardId || song.songId}`)}
                        />
                      ))}
                    </Stack>
                  </ScrollArea.Autosize>
                )}
              </section>

              <Divider variant="dashed" opacity={0.4} />

              {/* ─── Song Discussions ─── */}
              <section>
                <SectionHeader
                  icon={<IconMessageCircle size={22} />}
                  title="Active Song Discussions"
                  subtitle="Songs with the most recent community activity"
                  onRefresh={fetchSongDiscussions}
                  loading={loadingDiscussions}
                />
                {loadingDiscussions ? (
                  <SectionSkeleton rows={4} />
                ) : songDiscussions.length === 0 ? (
                  <Text c="dimmed" size="sm" ta="center" py="md">No recent discussions yet</Text>
                ) : (
                  <Stack gap="xs">
                    {songDiscussions.map((item, i) => {
                      const song = songMapById?.get(item.song_id);
                      return (
                        <FeedSongCard
                          key={`disc-${item.song_id}-${i}`}
                          song={song}
                          songId={item.song_id}
                          latestComment={{
                            content: item.content,
                            author: item.user_profiles,
                            createdAt: item.created_at,
                          }}
                          onClick={() => navigate(`/songs/${item.song_id}`)}
                          variant="discussion"
                        />
                      );
                    })}
                  </Stack>
                )}
              </section>

              <Divider variant="dashed" opacity={0.4} />

              {/* ─── Playlist Discussions ─── */}
              <section>
                <SectionHeader
                  icon={<IconPlaylist size={22} />}
                  title="Active Playlist Discussions"
                  subtitle="Playlist posts with recent comments"
                  onRefresh={fetchPlaylistData}
                  loading={loadingPosts}
                  rightSection={
                    <Button
                      variant="subtle"
                      size="xs"
                      px={0}
                      rightSection={<IconChevronRight size={14} />}
                      onClick={() => navigate('/shared-playlists')}
                    >
                      View Feed
                    </Button>
                  }
                />
                {loadingPosts ? (
                  <SectionSkeleton rows={3} />
                ) : playlistDiscussions.length === 0 ? (
                  <Text c="dimmed" size="sm" ta="center" py="md">No recent playlist discussions yet</Text>
                ) : (
                  <Stack gap="xs">
                    {playlistDiscussions.map((item, i) => (
                      <FeedPlaylistCard
                        key={`pdisc-${item.post_id}-${i}`}
                        post={item.post}
                        latestComment={{
                          content: item.content,
                          author: item.user_profiles,
                          createdAt: item.created_at,
                        }}
                        songMapById={songMapById}
                        onClick={() => navigate('/shared-playlists')}
                      />
                    ))}
                  </Stack>
                )}
              </section>

              <Divider variant="dashed" opacity={0.4} />

              {/* ─── New Playlist Posts ─── */}
              <section>
                <SectionHeader
                  icon={<IconPlaylist size={22} />}
                  title="New Playlist Posts"
                  subtitle="Latest shared playlists from the community"
                  onRefresh={fetchPlaylistData}
                  loading={loadingPosts}
                  rightSection={
                    <Button
                      variant="subtle"
                      size="xs"
                      px={0}
                      rightSection={<IconChevronRight size={14} />}
                      onClick={() => navigate('/shared-playlists')}
                    >
                      View Feed
                    </Button>
                  }
                />
                {loadingPosts ? (
                  <SectionSkeleton rows={3} />
                ) : newPosts.length === 0 ? (
                  <Text c="dimmed" size="sm" ta="center" py="md">No playlist posts yet</Text>
                ) : (
                  <Stack gap="xs">
                    {newPosts.map(post => (
                      <FeedPlaylistCard
                        key={post.id}
                        post={post}
                        songMapById={songMapById}
                        onClick={() => navigate('/shared-playlists')}
                      />
                    ))}
                  </Stack>
                )}
              </section>

            </Stack>
          </Grid.Col>

          {/* Right sidebar — Suggested Players */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Box style={{ position: 'sticky', top: '1rem' }}>
              <SectionHeader
                icon={<IconUsers size={22} />}
                title="Suggested Players"
                subtitle="Players that you might know"
                onRefresh={fetchSuggestedPlayers}
                loading={loadingPlayers}
              />
              {!user ? (
                <Paper p="md" radius="md" withBorder>
                  <Stack align="center" gap="xs" py="sm">
                    <IconUsers size={32} opacity={0.3} />
                    <Text size="sm" c="dimmed" ta="center">
                      Log in and set your branch to see player suggestions
                    </Text>
                  </Stack>
                </Paper>
              ) : loadingPlayers ? (
                <SectionSkeleton rows={4} />
              ) : suggestedPlayers.length === 0 ? (
                <Paper p="md" radius="md" withBorder>
                  <Stack align="center" gap="xs" py="sm">
                    <IconUsers size={32} opacity={0.3} />
                    <Text size="sm" c="dimmed" ta="center">
                      Set your home or preferred branches in preferences to see suggestions
                    </Text>
                  </Stack>
                </Paper>
              ) : (
                <Stack gap="xs">
                  {suggestedPlayers.slice(0, 10).map(player => (
                    <FeedPlayerCard
                      key={player.id}
                      player={player}
                      isFollowing={followedIds.has(player.id)}
                      onFollow={() => handleFollow(player.id)}
                      onClick={() => player.slug && navigate(`/p/${player.slug}`)}
                      branchMap={branchMap}
                    />
                  ))}
                  {suggestedPlayers.length > 10 && (
                    <Button
                      variant="light"
                      color="gray"
                      size="xs"
                      fullWidth
                      onClick={() => setMorePlayersOpened(true)}
                      mt="xs"
                    >
                      Show More Suggested Players ({suggestedPlayers.length - 10} more)
                    </Button>
                  )}
                </Stack>
              )}
            </Box>
          </Grid.Col>
        </Grid>
      </Stack>

      {/* More Suggested Players Modal */}
      <Modal
        opened={morePlayersOpened}
        onClose={() => setMorePlayersOpened(false)}
        title={
          <Group gap="xs">
            <IconUsers size={20} style={{ color: 'var(--theme-primary)' }} />
            <Text fw={700}>More Suggested Players</Text>
          </Group>
        }
        size="md"
        radius="md"
        classNames={{ content: 'glass-modal' }}
      >
        <Stack gap="xs" py="xs">
          {suggestedPlayers.map(player => (
            <FeedPlayerCard
              key={`modal-${player.id}`}
              player={player}
              isFollowing={followedIds.has(player.id)}
              onFollow={() => handleFollow(player.id)}
              onClick={() => {
                setMorePlayersOpened(false);
                player.slug && navigate(`/p/${player.slug}`);
              }}
              branchMap={branchMap}
            />
          ))}
        </Stack>
      </Modal>
    </Container >
  );
}
