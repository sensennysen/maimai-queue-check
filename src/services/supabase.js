import { createClient } from '@supabase/supabase-js';
import { validateData, userProfileSchema, queueEntrySchema, contactReportSchema } from '../utils/validation';

// Supabase configuration
// You'll need to replace these with your actual Supabase project URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with explicit session persistence configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    storageKey: 'smf-queue-auth',
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Authentication service functions
export const authService = {
  // Sign in with OAuth provider
  async signInWithProvider(provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin
      }
    });
    
    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  getCurrentUser() {
    return supabase.auth.getUser();
  },

  // Subscribe to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// User roles service functions
export const rolesService = {
  // Fetch user roles/permissions and profile data
  async getUserRoles(userId) {
    try {
      // Fetch role and profile data in parallel
      const [roleResult, profileResult] = await Promise.all([
        supabase
          .from('user_roles')
          .select('user_id, can_edit, can_edit_on, is_admin, is_super_admin, admin_branch, display_name, preferred_branches')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle(),
        
        supabase
          .from('user_profiles')
          .select('id, display_name, preferred_branches, main_branch, maimai_dx_name, maimai_rating, maimai_best_scores, maimai_scores_updated_at, display_photo_url')
          .eq('id', userId)
          .maybeSingle()
      ]);

      const { data: roleData } = roleResult;
      const { data: profileData } = profileResult;

      // If both missing, return safe defaults
      if (!roleData && !profileData) {
        return {
          user_id: userId,
          can_edit: false,
          is_admin: false,
          is_super_admin: false,
          preferred_branches: [],
          display_name: null
        };
      }

      // Merge data, preferring profileData for profile fields
      // Default to roleData if profileData missing (backward compat)
      const mergedData = {
        user_id: userId,
        // Permissions from roleData
        can_edit: !!roleData?.can_edit,
        can_edit_on: Array.isArray(roleData?.can_edit_on) ? roleData.can_edit_on : [],
        is_admin: !!roleData?.is_admin,
        is_super_admin: !!roleData?.is_super_admin,
        admin_branch: roleData?.admin_branch || null,
        
        // Profile fields - prefer profileData, fallback to roleData
        display_name: profileData?.display_name || roleData?.display_name,
        
        // UNION of preferred_branches from both tables to ensure no data is lost
        preferred_branches: (() => {
          const profileBranches = Array.isArray(profileData?.preferred_branches) 
            ? profileData.preferred_branches.map(id => typeof id === 'string' ? parseInt(id, 10) : id)
            : [];
          const roleBranches = Array.isArray(roleData?.preferred_branches) 
            ? roleData.preferred_branches.map(id => typeof id === 'string' ? parseInt(id, 10) : id)
            : [];
          
          // Return unique union of both arrays
          return [...new Set([...profileBranches, ...roleBranches])].filter(id => !isNaN(id));
        })(),
          
        // Maimai fields (only in profileData)
        maimai_dx_name: profileData?.maimai_dx_name || null,
        maimai_rating: profileData?.maimai_rating || null,
        maimai_best_scores: profileData?.maimai_best_scores || null,

        maimai_scores_updated_at: profileData?.maimai_scores_updated_at || null,
        
        // Display Photo
        display_photo_url: profileData?.display_photo_url || null,

        // Main Branch
        main_branch: profileData?.main_branch ?? null
      };
      
      return mergedData;

    } catch (err) {
      console.error('Error fetching user roles/profile:', err);
      return {
        user_id: userId,
        can_edit: false,
        is_admin: false,
        is_super_admin: false
      };
    }
  }
};

