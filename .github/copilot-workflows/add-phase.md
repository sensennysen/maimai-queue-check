---
description: Add a new phase to the end of the roadmap
---

# Add Phase

Add a new phase to the end of the current roadmap. Simple way to extend project scope.

## What This Does

1. **Validates roadmap** - Checks `.gsd/ROADMAP.md` exists
2. **Determines next number** - Counts existing phases
3. **Gathers info** - Phase name, objective, dependencies
4. **Appends to roadmap** - Adds phase at end
5. **Updates state** - Records phase added
6. **Commits** - Atomic commit for new phase

## Arguments

- **Phase name**: Title for the new phase

## When to Use

- Expanding project scope
- Adding new feature phase
- Planning additional work after initial roadmap

## Process Flow

### 1. Validation
Checks `.gsd/ROADMAP.md` exists:
- If not → Error: Run `/new-milestone` first
- If yes → Continue

### 2. Determine Next Phase Number
Counts existing phases:
```powershell
$phases = Select-String -Path ".gsd/ROADMAP.md" -Pattern "### Phase \d+"
$nextPhase = $phases.Count + 1
```

### 3. Gather Phase Information
Asks for:

**Name**: Phase title
- Example: "Social Features", "Performance Optimization"

**Objective**: What this phase achieves
- Example: "Add user following and activity feed"

**Depends on**: Prerequisites
- Usually: Previous phase (N-1)
- Can be: Multiple phases or specific phases

### 4. Add to ROADMAP.md
Appends:

```markdown
---

### Phase {N}: {name}
**Status**: ⬜ Not Started
**Objective**: {objective}
**Depends on**: Phase {N-1}

**Tasks**:
- [ ] TBD (run /plan {N} to create detailed plans)

**Verification**:
- TBD
```

### 5. Update STATE.md
Notes phase addition:
```markdown
Recent changes:
- Added Phase {N}: {name}
```

### 6. Commit
```bash
git add .gsd/ROADMAP.md .gsd/STATE.md
git commit -m "docs: add phase {N} - {name}"
```

### 7. Next Steps
Suggests:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► PHASE ADDED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase {N}: {name}

───────────────────────────────────────────────────────

▶ NEXT

/plan {N} — Create execution plans for this phase

───────────────────────────────────────────────────────
```

## Example Usage

Add a new phase:
```
/add-phase Social Features
```

Then answer prompts for objective and dependencies.

## vs. Insert Phase

**Use `/add-phase` when:**
- Adding to the end (no renumbering needed)
- Simple extension of roadmap
- New work after current phases

**Use `/insert-phase` when:**
- Need to add between existing phases
- Discovered missing foundation work
- Want specific position in sequence

## Example Result

```markdown
### Phase 5: Social Features
**Status**: ⬜ Not Started
**Objective**: Add user following and activity feeds

**Depends on**: Phase 4

**Tasks**:
- [ ] TBD (run /plan 5 to create)

**Verification**:
- TBD
```

## Best Practices

- **Clear objective** - Make it measurable
- **Right dependencies** - Don't skip required phases
- **Reasonable scope** - One major feature area per phase
- **Plan soon** - Run `/plan {N}` while context is fresh

## Reference

Full workflow: `.agent/workflows/add-phase.md`
Related:
- `/insert-phase` - Add phase at specific position
- `/remove-phase` - Remove a phase
- `/plan {N}` - Create plans for the new phase
