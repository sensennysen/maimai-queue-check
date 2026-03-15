import { supabase } from './client';
import { TABLES } from '../../constants/database';

// Queue rules service functions
export const rulesService = {
  // Fetch queue rules for a branch
  async getRules(branchId) {
    if (!branchId) return null;

    const { data, error } = await supabase
      .from(TABLES.QUEUE_RULES)
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
      .from(TABLES.QUEUE_RULES)
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
