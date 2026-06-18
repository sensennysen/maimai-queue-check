import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Container, Stack, Group, Text, Button, Paper,
  Grid, Box
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';
import IconChevronRight from '@tabler/icons-react/dist/esm/icons/IconChevronRight.mjs';

import { useAuth } from '../hooks/useAuth';
import { useSongDatabaseContext } from '../hooks/useSongDatabaseContext';
import { useBranch } from '../hooks/useBranch';
import { FeedSongCard } from '../components/feed/FeedSongCard';
import { FeedPlaylistCard } from '../components/feed/FeedPlaylistCard';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '../components/common/PullToRefreshIndicator';
import { FeedPostComposer } from '../components/feed/FeedPostComposer';
import { FeedPostCard } from '../components/feed/FeedPostCard';
import './FeedPage.css';

// Feature Modular Pieces
import { useFeedData } from '../features/feed/hooks/useFeedData';
import { PanelHeader } from '../features/feed/components/PanelHeader';
import { SectionSkeleton } from '../features/feed/components/SectionSkeleton';
import { SuggestedPlayersCarousel } from '../features/feed/components/SuggestedPlayersCarousel';
import { CommunityCarouselRow } from '../features/feed/components/CommunityCarouselRow';

const POSTS_PER_INSERTION = 4;
const SUGGESTED_PLAYER_COUNT = 5;

