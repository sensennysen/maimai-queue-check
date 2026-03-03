---
description: Save state for clean session handoff
---

# Pause Session

Safely pause work with complete state preservation for session handoff. Essential for context hygiene.

## What This Does

1. **Captures current state** - Position, task, context
2. **Documents decisions** - What was tried and why
3. **Records blockers** - What prevented progress
4. **Lists next steps** - Clear handoff for resuming
5. **Creates journal entry** - Session summary
6. **Commits state** - Preserves all context

## When to Use

- **Ending work session** - Before closing IDE
- **Context getting heavy** - Many failed attempts
- **Switching tasks** - Moving to different work
- **Before breaks** - Lunch, EOD, etc.
- **After 3+ debug failures** - Context hygiene rule

## Process Flow

### 1. Capture Current State
Updates `.gsd/STATE.md` with:

```markdown
## Current Position
- **Phase**: {number and name}
- **Task**: {specific task in progress}
- **Status**: Paused at {timestamp}

## Last Session Summary
{What was accomplished this session}

## In-Progress Work
{Any uncommitted changes or partial work}
- Files modified: {list}
- Tests status: {passing/failing/not run}

## Blockers
{What was preventing progress, if anything}

## Context Dump
{Critical context that would be lost}

### Decisions Made
- {Decision 1}: {rationale}
- {Decision 2}: {rationale}

### Approaches Tried
- {Approach 1}: {outcome}
- {Approach 2}: {outcome}

### Current Hypothesis
{Best guess at solution/issue}

### Files of Interest
- `{file1}`: {what's relevant}
- `{file2}`: {what's relevant}

## Next Steps
1. {Specific first action for next session}
2. {Second priority}
3. {Third priority}
```

### 2. Create Journal Entry
Adds to `.gsd/JOURNAL.md`:

```markdown
## Session: {YYYY-MM-DD HH:MM}

### Objective
{What this session aimed to accomplish}

### Accomplished
- {Item 1}
- {Item 2}

### Verification
- [x] {What was verified}
- [ ] {What still needs verification}

### Paused Because
{Reason for pausing}

### Handoff Notes
{Critical info for resuming}
```

### 3. Commit State
```bash
git add .gsd/STATE.md .gsd/JOURNAL.md
git commit -m "docs: pause session - {brief reason}"
```

### 4. Display Summary
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► SESSION PAUSED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

State saved to .gsd/STATE.md

Next session: /resume

───────────────────────────────────────────────────────
```

## Context Hygiene Rule

**After 3 consecutive failures on same issue:**
1. Run `/pause` to dump state
2. Take a break
3. Start fresh session with `/resume`
4. Fresh context often sees what polluted context missed

## What Gets Saved

**Critical Information:**
- Current position in roadmap
- Files being worked on
- Decisions made this session
- Approaches already tried (prevents loops)
- Current hypothesis
- Known blockers
- Clear next steps

**Benefits:**
- No lost context between sessions
- Prevents circular debugging
- Clear handoff to future self or AI
- Journal creates project history

## Example Usage

Pause current work:
```
/pause
```

Answers prompts about:
- What you accomplished
- Why you're pausing
- Next steps to take

## Resume Later

When ready to continue:
```
/resume
```

Loads all saved context and displays summary.

## Best Practices

- **Pause regularly** - Don't carry heavy context
- **Be specific** - Detail what was tried
- **Clear next steps** - First action should be obvious
- **Commit often** - Pause is a good commit point
- **Use for handoffs** - Great for team collaboration

## Reference

Full workflow: `.agent/workflows/pause.md`
Related: `/resume` to restore state
