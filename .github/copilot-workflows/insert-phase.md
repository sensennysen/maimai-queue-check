---
description: Insert a phase between existing phases (renumbers subsequent)
---

# Insert Phase

Insert a new phase at specific position in roadmap. Automatically renumbers all subsequent phases and updates references.

## What This Does

1. **Validates position** - Checks position is valid
2. **Gathers info** - Phase name, objective, dependencies
3. **Renumbers phases** - Increments phases >= position
4. **Updates directories** - Renames `.gsd/phases/{N}/`
5. **Updates references** - Fixes PLAN.md dependencies
6. **Inserts new phase** - Adds at correct position
7. **Updates STATE** - Adjusts current position if needed
8. **Commits** - Atomic commit with renumber count

## Arguments

- **Position**: Where to insert (e.g., 2 inserts before current Phase 2)
- **Phase name**: Title for the new phase

## When to Use

- Discovered missing foundation work
- Need phase between existing phases
- Realized dependencies require earlier work
- Restructuring phase order

## Process Flow

### 1. Parse Arguments
Extracts:
- **Position**: Number (1-N+1)
- **Name**: Phase title

### 2. Validate Position
```powershell
$totalPhases = (Select-String -Path ".gsd/ROADMAP.md" -Pattern "### Phase \d+").Count
if ($position -lt 1 -or $position -gt $totalPhases + 1) {
    Write-Error "Invalid position. Valid: 1-$($totalPhases + 1)"
}
```

### 3. Gather Phase Information
Asks for:
- **Objective**: What this phase achieves
- **Dependencies**: What it needs from earlier phases

### 4. Renumber Existing Phases
For all phases >= position:
- Increment phase number by 1
- Update in ROADMAP.md
- Rename `.gsd/phases/{N}/` to `.gsd/phases/{N+1}/`
- Update references in PLAN.md files
- Fix dependencies in ROADMAP.md

**Example:**
```
Before: Phase 1, 2, 3, 4, 5
Insert at position 3
After: Phase 1, 2, 3 (new), 4 (was 3), 5 (was 4), 6 (was 5)
```

### 5. Insert New Phase
Add phase at correct position with proper number:

```markdown
### Phase {position}: {name}
**Status**: ⬜ Not Started
**Objective**: {objective}
**Depends on**: {dependencies}

**Tasks**:
- [ ] TBD (run /plan {position} to create)

**Verification**:
- TBD
```

### 6. Update STATE.md
If currently in a phase >= position:
- Increment current phase number
- Note the insertion

### 7. Commit
```bash
git add -A
git commit -m "docs: insert phase {position} - {name} (renumbered {M} phases)"
```

### 8. Display Result
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► PHASE INSERTED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Inserted: Phase {position}: {name}
Renumbered: {M} subsequent phases

Updated:
- ROADMAP.md
- Phase directories
- Plan references
- STATE.md

───────────────────────────────────────────────────────

▶ NEXT

/plan {position} — Create execution plans for new phase

───────────────────────────────────────────────────────
```

## Example Usage

Insert phase at position 3:
```
/insert-phase 3 Database Migration
```

Then answer prompts for objective and dependencies.

## Safety Features

**Renumbering is comprehensive:**
- ✅ ROADMAP.md phase numbers
- ✅ Phase directory names
- ✅ References in PLAN.md files
- ✅ Dependencies between phases
- ✅ Current position in STATE.md

**Preserves work:**
- No data loss from existing phases
- All plans and summaries move with phase
- Git tracks all changes

## Example Scenario

You're working on Phase 3 but realize you need authentication first:

```
Current:
Phase 1: Setup
Phase 2: Database
Phase 3: User Dashboard ← Need auth before this!
Phase 4: API

Action:
/insert-phase 3 Authentication

Result:
Phase 1: Setup
Phase 2: Database
Phase 3: Authentication (NEW)
Phase 4: User Dashboard (was 3)
Phase 5: API (was 4)
```

## Best Practices

- **Think carefully** - Insertion renumbers everything
- **Check dependencies** - Update phase dependencies after insert
- **Communicate changes** - If working with team
- **Verify references** - Check that plans still make sense
- **Consider /add-phase** - Simpler if can add to end

## vs. Add Phase

| Operation | Use When |
|-----------|----------|
| `/add-phase` | Adding to end, no renumbering |
| `/insert-phase` | Need specific position, accept renumbering |

## Reference

Full workflow: `.agent/workflows/insert-phase.md`
Related:
- `/add-phase` - Simpler addition to end
- `/remove-phase` - Remove a phase
- `/progress` - See current phase structure
