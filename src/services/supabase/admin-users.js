import { supabase } from './client';
import { TABLES } from '../../constants/database';

// Admin User management service functions
export const adminUserService = {
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
      .from(TABLES.USER_ROLES)
      .select(`user_id, email, queue_name, can_edit, can_edit_on, is_admin, is_super_admin, admin_branch, ${TABLES.USER_PROFILES}!inner(preferred_branches, slug)`, { count: 'exact' });

    if (searchQuery.trim()) {
      const queryStr = `%${searchQuery.trim()}%`;
      query = query.or(`email.ilike.${queryStr},queue_name.ilike.${queryStr}`);
    }

    if (adminBranch) {
      query = query.contains(`${TABLES.USER_PROFILES}.preferred_branches`, [adminBranch]);
    }

    if (sortField) {
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
    }

    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const mappedUsers = (data || []).map(u => {
      const branches = u[TABLES.USER_PROFILES]?.preferred_branches || [];
      return {
        ...u,
        slug: u[TABLES.USER_PROFILES]?.slug || null,
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
    const allowedFields = ['queue_name', 'can_edit', 'can_edit_on', 'is_admin', 'admin_branch'];
    const sanitizedUpdates = {};
    
    for (const key of allowedFields) {
      if (Object.hasOwn(updates, key)) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    const { data, error } = await supabase
      .from(TABLES.USER_ROLES)
      .update(sanitizedUpdates)
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Permission denied or user role record not found.");
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
      .from(TABLES.USER_PROFILES)
      .update(sanitizedUpdates)
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  }
};
