---
description: Standard execution workflow for implementing features and fixes
---

## Execute Workflow

Follow these steps when implementing any code change.

1. Make the code edit(s) to the relevant file(s).
   - **Crucial**: When working with Supabase MCP, always ask for explicit approval from the user before execution of any actions or command.

// turbo
2. Run lint after every edit to catch syntax and logic errors early. **NEVER** proceed if there are errors:
   ```
   npm run lint
   ```
   - Fix any lint errors (including **undefined variables**, unused variables, and JSX nesting) before proceeding.
   - Pay special attention to **broken references** and missing state/prop definitions after refactoring.
   - If `--fix` can resolve them automatically, run `npm run lint:fix` first, then re-run `npm run lint` to confirm clean output.

3. Self-check for any code pollution (e.g., accidental markdown markers, backticks, or file headers) introduced during the edit.

4. Verify the change works as expected (run dev server, check browser, etc.).

5. Ask the user for confirmation that the task is done/implemented correctly.
   - Do not proceed to commit until the user confirms the changes are correct.

6. Commit the change with a descriptive message following the convention:
   ```
   type(scope): description
   ```