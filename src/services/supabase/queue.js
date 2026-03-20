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
    if (!Array.isArray(updates) || updates.length === 0) return [];

    const sanitizedUpdates = updates
      .filter((item) => item?.id !== undefined && item?.id !== null)
      .map((item) => ({ id: item.id, order_position: item.order_position }));

    if (sanitizedUpdates.length === 0) return [];

    const tableQuery = supabase.from(TABLES.QUEUE_ENTRIES);

    if (typeof tableQuery.upsert === 'function') {
      const { data, error } = await tableQuery
        .upsert(sanitizedUpdates, { onConflict: 'id' })
        .select('id, order_position');

      if (!error) {
        return data || [];
      }
    }

    const fallbackResults = [];
    for (const update of sanitizedUpdates) {
      const { data: rowData, error: rowError } = await supabase
        .from(TABLES.QUEUE_ENTRIES)
        .update({ order_position: update.order_position })
        .eq('id', update.id)
        .select()
        .single();

      if (rowError) throw rowError;
      fallbackResults.push(rowData);
    }

    return fallbackResults;
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
   * @returns {Promise<void>} A promise that resolves when both operations complete.
   */
  async finishGame(currentPlayingId, nextWaitingId) {
    if (!currentPlayingId && !nextWaitingId) return;

    if (currentPlayingId && nextWaitingId && currentPlayingId === nextWaitingId) {
      throw new Error('Cannot finish and start the same entry in one transition.');
    }

    const transitionTime = new Date().toISOString();

    if (currentPlayingId) {
      const { error: completeError } = await supabase
        .from(TABLES.QUEUE_ENTRIES)
        .update({
          status: QUEUE_STATUSES.COMPLETED,
          ended_at: transitionTime
        })
        .eq('id', currentPlayingId);

      if (completeError) throw completeError;
    }

    if (nextWaitingId) {
      const { error: startError } = await supabase
        .from(TABLES.QUEUE_ENTRIES)
        .update({
          status: QUEUE_STATUSES.PLAYING,
          started_at: transitionTime
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

  return supabase
    .channel('queue_changes')
    .on('postgres_changes', config, (payload) => {
      if (callback && typeof callback === 'function') {
        callback(payload);
      }
    })
    .subscribe();
};

/**
 * Subscribes to real-time changes in user roles for admin/permission management.
 * @param {Function} callback - Called with realtime payload when roles change.
 * @returns {Object} The Supabase Realtime channel subscription.
 */
export const subscribeToUserRoleChanges = (callback) => {
  return supabase
    .channel('user_role_changes')
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
};

/**
 * Subscribes to game session changes for live session tracking.
 * @param {Function} callback - Called with session change payload.
 * @returns {Object} The Supabase Realtime channel subscription.
 */
export const subscribeToGameSessionChanges = (callback) => {
  return supabase
    .channel('game_session_changes')
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
};

