# Feature Specification: Profile Visibility for Logged-In Users

## 1. Goal
Fix the bug where authenticated users are restricted from viewing non-public profiles unless they are the owner of the profile.

## 2. Requirements
1. **Frontend Logic Change**:
   - When a user navigates to `/p/:slug`, the app fetches the profile using `userService.getProfileBySlug`.
   - If `!profileData.is_public`, the restriction should *only* trigger if there is NO authenticated user session (i.e. `!user`).
   - If an authenticated `user` session exists, they should bypass the restriction and view the profile as intended.
   
2. **Current Bug**:
   - Currently, `!profileData.is_public && profileData.id !== user?.id` prevents logged-in users from viewing other people's non-public profiles. The intended behavior is that simply logging in acts as the gateway to view them.

3. **Status**: FINALIZED
