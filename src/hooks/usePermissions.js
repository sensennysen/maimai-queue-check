import { useAuth } from './useAuth';
import { useLocationVerification } from './useLocationVerification';
import { useBranch } from '../contexts/BranchContext';

/**
 * Hook that consolidates permission logic used across components
 * @returns {{ isAdmin: boolean, canEdit: boolean, canActuallyEdit: boolean }}
 */
export const usePermissions = () => {
  const { userRoles } = useAuth();
  const { locationVerified } = useLocationVerification();
  const { selectedBranch } = useBranch();

  const isAdmin = userRoles?.is_admin ?? false;
  const isSuperAdmin = userRoles?.is_super_admin ?? false;
  
  // 'can_edit' acts as "Global Edit" permission
  const canEditGlobal = userRoles?.can_edit ?? false;
  const canEditOn = Array.isArray(userRoles?.can_edit_on) ? userRoles.can_edit_on : [];
  
  // Check if user has permission for the currently selected branch
  const canEditBranch = selectedBranch 
    ? canEditOn.some(id => String(id) === String(selectedBranch.id)) 
    : false;

  // User can edit if they have global edit permissions OR permissions for this specific branch
  const canEdit = canEditGlobal || canEditBranch;

  // Super admins can edit anywhere (bypass).
  // For everyone else, 'locationVerified' is true ONLY if they pass strict Location + Permission checks.
  const canActuallyEdit = isSuperAdmin || locationVerified;

  return { isAdmin, isSuperAdmin, canEdit, canActuallyEdit };
};
