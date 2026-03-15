import { useState, useMemo } from 'react';
import {
  Container, Stack, Group, Text, Button, Paper,
  Grid, Box, ScrollArea, Modal
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import IconRefresh from '@tabler/icons-react/dist/esm/icons/IconRefresh.mjs';
import IconChevronRight from '@tabler/icons-react/dist/esm/icons/IconChevronRight.mjs';
import IconUsers from '@tabler/icons-react/dist/esm/icons/IconUsers.mjs';

import { useAuth } from '../hooks/useAuth';
import { useSongDatabaseContext } from '../hooks/useSongDatabaseContext';
import { useBranch } from '../hooks/useBranch';
import { FeedSongCard } from '../components/feed/FeedSongCard';
import { FeedPlaylistCard } from '../components/feed/FeedPlaylistCard';
import { FeedPlayerCard } from '../components/feed/FeedPlayerCard';
import { FeedPostComposer } from '../components/feed/FeedPostComposer';
import { FeedPostCard } from '../components/feed/FeedPostCard';
import './FeedPage.css';

// Feature Modular Pieces
import { useFeedData } from '../features/feed/hooks/useFeedData';
import { PanelHeader } from '../features/feed/components/PanelHeader';
import { SectionSkeleton } from '../features/feed/components/SectionSkeleton';

export default function FeedPage() {
  const navigate = useNavigate();
  const { user, userRoles } = useAuth();
  const { loading: songsLoading, requestFetch, songMapById, songs } = useSongDatabaseContext();
  const { branches } = useBranch();
  const [morePlayersOpened, setMorePlayersOpened] = useState(false);

  const branchMap = useMemo(() => {
    const map = {};
    branches.forEach((b) => {
      map[b.id] = b.acronym || b.short_name || b.arcade_name;
    });
    return map;
  }, [branches]);

  const {
    newSongs,
    followingActivity,
    suggestedPlayers,
    followedIds,
    communityPosts,
    setCommunityPosts,
    loadingCommunityPosts,
    loadingDiscussions,
    loadingPosts,
    loadingFollowingActivity,
    loadingPlayers,
    fetchSongDiscussions,
    fetchPlaylistData,
    fetchSuggestedPlayers,
    fetchFollowingActivity,
    fetchCommunityPosts,
    createPost,
    toggleFollow,
    refreshAll,
    trendingRows,
    playlistRows
  } = useFeedData(user, userRoles, songs, songMapById);

  const isLoading = loadingDiscussions || loadingPosts;

  return (
    <Container size="xl" py="lg" className="community-feed-page animate-fade-in">
      <Stack gap="lg">
        <Group justify="flex-end" align="center" wrap="wrap" gap="xs" w="100%">
          <Button
            variant="subtle"
            leftSection={<IconRefresh size={16} />}
            onClick={refreshAll}
            loading={isLoading}
            size="xs"
          >
            Refresh
          </Button>
        </Group>

        <Grid gutter="xl" className="community-feed-layout">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="lg">
              {user && (
                <FeedPostComposer 
                  user={user} 
                  profileData={userRoles} 
                  onSubmit={createPost} 
                />
              )}

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
                  <Text c="dimmed" size="sm" ta="center" py="md">Log in to see updates from players you follow.</Text>
                ) : loadingFollowingActivity ? (
                  <SectionSkeleton rows={4} height={84} />
                ) : followingActivity.length === 0 ? (
                  <Text c="dimmed" size="sm" ta="center" py="md">No activity from followed players yet.</Text>
                ) : (
                  <Stack gap="sm">
                    {followingActivity.map((item) => (
                      <Box key={item.id}>
                        {item.type === 'feed_post' ? (
                          <FeedPostCard post={item.feed_post} currentUser={user} className="community-following-activity-row" />
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
                              navigate(targetPostId ? `/shared-playlists?post=${targetPostId}` : '/shared-playlists');
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
                  subtitle="Most recent conversations about songs"
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
                  subtitle="Recently released songs"
                  onRefresh={requestFetch}
                  loading={songsLoading}
                  rightSection={<Button variant="subtle" size="xs" rightSection={<IconChevronRight size={14} />} onClick={() => navigate('/songs')}>View all</Button>}
                />
                {songsLoading ? (
                  <SectionSkeleton rows={1} height={180} />
                ) : newSongs.length === 0 ? (
                  <Text c="dimmed" size="sm" ta="center" py="md">No songs found</Text>
                ) : (
                  <ScrollArea type="never">
                    <Group gap="sm" wrap="nowrap" className="community-release-row">
                      {newSongs.slice(0, 12).map((song) => (
                        <Paper key={song.cardId || song.songId || song.id} p="xs" radius="lg" withBorder className="community-release-card" onClick={() => navigate(`/songs/${song.cardId || song.songId}`)}>
                          <Box className="community-release-image-wrap">
                            {song.imageUrl ? <img src={song.imageUrl} alt={song.title} className="community-release-image" /> : (
                              <Box className="community-release-image community-release-placeholder"><Text fw={700}>{(song.title || '?').charAt(0)}</Text></Box>
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
                  rightSection={<Button variant="subtle" size="xs" rightSection={<IconChevronRight size={14} />} onClick={() => navigate('/shared-playlists')}>View feed</Button>}
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
                        onClick={() => navigate(item.post?.id ? `/shared-playlists?post=${item.post.id}` : '/shared-playlists')}
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
            <Paper p="md" radius="xl" className="community-sidebar" style={{ position: 'sticky', top: '1rem' }}>
              <PanelHeader
                title="Suggested Players"
                subtitle="People you may want to follow"
                onRefresh={fetchSuggestedPlayers}
                loading={loadingPlayers}
                className="community-sidebar-header"
              />
              {!user ? (
                <Paper p="md" radius="md" withBorder className="community-sidebar-empty">
                  <Text size="sm" c="dimmed" ta="center">Log in and set your branch to see player suggestions.</Text>
                </Paper>
              ) : loadingPlayers ? (
                <SectionSkeleton rows={5} height={72} />
              ) : suggestedPlayers.length === 0 ? (
                <Paper p="md" radius="md" withBorder className="community-sidebar-empty">
                  <Text size="sm" c="dimmed" ta="center">Set your home or preferred branches in App Settings to see suggestions.</Text>
                </Paper>
              ) : (
                <Stack gap="xs">
                  {suggestedPlayers.slice(0, 8).map((player) => (
                    <FeedPlayerCard
                      key={player.id} player={player} isFollowing={followedIds.has(player.id)}
                      onFollow={() => toggleFollow(player.id)}
                      onClick={() => player.slug && navigate(`/p/${player.slug}`)}
                      branchMap={branchMap} className="community-player-row"
                    />
                  ))}
                  {suggestedPlayers.length > 8 && (
                    <Button variant="light" color="gray" size="xs" fullWidth onClick={() => setMorePlayersOpened(true)} mt="xs">
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
        title={<Group gap="xs"><IconUsers size={20} style={{ color: 'var(--theme-primary)' }} /><Text fw={700}>More Suggested Players</Text></Group>}
        size="md" radius="md"
      >
        <Stack gap="xs" py="xs">
          {suggestedPlayers.map((player) => (
            <FeedPlayerCard
              key={`modal-${player.id}`} player={player} isFollowing={followedIds.has(player.id)}
              onFollow={() => toggleFollow(player.id)}
              onClick={() => { setMorePlayersOpened(false); if (player.slug) navigate(`/p/${player.slug}`); }}
              branchMap={branchMap}
            />
          ))}
        </Stack>
      </Modal>
    </Container>
  );
}
