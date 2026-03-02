---
description: Execute a specific phase with focused context
---

# Execute Phase

Execute all plans in a phase using wave-based execution.

## What This Does

1. **Validates** the phase exists and has plans in `.gsd/ROADMAP.md`
2. **Discovers** all PLAN.md files in `.gsd/phases/{phase}/`
3. **Groups** plans by execution wave (based on dependencies)
4. **Executes** plans sequentially by wave, parallel within wave
5. **Verifies** each task has empirical proof (command output, screenshot, etc.)
6. **Updates** state in `.gsd/STATE.md` and `FEATURES.md`

## Arguments

- **Phase number**: Required (e.g., `1`, `2`, `3`)
- **--gaps-only**: Optional flag to execute only gap closure plans

## Execution Flow

### 1. Load Phase Context
- Read `.gsd/ROADMAP.md` to confirm phase exists
- Read `.gsd/phases/{phase}/*-PLAN.md` files
- Parse tasks and dependencies from each plan

### 2. Analyze Dependencies
- Group plans into waves:
  - **Wave 1**: No dependencies (foundation)
  - **Wave 2**: Depends on Wave 1
  - **Wave 3**: Depends on Wave 2
- Display wave grouping to user

### 3. Execute Each Wave
For each wave:
1. Execute all plans in the wave
2. For each task in each plan:
   - Implement the code changes
   - Run verification command
   - Capture proof (output, screenshot)
   - Commit: `type(scope): description`
3. Create wave summary in SUMMARY.md
4. Move to next wave

### 4. Phase Completion
- Verify all must-haves from phase definition
- Update `.gsd/STATE.md` with new position
- Update `FEATURES.md` with completed features

## Quality Standards

**Planning Lock**: Only execute if `.gsd/SPEC.md` status is `FINALIZED`.

**Proof Required**: Every task needs empirical evidence:
- API: curl output or test results
- UI: Screenshot or visual confirmation  
- Build: Successful build output
- Test: Test runner results

**Commit Format**: `type(scope): description`
- Types: feat, fix, docs, refactor, test, chore

## Example Usage

Execute phase 2:
```
/execute 2
```

Execute only gap closure plans for phase 3:
```
/execute 3 --gaps-only
```

## Reference

Full workflow details: `.agent/workflows/execute.md`
