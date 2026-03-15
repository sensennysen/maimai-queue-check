import { supabase } from './client';
import { TABLES } from '../../constants/database';

// Request service functions
export const requestService = {
  // Create a new access request
  async createRequest(userId, branchId) {
    const { data, error } = await supabase
      .from(TABLES.ACCESS_REQUESTS)
      .insert([{
        user_id: userId,
        branch_id: branchId,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Create multiple access requests
  async createRequests(userId, branchIds) {
    if (!branchIds || branchIds.length === 0) return [];
    
    const rows = branchIds.map(branchId => ({
      user_id: userId,
      branch_id: branchId,
      status: 'pending'
    }));

    const { data, error } = await supabase
      .from(TABLES.ACCESS_REQUESTS)
      .insert(rows)
      .select();

    if (error) throw error;
    return data;
  },

  // Get all pending requests
  async getPendingRequests(adminBranchId = null) {
      let query = supabase
        .from(TABLES.ACCESS_REQUESTS)
        .select(`
            id, user_id, branch_id, status, created_at,
            ${TABLES.ALLOWED_PLACES}!inner (
                arcade_name,
                short_name,
                acronym
            )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (adminBranchId) {
          query = query.eq('branch_id', adminBranchId);
      }

      const { data: requests, error: requestError } = await query;
      if (requestError) throw requestError;
      if (!requests || requests.length === 0) return [];

      const userIds = [...new Set(requests.map(r => r.user_id))];
      const { data: users, error: userError } = await supabase
          .from(TABLES.USER_ROLES)
          .select('user_id, email, queue_name')
          .in('user_id', userIds);
      
      if (userError) {
          console.error("Error fetching user details for requests", userError);
      }

      return requests.map(req => {
          const user = users?.find(u => u.user_id === req.user_id);
          return {
              ...req,
              user_roles: user || { email: 'Unknown', display_name: 'Unknown' }
          };
      });
  },

  // Get requests made by a specific user
  async getUserRequests(userId) {
      const { data, error } = await supabase
          .from(TABLES.ACCESS_REQUESTS)
          .select('id, user_id, branch_id, status, created_at')
          .eq('user_id', userId);
      
      if (error) throw error;
      return data || [];
  },

  // Check if a user has a pending request
  async hasPendingRequest(userId, branchId) {
      if (!userId || !branchId) return false;
      
      const { count, error } = await supabase
          .from(TABLES.ACCESS_REQUESTS)
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('branch_id', branchId)
          .eq('status', 'pending')
          .limit(1);
      
      if (error) throw error;
      return count > 0;
  },

  // Update request status
  async updateRequestStatus(requestId, status) {
      const { data, error } = await supabase
          .from(TABLES.ACCESS_REQUESTS)
          .update({ status })
          .eq('id', requestId)
          .select()
          .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Permission denied or request record not found.");
      return data;
  }
};
