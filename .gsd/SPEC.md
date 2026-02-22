# Feature Specification: Deprecate user_roles.preferred_branches

## 1. Goal
Set all `preferred_branches` on the `user_roles` table to `null` and update the application code to exclusively read from and write to the `user_profiles` table for this column.

## 2. Requirements
1. **Data Migration**:
   - Execute a SQL command on `maipaqueuecheckph-prod` to set `user_roles.preferred_branches = NULL` for all rows.
2. **Codebase Updates**:
   - `src/services/supabase.js`: Remove all logic related to reading, checking, combining, sinking, or saving `preferred_branches` on the `user_roles` table. Rely solely on `user_profiles`.
   - `src/features/admin/components/UserTable.jsx`: Ensure it reads and updates permissions via the Profile instead of the Role.
   - Any other instances (modals, login forms) should be verified.

3. **Status**: PENDING
