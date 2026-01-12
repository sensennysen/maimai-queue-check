import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// You'll need to replace these with your actual Supabase project URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
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
        console.error(`Error fetching roles for user ${userId}:`, error.message, error.code);
        return {
          user_id: userId,
          can_edit: false
        };
      }
      
      // If no rows returned, return default permissions
      if (!data || data.length === 0) {
        return {
          user_id: userId,
          can_edit: false
        };
      }
      
      return data[0];
    } catch (err) {
      console.error(`Exception fetching roles for user ${userId}:`, err);
      return {
        user_id: userId,
        can_edit: false
      };
    }
  }
};

// Queue service functions
export const queueService = {
  // Fetch all queue entries ordered by position
  async getQueueEntries() {
    const { data, error } = await supabase
      .from('queue_entries')
      .select('*')
      .eq('status', 'waiting')
      .order('order_position', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Add a new queue entry
  async addQueueEntry(player1, player2, orderPosition) {
    const { data, error } = await supabase
      .from('queue_entries')
      .insert([
        {
          player1: player1.trim(),
          player2: player2.trim(),
          order_position: orderPosition,
          status: 'waiting'
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

  // Remove a queue entry
  async removeQueueEntry(id) {
    const { error } = await supabase
      .from('queue_entries')
      .delete()
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

  // Clear all waiting queue entries
  async clearQueue() {
    const { error } = await supabase
      .from('queue_entries')
      .delete()
      .eq('status', 'waiting');
    
    if (error) throw error;
  },

  // Move entry to playing status
  async markAsPlaying(id) {
    const { data, error } = await supabase
      .from('queue_entries')
      .update({ status: 'playing' })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Complete a playing session
  async markAsCompleted(id) {
    const { data, error } = await supabase
      .from('queue_entries')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Game session service functions
export const sessionService = {
  // Get current active session
  async getCurrentSession() {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data;
  },

  // Start a new game session
  async startSession(player1, player2) {
    // End any existing active sessions first
    await this.endCurrentSession();
    
    const { data, error } = await supabase
      .from('game_sessions')
      .insert([
        {
          player1: player1.trim(),
          player2: player2.trim(),
          status: 'active'
        }
      ])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // End the current active session
  async endCurrentSession() {
    const { error } = await supabase
      .from('game_sessions')
      .update({ 
        status: 'completed',
        ended_at: new Date().toISOString()
      })
      .eq('status', 'active');
    
    if (error) throw error;
  }
};

// Real-time subscriptions
export const subscribeToQueueChanges = (callback) => {
  const channel = supabase
    .channel('queue_realtime')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'queue_entries'
      },
      (payload) => {
        console.log('Real-time queue change:', payload);
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log('Queue subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Queue real-time subscription active');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Queue subscription error');
      }
    });

  return channel;
};

export const subscribeToSessionChanges = (callback) => {
  const channel = supabase
    .channel('session_realtime')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'game_sessions'
      },
      (payload) => {
        console.log('Real-time session change:', payload);
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log('Session subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Session real-time subscription active');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Session subscription error');
      }
    });

  return channel;
};

// Mall schedule service functions
export const scheduleService = {
  // Fetch full mall schedule
  async getSchedule() {
    const { data, error } = await supabase
      .from('mall_schedule')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};