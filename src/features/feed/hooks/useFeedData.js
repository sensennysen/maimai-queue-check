import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { feedService, followService } from '../../../services/supabase';

const SECTION_LIMIT = 10;

/**
 * Hook to manage feed data, including songs, playlists, posts, activity, and suggestions.
 */
export function useFeedData(user, userRoles, songs, songMapById) {
  const [newSongs, setNewSongs] = useState([]);
  const [songDiscussions, setSongDiscussions] = useState([]);
  const [playlistDiscussions, setPlaylistDiscussions] = useState([]);
  const [newPosts, setNewPosts] = useState([]);
  const [followingActivity, setFollowingActivity] = useState([]);
  const [suggestedPlayers, setSuggestedPlayers] = useState([]);
  const [followedIds, setFollowedIds] = useState(new Set());
  const [communityPosts, setCommunityPosts] = useState([]);
  const [loadingCommunityPosts, setLoadingCommunityPosts] = useState(true);
  
  const [loadingDiscussions, setLoadingDiscussions] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingFollowingActivity, setLoadingFollowingActivity] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  
  const hasLoadedPlayers = useRef(false);

  // Process new songs
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
      const players = await feedService.getSuggestedPlayers(user.id, mainBranch, preferredBranches, 100);
      
      if (players?.length > 0) {
        const ids = players.map((p) => p.id);
        const followed = await followService.getBulkFollowStatus(user.id, ids);
        setFollowedIds(followed);
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

  const createPost = useCallback(async (content, visibility, songId, playlistId, imageUrl) => {
    if (!user) return;
    try {
      const newPost = await feedService.createFeedPost(user.id, content, visibility, songId, playlistId, imageUrl);
      setCommunityPosts(prev => [{ ...newPost, comment_count: 0 }, ...prev]);
      notifications.show({ title: 'Posted!', message: 'Your post is now live.', color: 'green', autoClose: 2000 });
      return newPost;
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to create post.', color: 'red' });
    }
  }, [user]);

  const toggleFollow = useCallback(async (targetId) => {
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

  const refreshAll = () => {
    fetchSongDiscussions();
    fetchPlaylistData();
    fetchFollowingActivity();
    fetchSuggestedPlayers();
    fetchCommunityPosts();
  };

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

  const playlistRows = useMemo(() => {
    return playlistDiscussions.length > 0
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
  }, [playlistDiscussions, newPosts]);

  return {
    newSongs,
    songDiscussions,
    playlistDiscussions,
    newPosts,
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
  };
}
