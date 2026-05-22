import { useState, useEffect, useCallback, useRef } from 'react';
import { userService, branchService, followService } from '../../../services/supabase';

/**
 * Hook to manage public profile data and follow logic
 * @param {string} slug - Player slug or ID
 * @param {object} user - Current logged in user from useAuth
 */
export function usePublicProfile(slug, user) {
  const [profile, setProfile] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRestricted, setIsRestricted] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [introduction, setIntroduction] = useState(null);
  
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Capture user.id as a primitive — the full `user` object reference changes on every
  // token refresh (different access_token, expires_at, etc.), which would cause fetchData
  // to be recreated and trigger a re-fetch with a full loading state every time the tab
  // regains focus. Using only the stable user ID primitive prevents this cascade.
  const userId = user?.id ?? null;

  const fetchData = useCallback(async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      setError(null);
      setIsRestricted(false);

      const [profileData, branchesData] = await Promise.all([
        userService.getProfileBySlug(slug),
        branchService.getBranchesForResolution()
      ]);

      if (!profileData) {
        if (isMounted.current) setError('Profile not found');
      } else {
        const isOwner = userId && profileData.id === userId;
        
        if (profileData.is_restricted || (!profileData.is_public && !isOwner && !userId)) {
          if (isMounted.current) setIsRestricted(true);
        } else {
          if (isMounted.current) {
            setProfile(profileData);
            setBranches(branchesData);
            setIntroduction(profileData.introduction || null);
          }

          if (userId && profileData.id !== userId) {
            try {
              const following = await followService.isFollowing(userId, profileData.id);
              if (isMounted.current) setIsFollowing(following);
            } catch (followErr) {
              console.error('Error fetching follow status:', followErr);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching public profile:', err);
      if (isMounted.current) setError('Failed to load profile');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [slug, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleFollow = async () => {
    if (!user || !profile) return;
    const targetId = profile.id;
    const wasFollowing = isFollowing;

    setIsFollowing(!wasFollowing);
    setFollowLoading(true);

    try {
      if (wasFollowing) {
        await followService.unfollow(user.id, targetId);
      } else {
        await followService.follow(user.id, targetId);
      }
      return true;
    } catch (err) {
      console.error('Error updating follow status:', err);
      setIsFollowing(wasFollowing); // Revert
      return false;
    } finally {
      setFollowLoading(false);
    }
  };

  const clearMaimaiData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await userService.clearMaimaiData(user.id);
      await fetchData();
      return true;
    } catch (err) {
      console.error('Error clearing data:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    branches,
    loading,
    error,
    isRestricted,
    isFollowing,
    followLoading,
    introduction,
    setIntroduction,
    fetchData,
    toggleFollow,
    clearMaimaiData
  };
}
