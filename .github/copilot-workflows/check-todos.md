---
description: List all pending todo items
---

# Check Todos

Display all pending todo items, optionally filtered by priority or status.

## What This Does

1. **Loads TODO.md** - Reads todo list
2. **Parses items** - Extracts status and priority
3. **Filters** - Applies optional filters
4. **Displays** - Shows formatted list
5. **Counts** - Shows totals by status

## Arguments

- **--all**: Show completed items too
- **--priority high|medium|low**: Filter by priority

## When to Use

- Daily/weekly todo review
- Planning next phase
- Checking for forgotten items
- Prioritizing work

## Process Flow

### 1. Load TODO.md
Reads `.gsd/TODO.md`:
```powershell
if (-not (Test-Path ".gsd/TODO.md")) {
    Write-Output "No todos found. Use /add-todo to create one."
    exit
}
```

### 2. Parse and Filter
Counts items by status:
- `- [ ]` = pending
- `- [x]` = complete

Filters by priority if flag provided.

### 3. Display
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► TODOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PENDING (5 items)
─────────────────

HIGH PRIORITY
🔴 Fix security vulnerability in auth — 2026-03-02
🔴 Resolve database connection leak — 2026-03-02

MEDIUM PRIORITY
🟡 Refactor authentication module — 2026-03-02
🟡 Add error handling to API — 2026-03-01

LOW PRIORITY
🟢 Add dark mode to settings — 2026-03-01

───────────────────────────────────────────────────────

COMPLETED (3 items)
───────────────────
✅ Setup CI/CD pipeline — 2026-02-28
✅ Write API documentation — 2026-02-27
✅ Fix mobile layout issues — 2026-02-26

───────────────────────────────────────────────────────

/add-todo <item> — add new item

───────────────────────────────────────────────────────
```

## Priority Indicators

| Priority | Icon | Color |
|----------|------|-------|
| High | 🔴 | Red |
| Medium | 🟡 | Yellow |
| Low | 🟢 | Green |
| Done | ✅ | Green check |

## Example Usage

View all pending todos:
```
/check-todos
```

View including completed:
```
/check-todos --all
```

View only high priority:
```
/check-todos --priority high
```

## Output Sections

**Without --all flag:**
Shows only pending items by priority.

**With --all flag:**
Shows pending + completed items.

## Todo Statistics

Displays counts:
- Total pending
- Per priority level
- Total completed (if --all)

## Integration with Planning

**During milestone planning:**
```
/check-todos --priority high
→ Review critical items
→ Add to next milestone must-haves
```

**During phase planning:**
```
/check-todos
→ See relevant todos
→ Convert to phase tasks
```

**During gap closure:**
```
/check-todos --all
→ Review what was deferred
→ Create gap plans with /plan-milestone-gaps
```

## Managing Todos

**Mark as complete:**
1. Open `.gsd/TODO.md`
2. Change `- [ ]` to `- [x]`
3. Item moves to Completed section

**Delete todo:**
Simply remove the line from `.gsd/TODO.md`

**Change priority:**
Move line to different priority section

**Add details:**
Todos are markdown - add sub-bullets for details:
```markdown
- [ ] Refactor authentication — 2026-03-02
  - Extract JWT validation
  - Consolidate error handling
  - Add unit tests
```

## Best Practices

- **Review weekly** - Check todos regularly
- **Prioritize honestly** - Not everything is high
- **Mark complete** - Celebrate finishing items
- **Archive old completed** - Move to JOURNAL.md monthly
- **Convert to phases** - Big todos become phase plans

## Common Workflows

**Morning review:**
```
/check-todos --priority high
→ Plan day around critical items
```

**End of sprint:**
```
/check-todos --all
→ Review completed work
→ Move remaining to next sprint
```

**Planning next phase:**
```
/check-todos
→ Identify related todos
→ Include in phase plans
```

## Reference

Full workflow: `.agent/workflows/check-todos.md`
Related:
- `/add-todo` - Add new todo item
- `/plan` - Convert todos to phase plans
- `/plan-milestone-gaps` - Address deferred todos