function pickRandomPlayers(players, count) {
  if (!players?.length) return [];
  const pool = [...players];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export default function FeedPage() {
  const navigate = useNavigate();
  const { user, userRoles } = useAuth();
  const { loading: songsLoading, songMapById, songs } = useSongDatabaseContext();
  const { branches } = useBranch();
  const [suggestedPool, setSuggestedPool] = useState([]);
  const isDesktop = useMediaQuery('(min-width: 62em)');
  const loadMoreRef = useRef(null);

  const branchMap = useMemo(() => {
    const map = {};
    branches.forEach((b) => {
      map[b.id] = b.acronym || b.short_name || b.arcade_name;
    });
    return map;
  }, [branches]);

  const {
    newSongs,
    suggestedPlayers,
    followedIds,
    communityPosts,
    setCommunityPosts,
    hasMoreCommunityPosts,
    loadingCommunityPosts,
    loadingMoreCommunityPosts,
    loadingDiscussions,
    loadingPosts,
    loadingPlayers,
    loadMoreCommunityPosts,
    createPost,
    toggleFollow,
    refreshAll,
    trendingRows,
    playlistRows
  } = useFeedData(user, userRoles, songs, songMapById);



  const { pullDistance, isRefreshingByPull, touchHandlers } = usePullToRefresh(refreshAll, loadingDiscussions || loadingPosts || loadingCommunityPosts);



  useEffect(() => {
    setSuggestedPool(pickRandomPlayers(suggestedPlayers, SUGGESTED_PLAYER_COUNT));
  }, [suggestedPlayers]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasMoreCommunityPosts) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreCommunityPosts();
        }
      },
      { root: null, rootMargin: '500px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreCommunityPosts, loadMoreCommunityPosts]);



  const moduleCycle = useMemo(() => {
    const modules = ['suggested'];
    if (!isDesktop) modules.push('newSongs', 'recentDiscussions', 'communityPlaylists');
    return modules;
  }, [isDesktop]);

  const feedItems = useMemo(() => {
    if (!communityPosts.length) return [];
    const items = [];
    let moduleCursor = 0;

    communityPosts.forEach((post, index) => {
      items.push({ type: 'post', key: `post-${post.id}`, post });
      const shouldInsertModule = (index + 1) % POSTS_PER_INSERTION === 0;
      if (shouldInsertModule) {
        const moduleType = moduleCycle[moduleCursor % moduleCycle.length];
        items.push({ type: 'module', moduleType, key: `module-${moduleType}-${index}` });
        moduleCursor += 1;
      }
    });

    return items;
  }, [communityPosts, moduleCycle]);

  const suggestedBlock = (
    <SuggestedPlayersCarousel
      players={suggestedPool}
      followedIds={followedIds}
      branchMap={branchMap}
      loading={loadingPlayers}
      onFollow={toggleFollow}
      onPlayerClick={(player) => player.slug && navigate(`/p/${player.slug}`)}
      className="community-suggested-carousel"
    />
  );

  const newSongsBlock = (
    <Paper p="lg" radius="md" withBorder className="community-panel community-module-panel community-discovery-panel">
      <PanelHeader
        title="New Songs"
        rightSection={<Button variant="subtle" size="sm" rightSection={<IconChevronRight size={14} />} onClick={() => navigate('/songs')} style={{ marginTop: '0.5rem' }}  >View all</Button>}
      />
      {songsLoading ? (
        <SectionSkeleton rows={1} height={180} />
      ) : newSongs.length === 0 ? (
        <Text c="dimmed" size="md" ta="center" py="md">No songs found</Text>
      ) : (
        <CommunityCarouselRow isDesktop={isDesktop} watchKey={newSongs.length}>
          <Group gap="sm" wrap="nowrap" className="community-release-row">
            {newSongs.slice(0, 12).map((song) => (
              <Paper key={song.cardId || song.songId || song.id} p="xs" radius="md" withBorder className="community-release-card" onClick={() => navigate(`/songs/${song.cardId || song.songId}`)}>
                <Box
                  className="community-release-image-wrap"
                >
                  {song.imageUrl ? <img src={song.imageUrl} alt={song.title} className="community-release-image" /> : (
                    <Box className="community-release-image community-release-placeholder"><Text fw={700}>{(song.title || '?').charAt(0)}</Text></Box>
                  )}
                </Box>
                <Text fw={600} size="md" lineClamp={1} mt={8}>{song.title}</Text>
                <Text c="dimmed" size="sm" lineClamp={1}>{song.artist || 'Unknown artist'}</Text>
              </Paper>
            ))}
          </Group>
        </CommunityCarouselRow>
      )}
    </Paper>
  );

  const recentDiscussionsBlock = (
    <Paper p="lg" radius="md" withBorder className="community-panel community-trending-panel community-module-panel community-discovery-panel">
      <PanelHeader
        title="Recent Song Discussions"
      />
      {loadingDiscussions ? (
        <SectionSkeleton rows={5} height={146} />
      ) : trendingRows.length === 0 ? (
        <Text c="dimmed" size="md" ta="center" py="md">No recent discussions yet</Text>
      ) : (
        <CommunityCarouselRow
          isDesktop={isDesktop}
          rowClassName="community-module-carousel-scroll"
          watchKey={trendingRows.length}
        >
          <Group gap="sm" wrap="nowrap" className="community-module-carousel-row">
            {trendingRows.map((item) => (
              <div key={item.key} className="community-module-carousel-item">
                <FeedSongCard
                  song={item.song}
                  songId={item.songId}
                  latestComment={item.latestComment}
                  onClick={() => navigate(`/songs/${item.songId}`)}
                  variant="trending"
                  className="community-trending-card"
                />
              </div>
            ))}
          </Group>
        </CommunityCarouselRow>
      )}
    </Paper>
  );

  const playlistsBlock = (
    <Paper p="lg" radius="md" withBorder className="community-panel community-module-panel community-discovery-panel">
      <PanelHeader
        title="Shared Playlists"
        rightSection={
          <Button
            variant="subtle"
            size="sm"
            rightSection={<IconChevronRight size={14} />}
            onClick={() => navigate('/shared-playlists')}
            style={{ marginTop: '0.5rem' }}
          >
            View feed
          </Button>
        }
      />
      {loadingPosts ? (
        <SectionSkeleton rows={3} height={88} />
      ) : playlistRows.length === 0 ? (
        <Text c="dimmed" size="md" ta="center" py="md">No playlist posts yet</Text>
      ) : (
        <CommunityCarouselRow
          isDesktop={isDesktop}
          rowClassName="community-module-carousel-scroll"
          watchKey={playlistRows.length}
        >
          <Group gap="sm" wrap="nowrap" className="community-module-carousel-row">
            {playlistRows.slice(0, 8).map((item) => (
              <div key={item.key} className="community-module-carousel-item">
                <FeedPlaylistCard
                  post={item.post}
                  latestComment={item.latestComment}
                  onClick={() => navigate(item.post?.id ? `/shared-playlists?post=${item.post.id}` : '/shared-playlists')}
                  layout="strip"
                  className="community-playlist-strip"
                />
              </div>
            ))}
          </Group>
        </CommunityCarouselRow>
      )}
    </Paper>
  );

  const renderModule = (moduleType) => {
    if (moduleType === 'suggested') return suggestedBlock;
    if (moduleType === 'newSongs') return newSongsBlock;
    if (moduleType === 'recentDiscussions') return recentDiscussionsBlock;
    if (moduleType === 'communityPlaylists') return playlistsBlock;
    return null;
  };

  return (
    <Container
      size="xl"
      py={0}
      className="community-feed-page animate-fade-in"
      {...touchHandlers}
    >
      <Stack gap="lg">
        {(pullDistance > 0 || isRefreshingByPull) && (
          <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshingByPull} />
        )}

        <Grid gutter="xl" className="community-feed-layout">
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Stack gap="lg">
              {user && (
                <FeedPostComposer
                  user={user}
                  profileData={userRoles}
                  onSubmit={createPost}
                />
              )}

              <Paper p={0} radius="md" withBorder className="community-panel community-posts-panel">
                <PanelHeader
                  title="Posts"
                  className="community-posts-header"
                />
                {loadingCommunityPosts ? (
                  <SectionSkeleton rows={3} height={100} />
                ) : communityPosts.length === 0 ? (
                  <Text c="dimmed" size="md" ta="center" py="md">
                    No posts yet. Be the first to share something!
                  </Text>
                ) : (
                    <Stack gap={0} className="community-post-stream">
                    {feedItems.map((item) => {
                      if (item.type === 'post') {
                        return (
                          <FeedPostCard
                            key={item.key}
                            post={item.post}
                            currentUser={user}
                            profileData={userRoles}
                            onDelete={(id) => setCommunityPosts(prev => prev.filter(p => p.id !== id))}
                            onUpdate={(id, content) => setCommunityPosts(prev => prev.map(p => p.id === id ? { ...p, content } : p))}
                            className="community-post-card"
                          />
                        );
                      }
                      return (
                        <Box key={item.key} className="community-feed-module">
                          {renderModule(item.moduleType)}
                        </Box>
                      );
                    })}
                    {loadingMoreCommunityPosts && <SectionSkeleton rows={2} height={96} />}
                    <Box ref={loadMoreRef} h={8} />
                    {!hasMoreCommunityPosts && (
                      <Text c="dimmed" size="sm" ta="center" py="xs">
                        You are caught up for now.
                      </Text>
                    )}
                  </Stack>
                )}
              </Paper>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }} className="community-sidebar-col">
            {isDesktop && (
              <Box
                component="div"
                className="community-sidebar"
              >
                <Stack gap="lg" pr={4} pb="sm">
                  {newSongsBlock}
                  {recentDiscussionsBlock}
                  {playlistsBlock}
                </Stack>
              </Box>
            )}
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
