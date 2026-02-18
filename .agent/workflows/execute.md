---
description: Standard execution workflow for implementing features and fixes
---

## Execute Workflow

Follow these steps when implementing any code change.

1. Make the code edit(s) to the relevant file(s).

// turbo
2. Run lint after every edit to catch syntax and logic errors early. **NEVER** proceed if there are errors:
   ```
   npm run lint
   ```
   - Fix any lint errors (including unused variables and JSX nesting) before proceeding.
   - If `--fix` can resolve them automatically, run `npm run lint:fix` first, then re-run `npm run lint` to confirm clean output.

3. Verify the change works as expected (run dev server, check browser, etc.).

4. Ask the user for confirmation that the task is done/implemented correctly.
   - Do not proceed to commit until the user confirms the changes are correct.

5. Commit the change with a descriptive message following the convention:
   ```
   type(scope): description
   ```
