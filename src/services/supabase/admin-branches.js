import { supabase } from './client';
import { TABLES } from '../../constants/database';

// Branch service functions
export const branchService = {
  // Fetch all branches that are fully set up for queueing (has coordinates and schedule)
  async getAllBranches() {
    const { data, error } = await supabase
      .from(TABLES.ALLOWED_PLACES)
      .select(`id, arcade_name, short_name, acronym, longitude, latitude, cab_count, enabled, ${TABLES.MALL_SCHEDULE}(id)`)
      .eq('enabled', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('arcade_name', { ascending: true });

    if (error) throw error;
    
    // Filter on client side for branches that have at least one schedule
    const filteredData = (data || []).filter(branch => branch[TABLES.MALL_SCHEDULE] && branch[TABLES.MALL_SCHEDULE].length > 0)
      .map(branch => {
        const rest = { ...branch };
        delete rest[TABLES.MALL_SCHEDULE];
        return rest;
      });
      
    return filteredData;
  },

  // Fetch a single branch by ID
  async getBranchById(branchId) {
    const { data, error } = await supabase
      .from(TABLES.ALLOWED_PLACES)
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
      .from(TABLES.ALLOWED_PLACES)
      .select('id, arcade_name, short_name, acronym');

    if (error) throw error;
    return data || [];
  },

  // Fetch all enabled branches regardless of coordinates or schedules
  async getAllEnabledBranches() {
    const { data, error } = await supabase
      .from(TABLES.ALLOWED_PLACES)
      .select('id, arcade_name, short_name, acronym, longitude, latitude, cab_count, enabled')
      .eq('enabled', true)
      .order('arcade_name', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};

// Mall schedule service functions
export const scheduleService = {
  // Fetch full mall schedule
  async getSchedule(branchId) {
    let query = supabase
      .from(TABLES.MALL_SCHEDULE)
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

// Admin Branch CRUD functions
export const adminBranchService = {
  // Get all branches for admin
  async getAllBranchesForAdmin() {
    const { data, error } = await supabase
      .from(TABLES.ALLOWED_PLACES)
      .select('id, arcade_name, short_name, acronym, cab_count, enabled, latitude, longitude')
      .order('arcade_name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Create a new branch in allowed_places
  async createBranch(branchData) {
    const { data, error } = await supabase
      .from(TABLES.ALLOWED_PLACES)
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
      .from(TABLES.MALL_SCHEDULE)
      .insert(schedules)
      .select();

    if (error) throw error;
    return data;
  },

  // Update an existing branch
  async updateBranch(branchId, updates) {
    const { data, error } = await supabase
      .from(TABLES.ALLOWED_PLACES)
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
      .from(TABLES.ALLOWED_PLACES)
      .select('id, arcade_name, short_name, acronym, longitude, latitude, cab_count, enabled')
      .eq('id', branchId)
      .single();

    if (branchError) throw branchError;

    const { data: schedules, error: scheduleError } = await supabase
      .from(TABLES.MALL_SCHEDULE)
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
      .from(TABLES.MALL_SCHEDULE)
      .delete()
      .eq('branch_id', branchId);

    if (scheduleError) throw scheduleError;

    const { error: branchError } = await supabase
      .from(TABLES.ALLOWED_PLACES)
      .delete()
      .eq('id', branchId);

    if (branchError) throw branchError;
  },

  // Update mall schedules for a branch
  async updateMallSchedules(branchId, schedules) {
    const { error: deleteError } = await supabase
      .from(TABLES.MALL_SCHEDULE)
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
      .from(TABLES.MALL_SCHEDULE)
      .insert(scheduleData)
      .select();

    if (error) throw error;
    return data;
  }
};