// User service functions
export const userService = {
  // Update user preferences
  async updatePreferences(userId, { branchIds, displayName, mainBranch }) {
    const updateData = {};
    if (branchIds !== undefined) updateData.preferred_branches = branchIds;
    if (displayName !== undefined) updateData.display_name = displayName;
    if (mainBranch !== undefined) updateData.main_branch = mainBranch;
    // displayPhotoUrl is not usually updated here but could be if we wanted to

    
    // VALIDATION
    if (displayName) {
        const validation = validateData(userProfileSchema.pick({ displayName: true }), { displayName });
        if (!validation.success) throw new Error(validation.error);
    }
    
    // Update user_profiles (Primary)
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({ 
        id: userId,
        ...updateData, 
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) throw profileError;

    // Sync to user_roles (Legacy/Compatibility)
    // We do this to ensure existing code relying on user_roles for display names still works
    // until fully migrated. Non-blocking/fire-and-forget style or sequential.
    try {
      await supabase
        .from('user_roles')
        .update(updateData)
        .eq('user_id', userId);
    } catch (e) {
      console.warn('Failed to sync preferences to user_roles legacy table', e);
    }

    return profileData;
  },
  
  // Update maimai profile specifically

  async updateMaimaiProfile(userId, { maimaiDxName, displayPhotoUrl }) {
    const updates = {
      id: userId,
      updated_at: new Date().toISOString()
    };

    if (maimaiDxName !== undefined) updates.maimai_dx_name = maimaiDxName;
    if (displayPhotoUrl !== undefined) updates.display_photo_url = displayPhotoUrl;

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(updates)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  // Update maimai best scores (Calculated Top 50)
  async updateMaimaiBestScores(userId, bestScores) {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        maimai_best_scores: bestScores,
        maimai_scores_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get users who have a specific branch in their preferred_branches
  // Updated to check user_profiles (or fallback to roles)
  async getUsersPrefersBranch(branchId) {
    if (!branchId) return [];

    // Try profiles first
    const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('display_name')
        .contains('preferred_branches', [branchId]);
    
    if (!error && profiles && profiles.length > 0) return profiles;
    
    // Fallback to roles if empty/error
    const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('display_name')
        .contains('preferred_branches', [branchId]);

    if (roleError) throw roleError;
    return roles || [];
  }
};

// Queue service functions
export const queueService = {
  // Fetch all queue entries (waiting and playing)
  async getQueueEntries(branchId, cabinetNum = null) {
    if (!branchId) return [];

    // Filter for entries created today (local time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = supabase
      .from('queue_entries')
      .select('id, player1, player2, order_position, status, created_by, branch_id, cabinet_num, started_at, ended_at, created_at, created_by_profile:created_by(display_photo_url)')
      .in('status', ['waiting', 'playing'])
      .gte('created_at', today.toISOString());
    
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }
    
    // Filter by cabinet number if provided
    if (cabinetNum !== null) {
      query = query.eq('cabinet_num', cabinetNum);
    }
    
    // Order by created_at or order_position to ensure list stability
    // 'playing' should ideally be 0 or handled by status check, but let's stick to order_position
    query = query.order('order_position', { ascending: true });

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },

  // Add a new queue entry
  async addQueueEntry(player1, player2, orderPosition, userId, branchId, cabinetNum = 1) {
    // VALIDATION
    const validation = validateData(queueEntrySchema, { 
      player1, 
      player2, 
      orderPosition, 
      branchId, 
      cabinetNum 
    });
    
    if (!validation.success) throw new Error(validation.error);

    // Check if there is currently a playing session for this specific cabinet
    // Check if there is currently a playing session for this specific cabinet
    const { count, error: countError } = await supabase
        .from('queue_entries')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .eq('cabinet_num', cabinetNum)
        .eq('status', 'playing');
    
    if (countError) throw countError;

    const initialStatus = count === 0 ? 'playing' : 'waiting';
    // If auto-playing, maybe we set order_position to 0 or something? 
    // For now keeping orderPosition logic from caller, but 'playing' status takes precedence in UI.

    const { data, error } = await supabase
      .from('queue_entries')
      .insert([
        {
          player1: player1.trim(),
          player2: player2.trim(),
          order_position: orderPosition,
          status: initialStatus,
          created_by: userId || null,
          branch_id: branchId,
          cabinet_num: cabinetNum,
          started_at: initialStatus === 'playing' ? new Date().toISOString() : null
        }
      ])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update an existing queue entry
  async updateQueueEntry(id, player1, player2) {
    // VALIDATION - partial schema check for names only
    const validation = validateData(queueEntrySchema.pick({ player1: true, player2: true }), { 
      player1, 
      player2 
    });
    
    if (!validation.success) throw new Error(validation.error);

    const { data, error } = await supabase
      .from('queue_entries')
      .update({
        player1: player1.trim(),
        player2: player2.trim()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Remove a queue entry (cancel it)
  async removeQueueEntry(id) {
    const { error } = await supabase
      .from('queue_entries')
      .update({ 
        status: 'cancelled',
        ended_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
  },

  // Update order positions for reordering
  async updateOrderPositions(updates) {
    // Use individual updates instead of upsert to avoid nulling required fields
    const results = [];
    for (const update of updates) {
      const { data, error } = await supabase
        .from('queue_entries')
        .update({ order_position: update.order_position })
        .eq('id', update.id)
        .select()
        .single();
      
      if (error) throw error;
      results.push(data);
    }
    return results;
  },

  // Clear all queue entries (waiting and playing) for a specific cabinet
  async clearQueue(branchId, cabinetNum = null) {
    if (!branchId) {
      throw new Error('branchId is required to clear the queue');
    }

    let query = supabase
      .from('queue_entries')
      .update({ 
        status: 'completed',
        ended_at: new Date().toISOString()
      })
      .eq('branch_id', branchId)
      .in('status', ['waiting', 'playing']);
    
    // If cabinet number is provided, only clear that cabinet
    if (cabinetNum !== null) {
      query = query.eq('cabinet_num', cabinetNum);
    }

    const { error } = await query;
    if (error) throw error;
  },

  // Move to next game
  async finishGame(currentPlayingId, nextWaitingId) {
    // 1. Mark current as completed
    if (currentPlayingId) {
        const { error: completeError } = await supabase
            .from('queue_entries')
            .update({ 
                status: 'completed',
                ended_at: new Date().toISOString()
            })
            .eq('id', currentPlayingId);
        
        if (completeError) throw completeError;
    }

    // 2. Mark next as playing
    if (nextWaitingId) {
        const { error: startError } = await supabase
            .from('queue_entries')
            .update({ 
                status: 'playing',
                started_at: new Date().toISOString()
                 // potentially update order_position to 0 or 1?
            })
            .eq('id', nextWaitingId);
        
        if (startError) throw startError;
    }
  },

  // Legacy/Helper to manually mark as playing (if needed)
  async markAsPlaying(id) {
    const { data, error } = await supabase
      .from('queue_entries')
      .update({ 
          status: 'playing',
          started_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Fetch completed and cancelled queue entries for today (for autocomplete suggestions)
  async getCompletedEntriesForToday(branchId) {
    if (!branchId) return [];

    // Filter for entries completed or cancelled today (local time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('queue_entries')
      .select('*')
      .in('status', ['completed', 'cancelled'])
      .eq('branch_id', branchId)
      .gte('created_at', today.toISOString())
      .order('ended_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

// Real-time subscriptions
export const subscribeToQueueChanges = (callback, branchId = null) => {
  const config = {
    event: '*',
    schema: 'public',
    table: 'queue_entries'
  };

  if (branchId) {
    config.filter = `branch_id=eq.${branchId}`;
  }

  // Unique channel name to prevent collision/cleanup issues
  const channelId = `queue_realtime:${branchId || 'all'}:${Date.now()}:${Math.random().toString(36).substring(7)}`;

  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      config,
      (payload) => {
        if (callback && typeof callback === 'function') {
          callback(payload);
        }
      }
    )
    .subscribe();

  return channel;
};

export const subscribeToSessionChanges = (callback) => {
  const channel = supabase
    .channel('session_realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_sessions'
      },
      (payload) => {
        if (callback && typeof callback === 'function') {
          callback(payload);
        }
      }
    )
    .subscribe();

  return channel;
};

export const subscribeToUserRoleChanges = (callback) => {
  const channel = supabase
    .channel('user_roles_realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_roles'
      },
      (payload) => {
        if (callback && typeof callback === 'function') {
          callback(payload);
        }
      }
    )
    .subscribe();

  return channel;
};

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

  // Fetch ALL branches for name resolution (ignores enabled filter)
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
  // Get all branches for admin (including disabled)
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

  // Create mall schedules for a branch (bulk insert)
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
    // First delete associated schedules
    const { error: scheduleError } = await supabase
      .from('mall_schedule')
      .delete()
      .eq('branch_id', branchId);

    if (scheduleError) throw scheduleError;

    // Then delete the branch
    const { error: branchError } = await supabase
      .from('allowed_places')
      .delete()
      .eq('id', branchId);

    if (branchError) throw branchError;
  },

  // Update mall schedules for a branch
  async updateMallSchedules(branchId, schedules) {
    // Delete existing schedules
    const { error: deleteError } = await supabase
      .from('mall_schedule')
      .delete()
      .eq('branch_id', branchId);

    if (deleteError) throw deleteError;

    // Insert new schedules
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

  // Get all users for admin management with pagination, search, and sort
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
      .select('user_id, email, display_name, can_edit, can_edit_on, is_admin, is_super_admin, preferred_branches', { count: 'exact' });

    // Server-side filtering (search)
    if (searchQuery.trim()) {
      const queryStr = `%${searchQuery.trim()}%`;
      query = query.or(`email.ilike.${queryStr},display_name.ilike.${queryStr}`);
    }

    // Branch filtering for regular admins
    if (adminBranch) {
      query = query.contains('preferred_branches', [adminBranch]);
    }

    // Server-side sorting
    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }

    // Pagination
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;
    return {
      users: data || [],
      totalCount: count || 0
    };
  },

  // Update a user's role
  async updateUserRole(userId, updates) {
    // Only allow updating specific fields
    const allowedFields = ['display_name', 'can_edit', 'can_edit_on', 'is_admin', 'preferred_branches'];
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

  // Create multiple access requests (bulk)
  async createRequests(userId, branchIds) {
    if (!branchIds || branchIds.length === 0) return [];
    
    // Create rows for each branch
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

  // Get all pending requests for a specific branch (for admin)
  async getPendingRequests(adminBranchId = null) {
      // 1. Fetch requests with branch details
      let query = supabase
        .from('access_requests')
        .select(`
            id, user_id, branch_id, status, created_at,
            allowed_places (
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

      // 2. Fetch user details manually (to avoid complex FK setups)
      const userIds = [...new Set(requests.map(r => r.user_id))];
      const { data: users, error: userError } = await supabase
          .from('user_roles')
          .select('user_id, email, display_name')
          .in('user_id', userIds);
      
      if (userError) {
          console.error("Error fetching user details for requests", userError);
          // Return requests without user details if user fetch fails, rather than failing all
          // or we could throw. Let's try to return partial data.
      }

      // 3. Merge data
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

  // Update request status (approve/reject)
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

// Notification service functions
export const notificationService = {
  // Get all notifications for a user, including read status
  // Only fetches notifications from the last 7 days to reduce payload
  async getAllNotifications(userId) {
    // 1. Fetch notifications from the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, message, data, created_at, read_at')
      .gte('created_at', oneWeekAgo.toISOString())
      .order('created_at', { ascending: false });

    if (notifError) throw notifError;

    if (!notifications || notifications.length === 0) return [];

    // 2. Fetch read receipts for this user
    let readIds = new Set();
    if (userId) {
        const { data: reads, error: readError } = await supabase
            .from('user_notification_reads')
            .select('notification_id')
            .eq('user_id', userId);
        
        if (readError) throw readError;
        
        if (reads) {
            reads.forEach(r => readIds.add(r.notification_id));
        }
    }

    // 3. Merge info
    return notifications.map(n => ({
        ...n,
        read: readIds.has(n.id)
    }));
  },

  // Mark a notification as read
  async markAsRead(userId, notificationId) {
      if (!userId) return;
      
      const { error } = await supabase
        .from('user_notification_reads')
        .upsert(
            { user_id: userId, notification_id: notificationId },
            { onConflict: 'user_id, notification_id', ignoreDuplicates: true }
        );

      if (error) throw error;
  }
};

// Contact service functions
export const contactService = {
  // Submit a new report
  async submitReport({ report_type, description, email, user_id, file }) {
    // VALIDATION
    // We construct a temporary object to validate against our schema
    // The file object from browser context has size/type properties
    const validationPayload = { report_type, description, email };
    
    // For file validation we need to be careful as 'file' might be a File object
    // Zod schema expects specific checks.
    
    // First validate text fields
    const textValidation = validateData(contactReportSchema.omit({ file: true }), validationPayload);
    if (!textValidation.success) throw new Error(textValidation.error);

    // Now validate file if present
    if (file) {
        const fileValidation = validateData(contactReportSchema.pick({ file: true }), { file });
        if (!fileValidation.success) throw new Error(fileValidation.error);
    }

    let attachment_path = null;
    let attachment_name = null;

    // Upload file if present
    if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('contact_uploads')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type
            });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
        
        attachment_path = filePath;
        attachment_name = file.name;
    }

    const { data, error } = await supabase
      .from('contact_reports')
      .insert([{
        report_type,
        description,
        email,
        user_id,
        status: 'open',
        attachment_path,
        attachment_name
      }]);

    if (error) throw error;
    return data;
  },

  // Get all reports (for admin)
  async getReports() {
    // 1. Fetch reports
    const { data: reports, error } = await supabase
      .from('contact_reports')
      .select('id, report_type, description, email, user_id, status, attachment_path, attachment_name, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!reports || reports.length === 0) return [];

    // 2. Fetch user roles for the user_ids in reports
    const userIds = [...new Set(reports.map(r => r.user_id).filter(Boolean))];
    let userMap = {};

    if (userIds.length > 0) {
        const { data: users, error: userError } = await supabase
            .from('user_roles')
            .select('user_id, display_name, email')
            .in('user_id', userIds);
        
        if (!userError && users) {
             // Create a map for faster lookup
            users.forEach(u => { userMap[u.user_id] = u; });
        }
    }

    // 3. Merge user details
    return reports.map(report => {
       const user = report.user_id ? userMap[report.user_id] : null;
       return {
           ...report,
           user_display: user ? user.display_name : 'Guest',
           user_email: user ? user.email : report.email
       };
    });
  },
  
  // Update report status
  async updateReportStatus(id, status) {
    const { data, error } = await supabase
        .from('contact_reports')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
    
    if (error) throw error;
    return data;
  },

  // Get signed URL for attachment
  async getAttachmentUrl(path) {
      if (!path) return null;
      const { data, error } = await supabase.storage
          .from('contact_uploads')
          .createSignedUrl(path, 60 * 60); // 1 hour validity
      
      if (error) throw error;
      return data.signedUrl;
  },

  // Delete report and its attachment
  async deleteReport(id, attachmentPath) {
      // 1. Delete attachment if exists
      if (attachmentPath) {
          const { error: storageError } = await supabase.storage
              .from('contact_uploads')
              .remove([attachmentPath]);
          
          if (storageError) {
              console.error('Failed to delete attachment:', storageError);
              // We continue to delete the report even if storage delete fails
          }
      }

      // 2. Delete report record
      const { error } = await supabase
          .from('contact_reports')
          .delete()
          .eq('id', id);

      if (error) throw error;
  }
};
