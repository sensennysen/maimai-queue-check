import { adminBranchService, branchService, scheduleService } from './admin-branches';
import { adminUserService } from './admin-users';
import { requestService } from './admin-requests';
import { rulesService } from './admin-rules';

// Legacy re-exports to maintain compatibility
export const adminService = {
  ...adminBranchService,
  ...adminUserService
};

export { 
  branchService, 
  scheduleService, 
  adminBranchService, 
  adminUserService, 
  requestService, 
  rulesService 
};
