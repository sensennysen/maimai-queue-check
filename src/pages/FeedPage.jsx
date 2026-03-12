import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Container, Stack, Group, Title, Text, Button, Paper,
  Grid, ActionIcon, Box, Skeleton, ScrollArea, Modal
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import IconRefresh from '@tabler/icons-react/dist/esm/icons/IconRefresh.mjs';
import IconChevronRight from '@tabler/icons-react/dist/esm/icons/IconChevronRight.mjs';
import IconUsers from '@tabler/icons-react/dist/esm/icons/IconUsers.mjs';

import { useAuth } from '../hooks/useAuth';
import { useSongDatabaseContext } from '../hooks/useSongDatabaseContext';
import { useBranch } from '../hooks/useBranch';
import { feedService, followService } from '../services/supabase';
import { FeedSongCard } from '../components/feed/FeedSongCard';
import { FeedPlaylistCard } from '../components/feed/FeedPlaylistCard';
import { FeedPlayerCard } from '../components/feed/FeedPlayerCard';
import { FeedPostComposer } from '../components/feed/FeedPostComposer';
import { FeedPostCard } from '../components/feed/FeedPostCard';
import './FeedPage.css';

const SECTION_LIMIT = 10;

function PanelHeader({ title, subtitle, onRefresh, loading, rightSection, className }) {
  return (
    <Group justify="space-between" align="flex-end" mb="sm" className={className}>
      <Stack gap={2}>
        <Title order={3} className="community-panel-title">{title}</Title>
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

function SectionSkeleton({ rows = 3, height = 72 }) {
  return (
    <Stack gap="sm">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={height} radius="md" />
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

  const branchMap = useMemo(() => {
    const map = {};
    branches.forEach((b) => {
      map[b.id] = b.acronym || b.short_name || b.arcade_name;
    });
    return map;
  }, [branches]);

  const [newSongs, setNewSongs] = useState([]);
  const [songDiscussions, setSongDiscussions] = useState([]);
  const [playlistDiscussions, setPlaylistDiscussions] = useState([]);
  const [newPosts, setNewPosts] = useState([]);
  const [followingActivity, setFollowingActivity] = useState([]);
  const [suggestedPlayers, setSuggestedPlayers] = useState([]);
  const [followedIds, setFollowedIds] = useState(new Set());
  const [morePlayersOpened, setMorePlayersOpened] = useState(false);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [loadingCommunityPosts, setLoadingCommunityPosts] = useState(true);

  const [loadingDiscussions, setLoadingDiscussions] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingFollowingActivity, setLoadingFollowingActivity] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  useEffect(() => {
    requestFetch();
  }, [requestFetch]);

  useEffect(() => {
    if (!songs || songs.length === 0) return;
    const sorted = [...songs]
      .filter((s) => {
        if (s.isMissingMetadata || s.category === 'Unknown') return false;
        return s.sheets?.some((sheet) => sheet.regions?.intl === true);
      })
      .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
      .slice(0, SECTION_LIMIT * 2);
    setNewSongs(sorted);
  }, [songs]);

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

  const fetchSuggestedPlayers = useCallback(async () => {
    if (!user) return;
    const mainBranch = userRoles?.main_branch || null;
    const preferredBranches = userRoles?.preferred_branches || [];

    setLoadingPlayers(true);
    try {
      const targetLimit = 20;
      // Fetch a larger pool to ensure we have enough after filtering followed players
      const players = await feedService.getSuggestedPlayers(user.id, mainBranch, preferredBranches, 100);
      
      if (players?.length > 0) {
        const ids = players.map((p) => p.id);
        const followed = await followService.getBulkFollowStatus(user.id, ids);
        setFollowedIds(followed);
        
        // Filter unfollowed and slice to the intended count
        const unfollowed = players.filter((p) => !followed.has(p.id)).slice(0, targetLimit);
        setSuggestedPlayers(unfollowed);
      } else {
        setSuggestedPlayers([]);
      }
    } catch (err) {
      console.error('Failed to load suggested players:', err);
    } finally {
      setLoadingPlayers(false);
    }
  }, [user, userRoles?.main_branch, userRoles?.preferred_branches]);

  const fetchFollowingActivity = useCallback(async () => {
    if (!user?.id) {
      setFollowingActivity([]);
      return;
    }

    setLoadingFollowingActivity(true);
    try {
      const data = await feedService.getFollowingActivity(user.id, SECTION_LIMIT);
      setFollowingActivity(data || []);
    } catch (err) {
      console.error('Failed to load following activity:', err);
    } finally {
      setLoadingFollowingActivity(false);
    }
  }, [user?.id]);

  const fetchCommunityPosts = useCallback(async () => {
    setLoadingCommunityPosts(true);
    try {
      const data = await feedService.getFeedPosts(user?.id, SECTION_LIMIT);
      setCommunityPosts(data || []);
    } catch (err) {
      console.error('Failed to load community posts:', err);
    } finally {
      setLoadingCommunityPosts(false);
    }
  }, [user?.id]);

  const handleCreatePost = useCallback(async (content, visibility, songId, playlistId, imageUrl) => {
    if (!user) return;
    try {
      const newPost = await feedService.createFeedPost(user.id, content, visibility, songId, playlistId, imageUrl);
      setCommunityPosts(prev => [{ ...newPost, comment_count: 0 }, ...prev]);
      notifications.show({ title: 'Posted!', message: 'Your post is now live.', color: 'green', autoClose: 2000 });
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to create post.', color: 'red' });
    }
  }, [user]);

  useEffect(() => {
    fetchSongDiscussions();
    fetchPlaylistData();
    fetchCommunityPosts();
  }, [fetchSongDiscussions, fetchPlaylistData, fetchCommunityPosts]);

  useEffect(() => {
    fetchFollowingActivity();
  }, [fetchFollowingActivity]);

  useEffect(() => {
    if (user && userRoles?.user_id && !hasLoadedPlayers.current) {
      fetchSuggestedPlayers();
      hasLoadedPlayers.current = true;
    }
  }, [fetchSuggestedPlayers, user, userRoles?.user_id]);

  useEffect(() => {
    hasLoadedPlayers.current = false;
  }, [user?.id]);

  const handleFollow = useCallback(async (targetId) => {
    if (!user) {
      notifications.show({ title: 'Login required', message: 'Please log in to follow players.', color: 'blue' });
      return;
    }

    const isCurrentlyFollowing = followedIds.has(targetId);
    setFollowedIds((prev) => {
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
      setFollowedIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFollowing) next.add(targetId);
        else next.delete(targetId);
        return next;
      });
      notifications.show({ title: 'Error', message: 'Failed to update follow status.', color: 'red' });
    }
  }, [user, followedIds]);

  const handleRefreshAll = () => {
    fetchSongDiscussions();
    fetchPlaylistData();
    fetchFollowingActivity();
    fetchSuggestedPlayers();
    fetchCommunityPosts();
  };

  const isLoading = loadingDiscussions || loadingPosts;
  const trendingRows = useMemo(() => {
    return songDiscussions.map((item) => ({
      key: `trending-disc-${item.song_id}-${item.created_at}`,
      song: songMapById?.get(item.song_id),
      songId: item.song_id,
      latestComment: {
        content: item.content,
        author: item.user_profiles,
        createdAt: item.created_at,
      },
    }));
  }, [songDiscussions, songMapById]);

  const playlistRows = playlistDiscussions.length > 0
    ? playlistDiscussions.map((item) => ({
      key: `discussion-${item.post_id}`,
      post: item.post,
      latestComment: {
        content: item.content,
        author: item.user_profiles,
        createdAt: item.created_at,
      },
    }))
    : newPosts.map((post) => ({ key: post.id, post }));

  return (
    <Container size="xl" py="lg" className="community-feed-page animate-fade-in">
      <Stack gap="lg">
        <Group justify="flex-end" align="center" wrap="wrap" gap="xs" w="100%">
          <Button
            variant="subtle"
            leftSection={<IconRefresh size={16} />}
            onClick={handleRefreshAll}
            loading={isLoading}
            size="xs"
          >
            Refresh
          </Button>
        </Group>

        <Grid gutter="xl" className="community-feed-layout">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="lg">
              {/* Post Composer — visible to logged-in users only */}
              {user && (
                <FeedPostComposer 
                  user={user} 
                  profileData={userRoles} 
                  onSubmit={handleCreatePost} 
                />
              )}

              {/* Community Posts panel */}
              <Paper p="md" radius="xl" withBorder className="community-panel">
                <PanelHeader
                  title="Community Posts"
                  subtitle="Latest posts from the community"
                  onRefresh={fetchCommunityPosts}
                  loading={loadingCommunityPosts}
                />
                {loadingCommunityPosts ? (
                  <SectionSkeleton rows={3} height={100} />
                ) : communityPosts.length === 0 ? (
                  <Text c="dimmed" size="sm" ta="center" py="md">
                    No posts yet. Be the first to share something!
                  </Text>
                ) : (
                  <Stack gap="sm">
                    {communityPosts.map(post => (
                      <FeedPostCard
                        key={post.id}
                        post={post}
                        currentUser={user}
                        profileData={userRoles}
                        onDelete={(id) => setCommunityPosts(prev => prev.filter(p => p.id !== id))}
                        onUpdate={(id, content) => setCommunityPosts(prev => prev.map(p => p.id === id ? { ...p, content } : p))}
                        className="community-trending-card"
                      />
                    ))}
                  </Stack>
                )}
              </Paper>

              <Paper p="md" radius="xl" withBorder className="community-panel">
                <PanelHeader
                  title="Following Activity"
                  subtitle="What people you follow are doing now"
                  onRefresh={fetchFollowingActivity}
                  loading={loadingFollowingActivity}
                />

                {!user ? (
                  <Text c="dimmed" size="sm" ta="center" py="md">
                    Log in to see updates from players you follow.
                  </Text>
                ) : loadingFollowingActivity ? (
                  <SectionSkeleton rows={4} height={84} />
                ) : followingActivity.length === 0 ? (
                  <Text c="dimmed" size="sm" ta="center" py="md">
                    No activity from followed players yet.
                  </Text>
                ) : (
                  <Stack gap="sm">
                    {followingActivity.map((item) => (
                      <Box key={item.id}>
                        {item.type === 'feed_post' ? (
                          <FeedPostCard
                            post={item.feed_post}
                            currentUser={user}
                            className="community-following-activity-row"
                          />
                        ) : item.type === 'song_comment' && item.song_id ? (
                          <FeedSongCard
                            song={songMapById?.get(item.song_id)}
                            songId={item.song_id}
                            latestComment={item.comment}
                            onClick={() => navigate(`/songs/${item.song_id}`)}
                            variant="discussion"
                            className="community-following-activity-row"
                          />
                        ) : (
                          <FeedPlaylistCard
                            post={item.post}
                            latestComment={item.type === 'playlist_comment' ? item.comment : null}
                            onClick={() => {
                              const targetPostId = item.playlist_post_id || item.post?.id;
                              if (targetPostId) navigate(`/shared-playlists?post=${targetPostId}`);
                              else navigate('/shared-playlists');
                            }}
                            layout="strip"
                            className="community-following-activity-row"
                          />
                        )}
                      </Box>
                    ))}
                  </Stack>
                )}
              </Paper>

              <Paper p="md" radius="xl" withBorder className="community-panel community-trending-panel">
                <PanelHeader
                  title="Active Song Discussions"
                  subtitle="Most recent conversations about songs in maimai DX"
                  onRefresh={fetchSongDiscussions}
                  loading={loadingDiscussions}
                />

                {loadingDiscussions ? (
                  <SectionSkeleton rows={5} height={146} />
                ) : trendingRows.length === 0 ? (
                  <Text c="dimmed" size="sm" ta="center" py="md">No recent discussions yet</Text>
                ) : (
                  <Stack gap="sm">
                    {trendingRows.map((item) => (
                      <FeedSongCard
                        key={item.key}
                        song={item.song}
                        songId={item.songId}
                        latestComment={item.latestComment}
                        onClick={() => navigate(`/songs/${item.songId}`)}
                        variant="trending"
                        className="community-trending-card"
                      />
                    ))}
                  </Stack>
                )}
              </Paper>

              <Paper p="md" radius="xl" withBorder className="community-panel">
                <PanelHeader
                  title="New Songs"
                  subtitle="Recently released songs in maimai DX"
                  onRefresh={() => requestFetch()}
                  loading={songsLoading}
                  rightSection={(
                    <Button
                      variant="subtle"
                      size="xs"
                      px={0}
                      rightSection={<IconChevronRight size={14} />}
                      onClick={() => navigate('/songs')}
                    >
                      View all
                    </Button>
                  )}
                />

                {songsLoading ? (
                  <SectionSkeleton rows={1} height={180} />
                ) : newSongs.length === 0 ? (
                  <Text c="dimmed" size="sm" ta="center" py="md">No songs found</Text>
                ) : (
                  <ScrollArea type="never">
                    <Group gap="sm" wrap="nowrap" className="community-release-row">
                      {newSongs.slice(0, 12).map((song) => (
                        <Paper
                          key={song.cardId || song.songId || song.id}
                          p="xs"
                          radius="lg"
                          withBorder
                          className="community-release-card"
                          onClick={() => navigate(`/songs/${song.cardId || song.songId}`)}
                        >
                          <Box className="community-release-image-wrap">
                            {song.imageUrl ? (
                              <img
                                src={song.imageUrl}
                                alt={song.title}
                                className="community-release-image"
                              />
                            ) : (
                              <Box className="community-release-image community-release-placeholder">
                                <Text fw={700}>{(song.title || '?').charAt(0)}</Text>
                              </Box>
                            )}
                          </Box>
                          <Text fw={600} size="sm" lineClamp={1} mt={8}>{song.title}</Text>
                          <Text c="dimmed" size="xs" lineClamp={1}>{song.artist || 'Unknown artist'}</Text>
                        </Paper>
                      ))}
                    </Group>
                  </ScrollArea>
                )}
              </Paper>

              <Paper p="md" radius="xl" withBorder className="community-panel">
                <PanelHeader
                  title="Community Playlists"
                  subtitle="Latest playlist conversations"
                  onRefresh={fetchPlaylistData}
                  loading={loadingPosts}
                  rightSection={(
                    <Button
                      variant="subtle"
                      size="xs"
                      px={0}
                      rightSection={<IconChevronRight size={14} />}
                      onClick={() => navigate('/shared-playlists')}
                    >
                      View feed
                    </Button>
                  )}
                />

                {loadingPosts ? (
                  <SectionSkeleton rows={3} height={88} />
                ) : playlistRows.length === 0 ? (
                  <Text c="dimmed" size="sm" ta="center" py="md">No playlist posts yet</Text>
                ) : (
                  <Stack gap="sm">
                    {playlistRows.slice(0, 4).map((item) => (
                      <FeedPlaylistCard
                        key={item.key}
                        post={item.post}
                        latestComment={item.latestComment}
                        onClick={() => navigate('/shared-playlists')}
                        layout="strip"
                        className="community-playlist-strip"
                      />
                    ))}
                  </Stack>
                )}
              </Paper>

            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper p="md" radius="xl" withBorder className="community-sidebar" style={{ position: 'sticky', top: '1rem' }}>
              <PanelHeader
                title="Suggested Players"
                subtitle="People you may want to follow"
                onRefresh={fetchSuggestedPlayers}
                loading={loadingPlayers}
                className="community-sidebar-header"
              />

              {!user ? (
                <Paper p="md" radius="md" withBorder className="community-sidebar-empty">
                  <Text size="sm" c="dimmed" ta="center">
                    Log in and set your branch to see player suggestions.
                  </Text>
                </Paper>
              ) : loadingPlayers ? (
                <SectionSkeleton rows={5} height={72} />
              ) : suggestedPlayers.length === 0 ? (
                <Paper p="md" radius="md" withBorder className="community-sidebar-empty">
                  <Text size="sm" c="dimmed" ta="center">
                    Set your home or preferred branches in App Settings to see suggestions.
                  </Text>
                </Paper>
              ) : (
                <Stack gap="xs">
                  {suggestedPlayers.slice(0, 8).map((player) => (
                    <FeedPlayerCard
                      key={player.id}
                      player={player}
                      isFollowing={followedIds.has(player.id)}
                      onFollow={() => handleFollow(player.id)}
                      onClick={() => player.slug && navigate(`/p/${player.slug}`)}
                      branchMap={branchMap}
                      className="community-player-row"
                    />
                  ))}
                  {suggestedPlayers.length > 8 && (
                    <Button
                      variant="light"
                      color="gray"
                      size="xs"
                      fullWidth
                      onClick={() => setMorePlayersOpened(true)}
                      mt="xs"
                    >
                      Show {suggestedPlayers.length - 8} more players
                    </Button>
                  )}
                </Stack>
              )}
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>

      <Modal
        opened={morePlayersOpened}
        onClose={() => setMorePlayersOpened(false)}
        title={(
          <Group gap="xs">
            <IconUsers size={20} style={{ color: 'var(--theme-primary)' }} />
            <Text fw={700}>More Suggested Players</Text>
          </Group>
        )}
        size="md"
        radius="md"
      >
        <Stack gap="xs" py="xs">
          {suggestedPlayers.map((player) => (
            <FeedPlayerCard
              key={`modal-${player.id}`}
              player={player}
              isFollowing={followedIds.has(player.id)}
              onFollow={() => handleFollow(player.id)}
              onClick={() => {
                setMorePlayersOpened(false);
                if (player.slug) navigate(`/p/${player.slug}`);
              }}
              branchMap={branchMap}
            />
          ))}
        </Stack>
      </Modal>
    </Container>
  );
}
