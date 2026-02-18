# feat(profile): improve profile viewing and visibility

## Goal
Improve how user profiles are viewed by adding a top-level public visibility flag and better error handling for restricted profiles.

## Requirements
1.  **Database**: Add `is_public` (boolean, default `false`) to `user_profiles` table.
2.  **Toggle**: Add an "Enable Public Profile" toggle in the Profile Settings modal.
3.  **Visibility Logic**:
    *   If `is_public` is `true`, anyone can view the profile via its slug (logged in or not).
    *   If `is_public` is `false`, only the owner can see their own profile view.
    *   In `PublicProfilePage`, if a profile is not public, display: "The user restricts viewing it in public so that they need to be logged in."
4.  **UX**: Improve the "Profile not found" or "Restricted" display with a clearer message and better aesthetics.

## Scope
- `supabase/migrations`: New migration to add `is_public` column.
- `src/services/supabase.js`: Update `rolesService.getUserRoles` and `userService.getProfileBySlug` to include `is_public`.
- `src/pages/ProfilePage.jsx`: Add `is_public` toggle to settings.
- `src/pages/PublicProfilePage.jsx`: Implement visibility check and improved error messages.

## Status: FINALIZED

