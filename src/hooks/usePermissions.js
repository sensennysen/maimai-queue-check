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
  const canEdit = userRoles?.can_edit ?? false;
  const canActuallyEdit = isAdmin || (canEdit && locationVerified);

  return { isAdmin, canEdit, canActuallyEdit };
};
