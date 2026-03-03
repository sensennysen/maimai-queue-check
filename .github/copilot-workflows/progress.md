---
description: Show current position and next steps
---

# Progress

Quick status check showing where you are in the roadmap and what's next.

## What This Does

1. **Loads state** - Reads current position from STATE.md
2. **Calculates progress** - Counts phase statuses
3. **Shows blockers** - Lists any impediments
4. **Suggests action** - Recommends next command

## When to Use

- Check where you are in the project
- After resuming a session
- Before planning next steps
- Review overall status

## Output Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► PROGRESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project: {name from SPEC.md}
Milestone: {milestone from ROADMAP.md}

───────────────────────────────────────────────────────

PHASES

✅ Phase 1: Setup & Infrastructure
✅ Phase 2: User Authentication
🔄 Phase 3: Playlist Management ← CURRENT
⬜ Phase 4: Sharing Features
⬜ Phase 5: Polish & Launch

Progress: 2/5 (40%)

───────────────────────────────────────────────────────

CURRENT TASK

Implementing playlist CRUD operations

───────────────────────────────────────────────────────

BLOCKERS

None

───────────────────────────────────────────────────────

▶ NEXT UP

/execute 3 — Continue Phase 3 implementation

───────────────────────────────────────────────────────
```

## Status Indicators

| Icon | Meaning |
|------|---------|
| ✅ | Completed and verified |
| 🔄 | In progress |
| ⏸️ | Paused/blocked |
| ⬜ | Not started |

## Recommended Actions

The workflow suggests next commands based on state:

| Current State | Recommendation |
|--------------|----------------|
| Phase in progress | `/execute {N}` to continue |
| Phase done, not verified | `/verify {N}` |
| Verification failed | `/execute {N} --gaps-only` to fix |
| All phases complete | `/complete-milestone` |
| No phases started | `/plan 1` to begin |
| SPEC not finalized | Finalize SPEC.md first |

## Example Usage

Check current progress:
```
/progress
```

## Files Read

- `.gsd/STATE.md` - Current position and context
- `.gsd/ROADMAP.md` - Phase definitions and statuses
- `.gsd/SPEC.md` - Project name and requirements

## Quick Navigation

After seeing progress, use these commands:
- `/execute {N}` - Work on a phase
- `/plan {N}` - Plan a phase
- `/verify {N}` - Verify completed work
- `/pause` - Save state and stop
- `/help` - See all commands

## Reference

Full workflow: `.agent/workflows/progress.md`
