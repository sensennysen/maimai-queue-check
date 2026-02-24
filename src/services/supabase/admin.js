import { supabase } from './client';

// Branch service functions
export const branchService = {
  // Fetch all branches from allowed_places
  async getAllBranches() {
    const { data, error } = await supabase
      .from('allowed_places')
      .select('id, arcade_name, short_name, acronym, longitude, latitude, cab_count, enabled')
      .eq('enabled', true)
      .order('arcade_name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Fetch a single branch by ID
  async getBranchById(branchId) {
    const { data, error } = await supabase
      .from('allowed_places')
      .select('id, arcade_name, short_name, acronym, longitude, latitude, cab_count, enabled')
      .eq('id', branchId)
      .eq('enabled', true)
      .single();

    if (error) throw error;
    return data;
  },

  // Fetch ALL branches for name resolution
  async getBranchesForResolution() {
    const { data, error } = await supabase
      .from('allowed_places')
      .select('id, arcade_name, short_name, acronym');

    if (error) throw error;
    return data || [];
  }
};

// Mall schedule service functions
export const scheduleService = {
  // Fetch full mall schedule
  async getSchedule(branchId) {
    let query = supabase
      .from('mall_schedule')
      .select('id, branch_id, day, time_open, time_close');
    
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }
    
    query = query.order('id', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }
};

// Admin service functions
export const adminService = {
  // Get all branches for admin
  async getAllBranchesForAdmin() {
    const { data, error } = await supabase
      .from('allowed_places')
      .select('id, arcade_name, short_name, acronym, cab_count, enabled, latitude, longitude')
      .order('arcade_name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Create a new branch in allowed_places
  async createBranch(branchData) {
    const { data, error } = await supabase
      .from('allowed_places')
      .insert([{
        arcade_name: branchData.arcade_name,
        short_name: branchData.short_name,
        acronym: branchData.acronym,
        longitude: branchData.longitude,
        latitude: branchData.latitude,
        cab_count: branchData.cab_count,
        enabled: branchData.enabled ?? true
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Create mall schedules for a branch
  async createMallSchedules(schedules) {
    const { data, error } = await supabase
      .from('mall_schedule')
      .insert(schedules)
      .select();

    if (error) throw error;
    return data;
  },

  // Update an existing branch
  async updateBranch(branchId, updates) {
    const { data, error } = await supabase
      .from('allowed_places')
      .update(updates)
      .eq('id', branchId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get branch with its schedules
  async getBranchWithSchedules(branchId) {
    const { data: branch, error: branchError } = await supabase
      .from('allowed_places')
      .select('id, arcade_name, short_name, acronym, longitude, latitude, cab_count, enabled')
      .eq('id', branchId)
      .single();

    if (branchError) throw branchError;

    const { data: schedules, error: scheduleError } = await supabase
      .from('mall_schedule')
      .select('id, branch_id, day, time_open, time_close')
      .eq('branch_id', branchId)
      .order('id', { ascending: true });

    if (scheduleError) throw scheduleError;

    return {
      branch,
      schedules: schedules || []
    };
  },

  // Delete a branch and its schedules
  async deleteBranch(branchId) {
    const { error: scheduleError } = await supabase
      .from('mall_schedule')
      .delete()
      .eq('branch_id', branchId);

    if (scheduleError) throw scheduleError;

    const { error: branchError } = await supabase
      .from('allowed_places')
      .delete()
      .eq('id', branchId);

    if (branchError) throw branchError;
  },

  // Update mall schedules for a branch
  async updateMallSchedules(branchId, schedules) {
    const { error: deleteError } = await supabase
      .from('mall_schedule')
      .delete()
      .eq('branch_id', branchId);

    if (deleteError) throw deleteError;

    const scheduleData = schedules.map(schedule => ({
      branch_id: branchId,
      day: schedule.day,
      time_open: schedule.time_open,
      time_close: schedule.time_close,
    }));

    const { data, error } = await supabase
      .from('mall_schedule')
      .insert(scheduleData)
      .select();

    if (error) throw error;
    return data;
  },

  // Get all users for admin management
  async getAllUsersForAdmin({ 
    page = 1, 
    pageSize = 10, 
    searchQuery = '', 
    sortField = 'email', 
    sortDirection = 'asc',
    adminBranch = null
  } = {}) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('user_roles')
      .select('user_id, email, queue_name, can_edit, can_edit_on, is_admin, is_super_admin, user_profiles!inner(preferred_branches, slug)', { count: 'exact' });

    if (searchQuery.trim()) {
      const queryStr = `%${searchQuery.trim()}%`;
      query = query.or(`email.ilike.${queryStr},queue_name.ilike.${queryStr}`);
    }

    if (adminBranch) {
      query = query.contains('user_profiles.preferred_branches', [adminBranch]);
    }

    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }

    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const mappedUsers = (data || []).map(u => {
      const branches = u.user_profiles?.preferred_branches || [];
      return {
        ...u,
        slug: u.user_profiles?.slug || null,
        preferred_branches: Array.isArray(branches) 
          ? branches.map(id => typeof id === 'string' ? parseInt(id, 10) : id).filter(id => !isNaN(id))
          : []
      };
    });

    return {
      users: mappedUsers,
      totalCount: count || 0
    };
  },

  // Update a user's role
  async updateUserRole(userId, updates) {
    const allowedFields = ['queue_name', 'can_edit', 'can_edit_on', 'is_admin'];
    const sanitizedUpdates = {};
    
    for (const key of allowedFields) {
      if (Object.hasOwn(updates, key)) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    const { data, error } = await supabase
      .from('user_roles')
      .update(sanitizedUpdates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update a user's profile from admin
  async updateUserProfileAdmin(userId, updates) {
    const allowedFields = ['preferred_branches'];
    const sanitizedUpdates = {};
    
    for (const key of allowedFields) {
      if (Object.hasOwn(updates, key)) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .update(sanitizedUpdates)
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  }
};

// Request service functions
export const requestService = {
  // Create a new access request
  async createRequest(userId, branchId) {
    const { data, error } = await supabase
      .from('access_requests')
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
      .from('access_requests')
      .insert(rows)
      .select();

    if (error) throw error;
    return data;
  },

  // Get all pending requests
  async getPendingRequests(adminBranchId = null) {
      let query = supabase
        .from('access_requests')
        .select(`
            id, user_id, branch_id, status, created_at,
            allowed_places!inner (
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
          .from('user_roles')
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
          .from('access_requests')
          .select('id, user_id, branch_id, status, created_at')
          .eq('user_id', userId);
      
      if (error) throw error;
      return data || [];
  },

  // Check if a user has a pending request
  async hasPendingRequest(userId, branchId) {
      if (!userId || !branchId) return false;
      
      const { count, error } = await supabase
          .from('access_requests')
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
          .from('access_requests')
          .update({ status })
          .eq('id', requestId)
          .select()
          .single();

      if (error) throw error;
      return data;
  }
};

// Queue rules service functions
export const rulesService = {
  // Fetch queue rules for a branch
  async getRules(branchId) {
    if (!branchId) return null;

    const { data, error } = await supabase
      .from('queue_rules')
      .select('rules, updated_at')
      .eq('branch_id', branchId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  // Update or create queue rules for a branch
  async updateRules(branchId, rules) {
    if (!branchId) throw new Error('branchId is required');

    const { data, error } = await supabase
      .from('queue_rules')
      .upsert({
        branch_id: branchId,
        rules: rules,
        updated_at: new Date().toISOString()
      }, { onConflict: 'branch_id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
