# Feature Specification: User Attributions

## 1. Goal
Create an attribution table showcased on user profiles to display badges/icons for DEVELOPER, CONTRIBUTOR, and TESTER roles.

## 2. Requirements
1. **Database Schema**:
   - Create an enum `user_attribution_type` with values: `'DEVELOPER'`, `'CONTRIBUTOR'`, `'TESTER'`.
   - Create a table `user_attributions`:
     - `id`: FK to `user_profiles.id` (Primary Key).
     - `attributions`: Array of `user_attribution_type` (e.g., `user_attribution_type[]`), defaulting to empty array.
   - Row Level Security (RLS) on `user_attributions`:
     - Provide `SELECT` access for all users, enabling the profile to fetch attributions publically.
     - Insert/Update restricted to service roles or admins.

2. **Frontend Profile UI**:
   - Fetch a user's attributions alongside their `user_profiles` data when viewing a profile.
   - Display a visual badge/icon area for attributions.
   - For `DEVELOPER`, display a specific icon (e.g., Wrench/Code).
   - For `CONTRIBUTOR`, display a specific icon (e.g., Star/Heart).
   - For `TESTER`, display a specific icon (e.g., Bug/Shield).

3. **Status**: FINALIZED
