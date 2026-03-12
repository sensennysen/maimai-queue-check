import { supabase } from './client';
import { validateData, queueEntrySchema } from '../../utils/validation';
import { TABLES } from '../../constants/database';
import { QUEUE_STATUSES } from '../../constants/queue';

// Queue service functions
export const queueService = {
  // Fetch all queue entries (waiting and playing)
  async getQueueEntries(branchId, cabinetNum = null) {
    if (!branchId) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = supabase
      .from(TABLES.QUEUE_ENTRIES)
      .select('id, player1, player2, order_position, status, branch_id, cabinet_num, created_at, started_at, created_by_profile:created_by(display_photo_url)')
      .in('status', [QUEUE_STATUSES.WAITING, QUEUE_STATUSES.PLAYING])
      .gte('created_at', today.toISOString());
    
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }
    
    if (cabinetNum !== null) {
      query = query.eq('cabinet_num', cabinetNum);
    }
    
    query = query.order('order_position', { ascending: true });

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },

  // Add a new queue entry
  async addQueueEntry(player1, player2, orderPosition, userId, branchId, cabinetNum = 1) {
    const validation = validateData(queueEntrySchema, { 
      player1, 
      player2, 
      order_position: orderPosition, 
      branch_id: branchId, 
      cabinet_num: cabinetNum 
    });
    
    if (!validation.success) throw new Error(validation.error);

    const { count, error: countError } = await supabase
        .from(TABLES.QUEUE_ENTRIES)
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .eq('cabinet_num', cabinetNum)
        .eq('status', QUEUE_STATUSES.PLAYING);
    
    if (countError) throw countError;

    const initialStatus = count === 0 ? QUEUE_STATUSES.PLAYING : QUEUE_STATUSES.WAITING;

    const { data, error } = await supabase
      .from(TABLES.QUEUE_ENTRIES)
      .insert([
        {
          player1: player1.trim(),
          player2: player2.trim(),
          order_position: orderPosition,
          status: initialStatus,
          created_by: userId || null,
          branch_id: branchId,
          cabinet_num: cabinetNum,
          started_at: initialStatus === QUEUE_STATUSES.PLAYING ? new Date().toISOString() : null
        }
      ])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update an existing queue entry
  async updateQueueEntry(id, player1, player2) {
    const validation = validateData(queueEntrySchema.pick({ player1: true, player2: true }), { 
      player1, 
      player2 
    });
    
    if (!validation.success) throw new Error(validation.error);

    const { data, error } = await supabase
      .from(TABLES.QUEUE_ENTRIES)
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
      .from(TABLES.QUEUE_ENTRIES)
      .update({ 
        status: QUEUE_STATUSES.CANCELLED,
        ended_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
  },

  // Update order positions for reordering
  async updateOrderPositions(updates) {
    const results = [];
    for (const update of updates) {
      const { data, error } = await supabase
        .from(TABLES.QUEUE_ENTRIES)
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
      .from(TABLES.QUEUE_ENTRIES)
      .update({ 
        status: QUEUE_STATUSES.COMPLETED,
        ended_at: new Date().toISOString()
      })
      .eq('branch_id', branchId)
      .in('status', [QUEUE_STATUSES.WAITING, QUEUE_STATUSES.PLAYING]);
    
    if (cabinetNum !== null) {
      query = query.eq('cabinet_num', cabinetNum);
    }

    const { error } = await query;
    if (error) throw error;
  },

  // Move to next game
  async finishGame(currentPlayingId, nextWaitingId) {
    if (currentPlayingId) {
        const { error: completeError } = await supabase
            .from(TABLES.QUEUE_ENTRIES)
            .update({ 
                status: QUEUE_STATUSES.COMPLETED,
                ended_at: new Date().toISOString()
            })
            .eq('id', currentPlayingId);
        
        if (completeError) throw completeError;
    }

    if (nextWaitingId) {
        const { error: startError } = await supabase
            .from(TABLES.QUEUE_ENTRIES)
            .update({ 
                status: QUEUE_STATUSES.PLAYING,
                started_at: new Date().toISOString()
            })
            .eq('id', nextWaitingId);
        
        if (startError) throw startError;
    }
  },

  // Legacy/Helper to manually mark as playing
  async markAsPlaying(id) {
    const { data, error } = await supabase
      .from(TABLES.QUEUE_ENTRIES)
      .update({ 
          status: QUEUE_STATUSES.PLAYING,
          started_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Fetch completed and cancelled queue entries for today
  async getCompletedEntriesForToday(branchId) {
    if (!branchId) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from(TABLES.QUEUE_ENTRIES)
      .select('player1, player2')
      .in('status', [QUEUE_STATUSES.COMPLETED, QUEUE_STATUSES.CANCELLED])
      .eq('branch_id', branchId)
      .gte('created_at', today.toISOString())
      .order('ended_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Fetch queue logs based on time range and status filters
  async getQueueLogs({ branchId, timeFilter, statusFilter }) {
    if (!branchId) return [];

    let query = supabase
      .from(TABLES.QUEUE_ENTRIES)
      .select('id, player1, player2, status, cabinet_num, created_at, started_at, ended_at, created_by_profile:created_by(display_photo_url)')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });

    // Apply time filter
    if (timeFilter !== 'all_time') {
      const gteDate = new Date();
      if (timeFilter === 'past_hour') {
        gteDate.setHours(gteDate.getHours() - 1);
      } else if (timeFilter === 'past_3_hours') {
        gteDate.setHours(gteDate.getHours() - 3);
      } else if (timeFilter === 'today') {
        gteDate.setHours(0, 0, 0, 0);
      }
      query = query.gte('created_at', gteDate.toISOString());
    }

    // Apply status filter (if provided and not empty array, else we don't filter to allow all)
    // Actually, if statusFilter is provided, we use it. If it's empty, we might return nothing or everything. Let's assume it always has values if filtering by status.
    if (Array.isArray(statusFilter) && statusFilter.length > 0) {
      query = query.in('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
};

// Real-time subscriptions
export const subscribeToQueueChanges = (callback, branchId = null) => {
  const config = {
    event: '*',
    schema: 'public',
    table: TABLES.QUEUE_ENTRIES
  };

  if (branchId) {
    config.filter = `branch_id=eq.${branchId}`;
  }

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
        table: TABLES.GAME_SESSIONS
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
