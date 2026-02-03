import { useAuth } from './useAuth';
import { useLocationVerification } from './useLocationVerification';

/**
 * Hook that consolidates permission logic used across components
 * @returns {{ isAdmin: boolean, canEdit: boolean, canActuallyEdit: boolean }}
 */
export const usePermissions = () => {
  const { userRoles } = useAuth();
  const { locationVerified } = useLocationVerification();

  const isAdmin = userRoles?.is_admin ?? false;
  const isSuperAdmin = userRoles?.is_super_admin ?? false;
  const canEdit = userRoles?.can_edit ?? false;

  // Super admins can edit anywhere.
  // Regular admins and users with can_edit must be location verified.
  const canActuallyEdit = isSuperAdmin || ((isAdmin || canEdit) && locationVerified);

  return { isAdmin, isSuperAdmin, canEdit, canActuallyEdit };
};
