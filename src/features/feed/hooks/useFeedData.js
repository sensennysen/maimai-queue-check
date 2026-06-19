import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { feedService, followService } from '../../../services/supabase';

const SECTION_LIMIT = 10;
const FEED_PAGE_SIZE = 12;
const FOLLOWED_PRIORITY_SCORE = 2 * 60 * 60 * 1000;

function getPostPriorityScore(post, followedAuthorIds) {
  const createdAt = new Date(post.created_at || 0).getTime();
  const followBoost = followedAuthorIds.has(post.user_id) ? FOLLOWED_PRIORITY_SCORE : 0;
  return createdAt + followBoost;
}

/**
 * Hook to manage feed data, including songs, playlists, posts, activity, and suggestions.
 */
export function useFeedData(user, userRoles, songs, songMapById) {
  const [newSongs, setNewSongs] = useState([]);
  const [songDiscussions, setSongDiscussions] = useState([]);
  const [playlistDiscussions, setPlaylistDiscussions] = useState([]);
  const [newPosts, setNewPosts] = useState([]);
  const [suggestedPlayers, setSuggestedPlayers] = useState([]);
  const [followedIds, setFollowedIds] = useState(new Set());
  const [followedAuthorIds, setFollowedAuthorIds] = useState(new Set());
  const [communityPosts, setCommunityPosts] = useState([]);
  const [feedOffset, setFeedOffset] = useState(0);
  const [hasMoreCommunityPosts, setHasMoreCommunityPosts] = useState(true);
  const [loadingCommunityPosts, setLoadingCommunityPosts] = useState(true);
  const [loadingMoreCommunityPosts, setLoadingMoreCommunityPosts] = useState(false);
  
  const [loadingDiscussions, setLoadingDiscussions] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  
  const hasLoadedPlayers = useRef(false);
  const feedOffsetRef = useRef(0);

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

  const fetchFollowedAuthors = useCallback(async () => {
    if (!user?.id) {
      setFollowedAuthorIds(new Set());
      return;
    }
    try {
      const data = await followService.getFollowing(user.id, 500);
      const ids = (data || [])
        .map((row) => row.following?.id)
        .filter(Boolean);
      setFollowedAuthorIds(new Set(ids));
    } catch (err) {
      console.error('Failed to load followed accounts:', err);
      setFollowedAuthorIds(new Set());
    }
  }, [user?.id]);

  const fetchCommunityPosts = useCallback(async (reset = true, offsetOverride = null) => {
    if (reset) setLoadingCommunityPosts(true);
    else setLoadingMoreCommunityPosts(true);

    const currentOffset = reset ? 0 : (offsetOverride ?? feedOffsetRef.current);
    try {
      const data = await feedService.getFeedPostsPage(user?.id, FEED_PAGE_SIZE, currentOffset);
      const fetchedPosts = data || [];

      setCommunityPosts((prev) => {
        const existing = reset ? [] : prev;
        const seenIds = new Set(existing.map((post) => post.id));
        const next = [...existing];
        fetchedPosts.forEach((post) => {
          if (!seenIds.has(post.id)) {
            seenIds.add(post.id);
            next.push(post);
          }
        });

        return next.sort((a, b) => {
          const scoreDiff = getPostPriorityScore(b, followedAuthorIds) - getPostPriorityScore(a, followedAuthorIds);
          if (scoreDiff !== 0) return scoreDiff;
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });
      });

      const nextOffset = currentOffset + fetchedPosts.length;
      feedOffsetRef.current = nextOffset;
      setFeedOffset(nextOffset);
      setHasMoreCommunityPosts(fetchedPosts.length >= FEED_PAGE_SIZE);
    } catch (err) {
      console.error('Failed to load community posts:', err);
      if (!reset) setHasMoreCommunityPosts(false);
    } finally {
      if (reset) setLoadingCommunityPosts(false);
      else setLoadingMoreCommunityPosts(false);
    }
  }, [followedAuthorIds, user?.id]);

  const loadMoreCommunityPosts = useCallback(() => {
    if (loadingCommunityPosts || loadingMoreCommunityPosts || !hasMoreCommunityPosts) return;
    fetchCommunityPosts(false, feedOffsetRef.current);
  }, [fetchCommunityPosts, hasMoreCommunityPosts, loadingCommunityPosts, loadingMoreCommunityPosts]);

  const createPost = useCallback(async (content, visibility, songId, playlistId, imageUrl) => {
    if (!user) return;
    try {
      const newPost = await feedService.createFeedPost(user.id, content, visibility, songId, playlistId, imageUrl);
      setCommunityPosts(prev => {
        const next = [{ ...newPost, comment_count: 0 }, ...prev];
        return next.sort((a, b) => {
          const scoreDiff = getPostPriorityScore(b, followedAuthorIds) - getPostPriorityScore(a, followedAuthorIds);
          if (scoreDiff !== 0) return scoreDiff;
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });
      });
      notifications.show({ title: 'Posted!', message: 'Your post is now live.', color: 'green', autoClose: 2000 });
      return newPost;
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to create post.', color: 'red' });
    }
  }, [followedAuthorIds, user]);

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
        setFollowedAuthorIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
      } else {
        await followService.follow(user.id, targetId);
        setFollowedAuthorIds((prev) => {
          const next = new Set(prev);
          next.add(targetId);
          return next;
        });
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
    fetchFollowedAuthors();
    fetchSuggestedPlayers();
    fetchCommunityPosts(true);
  };

  useEffect(() => {
    fetchSongDiscussions();
    fetchPlaylistData();
    fetchFollowedAuthors();
  }, [fetchSongDiscussions, fetchPlaylistData, fetchFollowedAuthors]);

  useEffect(() => {
    fetchCommunityPosts(true);
  }, [fetchCommunityPosts]);

  useEffect(() => {
    feedOffsetRef.current = feedOffset;
  }, [feedOffset]);

  useEffect(() => {
    if (user && userRoles?.user_id && !hasLoadedPlayers.current) {
      fetchSuggestedPlayers();
      hasLoadedPlayers.current = true;
    }
  }, [fetchSuggestedPlayers, user, userRoles?.user_id]);

  useEffect(() => {
    hasLoadedPlayers.current = false;
  }, [user?.id]);

  useEffect(() => {
    setCommunityPosts((prev) => {
      return [...prev].sort((a, b) => {
        const scoreDiff = getPostPriorityScore(b, followedAuthorIds) - getPostPriorityScore(a, followedAuthorIds);
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
    });
  }, [followedAuthorIds]);

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
    const rowsByPostId = new Map();

    newPosts.forEach((post) => {
      if (!post?.id) return;

      rowsByPostId.set(post.id, {
        key: `playlist-${post.id}`,
        post,
        latestComment: null,
        eventType: 'new',
        eventTimestamp: post.created_at,
      });
    });

    playlistDiscussions.forEach((item) => {
      const post = item.post;
      const postId = item.post_id || post?.id;
      if (!postId || !post) return;

      rowsByPostId.set(postId, {
        key: `playlist-${postId}`,
        post,
        latestComment: {
          content: item.content,
          author: item.user_profiles,
          createdAt: item.created_at,
        },
        eventType: 'activity',
        eventTimestamp: item.created_at,
      });
    });

    return Array.from(rowsByPostId.values()).sort((a, b) => {
      const timeDifference = new Date(b.eventTimestamp || 0).getTime()
        - new Date(a.eventTimestamp || 0).getTime();
      if (timeDifference !== 0) return timeDifference;

      if (a.eventType === b.eventType) return 0;
      return a.eventType === 'new' ? -1 : 1;
    });
  }, [playlistDiscussions, newPosts]);

  return {
    newSongs,
    songDiscussions,
    playlistDiscussions,
    newPosts,
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
    fetchSongDiscussions,
    fetchPlaylistData,
    fetchSuggestedPlayers,
    fetchCommunityPosts,
    loadMoreCommunityPosts,
    createPost,
    toggleFollow,
    refreshAll,
    trendingRows,
    playlistRows
  };
}
