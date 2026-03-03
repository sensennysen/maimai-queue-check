---
description: Quick capture an idea or todo item
---

# Add Todo

Quickly capture an idea, task, or issue without interrupting current workflow. Perfect for noting things to address later.

## What This Does

1. **Parses input** - Extracts todo description and priority
2. **Ensures TODO.md exists** - Creates if needed
3. **Adds item** - Appends to todo list
4. **Confirms** - Shows confirmation message

## Arguments

- **Description**: The todo item text
- **--priority high|medium|low**: Optional priority (default: medium)

## When to Use

- Quick idea capture during work
- Note issues to fix later
- Remember to update documentation
- Track refactoring ideas
- List future enhancements

## Process Flow

### 1. Parse Arguments
Extracts:
- **Description**: Todo text
- **Priority**: high | medium | low (default: medium)

### 2. Ensure TODO.md Exists
Creates `.gsd/TODO.md` if it doesn't exist:

```markdown
# TODO List

## High Priority
{items marked high}

## Medium Priority
{items marked medium}

## Low Priority
{items marked low}

## Completed
{items marked done}
```

### 3. Add Todo Item
Appends to appropriate priority section:

```markdown
- [ ] {description} — {date}
```

### 4. Confirmation
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► TODO ADDED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{description}
Priority: {priority}

───────────────────────────────────────────────────────

/check-todos — see all pending items

───────────────────────────────────────────────────────
```

## Example Usage

Add medium priority todo:
```
/add-todo Refactor authentication module
```

Add high priority todo:
```
/add-todo Fix memory leak in data processor --priority high
```

Add low priority todo:
```
/add-todo Add dark mode to settings page --priority low
```

## Priority Guidelines

| Priority | Use When |
|----------|----------|
| **High** 🔴 | Blocks progress, security issue, critical bug |
| **Medium** 🟡 | Should do soon, feature gap, tech debt |
| **Low** 🟢 | Nice to have, polish, optimization |

## TODO.md Structure

```markdown
# TODO List

## High Priority
- [ ] Fix security vulnerability in auth — 2026-03-02
- [ ] Resolve database connection leak — 2026-03-02

## Medium Priority
- [ ] Refactor authentication module — 2026-03-02
- [ ] Add error handling to API endpoints — 2026-03-01

## Low Priority  
- [ ] Add dark mode to settings — 2026-03-01
- [ ] Improve loading animations — 2026-02-28

## Completed
- [x] Setup CI/CD pipeline — 2026-02-28
- [x] Write API documentation — 2026-02-27
```

## Workflow Integration

**During execution:**
```
/execute 2
→ Notice refactoring opportunity
→ /add-todo Refactor data service architecture
→ Continue execution
```

**During debugging:**
```
/debug Login failure
→ Find root cause, but also notice optimization
→ /add-todo Optimize database queries in login --priority low
→ Fix the bug
```

## Managing Todos

**View todos:**
```
/check-todos
```

**Filter by priority:**
```
/check-todos --priority high
```

**Mark complete:**
Edit `.gsd/TODO.md` and change `- [ ]` to `- [x]`

## Best Practices

- **Capture immediately** - Don't wait until later
- **Be specific** - "Refactor auth" not just "refactor"
- **Right priority** - Not everything is high priority
- **Review regularly** - Use `/check-todos` weekly
- **Move to phases** - Convert todos to phase plans when ready

## Prevents

- ❌ Forgetting good ideas
- ❌ Scope creep during focused work
- ❌ Losing track of technical debt
- ❌ Mental clutter

## Reference

Full workflow: `.agent/workflows/add-todo.md`
Related:
- `/check-todos` - View all todo items
- `/plan-milestone-gaps` - Convert todos to plans
