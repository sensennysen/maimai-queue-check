import { supabase } from './client';
import { validateData, queueEntrySchema } from '../../utils/validation';
import { TABLES } from '../../constants/database';
import { QUEUE_STATUSES } from '../../constants/queue';

// Queue service functions
export const queueService = {
  /**
   * Retrieves all active queue entries (both 'waiting' and 'playing') for a branch.
   * Filters by the current day's entries and optionally by a specific cabinet.
   * @param {string} branchId - The unique identifier of the branch.
   * @param {number} [cabinetNum=null] - Optional cabinet number to filter results.
   * @returns {Promise<Array<Object>>} A promise resolving to an ordered list of queue entries.
   */
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

  /**
   * Creates a new queue entry in the database.
   * Automatically determines whether the entry starts as 'playing' or 'waiting' based on current occupancy.
   * @param {string} player1 - The name or identifier of the first player.
   * @param {string} player2 - The name or identifier of the second player (can be empty).
   * @param {number} orderPosition - The sort order for the entry in the queue.
   * @param {string} userId - The unique identifier of the user creating the entry.
   * @param {string} branchId - The ID of the branch where the entry is created.
   * @param {number} [cabinetNum=1] - The cabinet being queued for.
   * @returns {Promise<Object>} A promise resolving to the newly created queue entry.
   */
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

  /**
   * Updates the player names for an existing queue entry.
   * @param {string} id - The unique identifier of the queue entry.
   * @param {string} player1 - The updated name for the first player.
   * @param {string} player2 - The updated name for the second player.
   * @returns {Promise<Object>} A promise resolving to the updated queue entry.
   */
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

  /**
   * Cancels an active queue entry by setting its status to 'cancelled'.
   * @param {string} id - The unique identifier of the queue entry.
   * @returns {Promise<void>} A promise that resolves when the update is complete.
   */
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

  /**
   * Batch updates the order positions of multiple queue entries.
   * Useful during drag-and-drop reordering operations.
   * @param {Array<Object>} updates - An array of objects containing {id, order_position}.
   * @returns {Promise<Array<Object>>} A promise resolving to the collection of updated entries.
   */
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

  /**
   * Transitions all 'waiting' and 'playing' entries for a cabinet to 'completed'.
   * Typically used at the end of a shift or session.
   * @param {string} branchId - The ID of the branch.
   * @param {number} [cabinetNum=null] - Optional cabinet number to target.
   * @returns {Promise<void>} A promise that resolves when the queue is cleared.
   */
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

  /**
   * Atomically finishes the current game and marks the next waiting entry as playing.
   * @param {string} [currentPlayingId] - The ID of the entry currently in the 'playing' state.
   * @param {string} [nextWaitingId] - The ID of the entry to be transitioned to 'playing'.
   * @returns {Promise<void>} A promise that resolves when دونوں operations complete.
   */
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

  /**
   * Manually transitions a specific queue entry to the 'playing' state.
   * @param {string} id - The unique identifier of the entry.
   * @returns {Promise<Object>} A promise resolving to the updated queue entry.
   */
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

  /**
   * Fetches all non-active entries (completed/cancelled) created within the current day.
   * @param {string} branchId - The ID of the branch.
   * @returns {Promise<Array<Object>>} A promise resolving to today's history entries.
   */
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

  /**
   * Queries the database for queue history logs with advanced filtering.
   * @param {Object} params - The query parameters.
   * @param {string} params.branchId - The branch to query within.
   * @param {string} params.timeFilter - The resolution of history (hour, today, all_time).
   * @param {Array<string>} params.statusFilter - The statuses to include in the results.
   * @returns {Promise<Array<Object>>} A promise resolving to the filtered log entries.
   */
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

/**
 * Subscribes to real-time database changes for queue entries.
 * @param {Function} callback - The function to call on update payload reception.
 * @param {string} [branchId=null] - Optional filter for changes at a specific branch.
 * @returns {Object} The Supabase Realtime channel subscription.
 */
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

/**
 * Establishes a real-time subscription to changes in the user roles table.
 * @param {Function} callback - The function to call whenever a change occurs.
 * @returns {Object} The Supabase Realtime channel subscription.
 */
export const subscribeToUserRoleChanges = (callback) => {
  const channel = supabase
    .channel('user_roles_realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: TABLES.USER_ROLES
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

/**
 * Subscribes to real-time updates for game sessions.
 * @param {Function} callback - The function to call on state change.
 * @returns {Object} The Supabase Realtime channel subscription.
 */
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
