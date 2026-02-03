import { createClient } from '@supabase/supabase-js';

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
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
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
  // Fetch user roles/permissions
  async getUserRoles(userId) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .limit(1);

      if (error) {
        return {
          user_id: userId,
          can_edit: false,
          is_admin: false,
          is_super_admin: false
        };
      }

      // If no rows returned, return default permissions
      if (!data || data.length === 0) {
        return {
          user_id: userId,
          can_edit: false,
          is_admin: false,
          is_super_admin: false
        };
      }

      // Ensure is_admin is always present (default false if missing)
      return { 
        ...data[0], 
        is_admin: !!data[0].is_admin,
        is_super_admin: !!data[0].is_super_admin 
      };
    } catch {
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
  async updatePreferences(userId, branchIds) {
    const { data, error } = await supabase
      .from('user_roles')
      .update({ preferred_branches: branchIds })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Queue service functions
export const queueService = {
  // Fetch all queue entries (waiting and playing)
  async getQueueEntries(branchId, cabinetNum = null) {
    if (!branchId) return [];

    let query = supabase
      .from('queue_entries')
      .select('*')
      .in('status', ['waiting', 'playing']);
    
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
    // Check if there is currently a playing session for this specific cabinet
    const { count, error: countError } = await supabase
        .from('queue_entries')
        .select('*', { count: 'exact', head: true })
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
};

// Real-time subscriptions
export const subscribeToQueueChanges = (callback) => {
  const channel = supabase
    .channel('queue_realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'queue_entries'
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

// Branch service functions
export const branchService = {
  // Fetch all branches from allowed_places
  async getAllBranches() {
    const { data, error } = await supabase
      .from('allowed_places')
      .select('*')
      .eq('enabled', true)
      .order('arcade_name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Fetch a single branch by ID
  async getBranchById(branchId) {
    const { data, error } = await supabase
      .from('allowed_places')
      .select('*')
      .eq('id', branchId)
      .eq('enabled', true)
      .single();

    if (error) throw error;
    return data;
  }
};

// Mall schedule service functions
export const scheduleService = {
  // Fetch full mall schedule
  async getSchedule(branchId) {
    let query = supabase
      .from('mall_schedule')
      .select('*');
    
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
      .select('*')
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
      .select('*')
      .eq('id', branchId)
      .single();

    if (branchError) throw branchError;

    const { data: schedules, error: scheduleError } = await supabase
      .from('mall_schedule')
      .select('*')
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

  // Get all users for admin management
  async getAllUsersForAdmin() {
    const { data, error } = await supabase
      .from('user_roles')
      .select('user_id, email, display_name, can_edit, is_admin, is_super_admin, preferred_branches')
      .order('email', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Update a user's role
  async updateUserRole(userId, updates) {
    // Only allow updating specific fields
    const allowedFields = ['display_name', 'can_edit', 'is_admin', 'preferred_branches'];
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