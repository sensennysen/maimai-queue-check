# Roadmap: Preferred Branches Unification

## Phase 1: Planning and Specification
- [x] Analyze `preferred_branches` column in `user_roles` and `user_profiles`.
- [x] Create `.gsd/SPEC.md`
- [x] Create `.gsd/IMPLEMENTATION_PLAN.md`

## Phase 2: Execution (Database Migration)
- [ ] Get user approval for the proposed SQL migration.
- [ ] Connect to `maipaqueuecheckph-prod` Supabase database.
- [ ] Pre-flight check: Query existing mismatched data for observation.
- [ ] Execute `UPDATE user_profiles` SQL statement.
- [ ] Execute `UPDATE user_roles` SQL statement.

## Phase 3: Verification
- [ ] Post-flight check: Query the same subset of users to verify the records are synchronized, unionized, and deduped.
- [ ] Update documentation / state.

## Phase 4: Commit
- [ ] Mark `.gsd/STATE.md` as completed.
- [ ] User final confirmation.
