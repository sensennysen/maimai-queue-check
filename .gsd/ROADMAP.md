# ROADMAP: Fix Profile Visibility for Logged-In Users

## Phase 1: SPEC & PLAN
- Document bug in `SPEC.md`. (Status: Done)
- Draft `implementation_plan.md` outlining the frontend fix. (Status: Done)
- Await user approval.

## Phase 2: EXECUTION
- Modify `PublicProfilePage.jsx` to alter the `isRestricted` trigger condition.
- Ensure the fix passes ESLint checks.

## Phase 3: VERIFICATION
- Confirm that the `user` context variable is correctly structured.
- Confirm logic effectively unblocks authenticated non-owners.

## Phase 4: COMMIT
- Commit the changes explicitly following standard GSD conventions.
- Update `STATE.md`.
