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
  
  const canEditFull = userRoles?.can_edit_full ?? false;
  const canEditOn = Array.isArray(userRoles?.can_edit_on) ? userRoles.can_edit_on : [];
  
  // Check if user has permission for the currently selected branch
  const canEditBranch = selectedBranch ? canEditOn.includes(selectedBranch.id) : false;

  // User can edit if they have full edit permissions OR permissions for this specific branch
  // We legacy check userRoles.can_edit just in case, but prefer the new fields
  const canEdit = canEditFull || canEditBranch || (userRoles?.can_edit ?? false);

  // Super admins can edit anywhere.
  // Regular admins and users with can_edit must be location verified.
  const canActuallyEdit = isSuperAdmin || ((isAdmin || canEdit) && locationVerified);

  return { isAdmin, isSuperAdmin, canEdit, canActuallyEdit };
};
