---
description: Restore context from previous session
---

# Resume Session

Start a new session with full context from where you left off. Loads saved state for seamless continuation.

## What This Does

1. **Loads saved state** - Reads `.gsd/STATE.md`
2. **Displays context** - Shows what was being worked on
3. **Reviews blockers** - Lists impediments
4. **Shows next steps** - Clear first actions
5. **Checks for changes** - Detects uncommitted work
6. **Updates state** - Marks session as active

## When to Use

- **Starting new work session** - After using `/pause`
- **After breaks** - Long lunch, overnight, etc.
- **Context refresh** - When feeling lost
- **Taking over work** - From another developer or AI session

## Process Flow

### 1. Load Saved State
Reads complete `.gsd/STATE.md`.

### 2. Display Context
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► RESUMING SESSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LAST POSITION
─────────────
Phase: {phase from STATE.md}
Task: {task from STATE.md}
Status: {status when paused}

───────────────────────────────────────────────────────

CONTEXT FROM LAST SESSION
─────────────────────────

Decisions Made:
- {Decision 1}: {rationale}
- {Decision 2}: {rationale}

Approaches Tried:
- {Approach 1}: {outcome}
- {Approach 2}: {outcome}

Current Hypothesis:
{best guess at solution}

Files of Interest:
- {file1}: {what's relevant}
- {file2}: {what's relevant}

───────────────────────────────────────────────────────

BLOCKERS
────────
{blockers from STATE.md, or "None"}

───────────────────────────────────────────────────────

NEXT STEPS (from last session)
──────────────────────────────
1. {First priority}
2. {Second priority}
3. {Third priority}

───────────────────────────────────────────────────────
```

### 3. Load Recent Journal
Shows last entry from `.gsd/JOURNAL.md`:

```markdown
Last Session: {date and time}

Objective: {what was being worked on}

Accomplished:
- {item 1}
- {item 2}

Handoff Notes:
{critical information}
```

### 4. Check for Uncommitted Changes
```bash
git status --porcelain
```

**If changes found:**
```
⚠️ UNCOMMITTED CHANGES DETECTED

{list of modified files}

These may be from the previous session.
Review before proceeding.
```

### 5. Update State
Marks session as active in `.gsd/STATE.md`:
```markdown
**Status**: Active (resumed {timestamp})
```

### 6. Suggest Action
```
───────────────────────────────────────────────────────

▶ READY TO CONTINUE

Recommended first action: {from next steps}

───────────────────────────────────────────────────────
```

## Example Usage

Resume work:
```
/resume
```

Displays full context from last `/pause`.

## What You Get

**Complete Context:**
- Where you were in the project
- What you were working on
- Decisions made (with reasoning)
- Approaches already tried
- Current working hypothesis
- Files that matter
- Clear next action

**Benefits:**
- **Zero context loss** - Pick up exactly where you left off
- **Prevents rework** - See what was already tried
- **Clear direction** - Next steps are explicit
- **Fresh perspective** - New session with saved context

## Common Scenarios

**After overnight:**
```
/resume → See yesterday's context → Continue work
```

**After debugging exhaustion:**
```
/pause → Take break → /resume → Fresh eyes, same context
```

**Team handoff:**
```
Developer A: /pause with detailed notes
Developer B: /resume → See A's context
```

**Lost in the code:**
```
/resume → Refresh on current goal
```

## Best Practices

- **Review context carefully** - Don't just skip past
- **Check uncommitted work** - Understand what's in progress
- **Honor previous decisions** - Read why choices were made
- **Follow suggested next steps** - They're there for a reason
- **Update STATE if plans change** - Keep it current

## Pair with /pause

These commands work together:

```
Work session → /pause → Break → /resume → Continue
```

Creates clean handoffs and maintains context hygiene.

## Reference

Full workflow: `.agent/workflows/resume.md`
Related: `/pause` to save state
