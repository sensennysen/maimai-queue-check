import { supabase } from './client';

export const followService = {
  // Follow a user
  async follow(followerId, followingId) {
    const { data, error } = await supabase
      .from('user_follows')
      .insert({ follower_id: followerId, following_id: followingId })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return null; // Already following
      throw error;
    }
    return data;
  },

  // Unfollow a user
  async unfollow(followerId, followingId) {
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;
    return true;
  },

  // Get all followers of a user
  async getFollowers(userId, limit = 50) {
    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        id,
        created_at,
        follower:user_profiles!follower_id(id, display_name, slug, display_photo_url, dx_display_photo_url, main_branch, preferred_branches)
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Get all users that a user follows
  async getFollowing(userId, limit = 50) {
    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        id,
        created_at,
        following:user_profiles!following_id(id, display_name, slug, display_photo_url, dx_display_photo_url, main_branch, preferred_branches)
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Check if a user is following another
  async isFollowing(followerId, followingId) {
    if (!followerId || !followingId) return false;

    const { data, error } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  // Check follow status for multiple users at once (efficient batch)
  async getBulkFollowStatus(followerId, followingIds) {
    if (!followerId || !followingIds?.length) return new Set();

    const { data, error } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', followerId)
      .in('following_id', followingIds);

    if (error) throw error;
    return new Set((data || []).map(r => r.following_id));
  },

  // Get follower/following counts for a user
  async getCounts(userId) {
    const [followersResult, followingResult] = await Promise.all([
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', userId),
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', userId),
    ]);

    return {
      followers: followersResult.count || 0,
      following: followingResult.count || 0,
    };
  }
};
