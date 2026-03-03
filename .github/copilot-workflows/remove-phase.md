---
description: Remove a phase from the roadmap (with safety checks)
---

# Remove Phase

Remove a phase from the roadmap with comprehensive safety checks. Prevents accidental deletion of completed work.

## What This Does

1. **Validates phase** - Checks phase exists
2. **Checks status** - Ensures safe to remove
3. **Checks dependencies** - Verifies no other phases depend on it
4. **Confirms removal** - Gets explicit user confirmation
5. **Removes phase** - Deletes from ROADMAP.md
6. **Optional cleanup** - Can delete phase directory
7. **Updates STATE** - Records removal
8. **Commits** - Atomic commit

## Arguments

- **Phase number**: e.g., `3` to remove Phase 3

## When to Use

- Phase no longer needed
- Scope change removed requirement
- Duplicate or redundant phase
- Restructuring roadmap

## Safety Checks

### Status Check

| Status | Action |
|--------|--------|
| ⬜ Not Started | Safe to remove |
| 🔄 In Progress | **Warning** - Confirm with user |
| ✅ Complete | **Error** - Use `/complete-milestone` instead |
| ⏸️ Paused | **Warning** - Confirm with user |

### Dependency Check

Scans ROADMAP.md for:
```markdown
Depends on: Phase {N}
```

**If found:**
```
⚠️ CANNOT REMOVE

Phase {M} depends on Phase {N}

Action required:
1. Update Phase {M} dependencies first
2. OR remove Phase {M} first
3. OR use /insert-phase to restructure
```

## Process Flow

### 1. Validate Phase Exists
```powershell
$phase = Select-String -Path ".gsd/ROADMAP.md" -Pattern "### Phase $N:"
if (-not $phase) {
    Write-Error "Phase $N not found in ROADMAP.md"
}
```

### 2. Check Phase Status
Extracts status from ROADMAP.md:
```powershell
$status = Select-String -Path ".gsd/ROADMAP.md" -Pattern "Phase $N:.*\n.*Status: (.*)"
```

**If Complete:**
```
❌ ERROR

Phase {N} is marked as complete.

Completed phases should be archived, not removed.

Use: /complete-milestone
```

**If In Progress or Paused:**
```
⚠️ WARNING

Phase {N} has work in progress or paused.

Are you sure you want to remove it?
A) Yes, remove (work will be lost)
B) No, cancel
```

### 3. Check Dependencies
Searches for dependent phases:
```powershell
Select-String -Path ".gsd/ROADMAP.md" -Pattern "Depends on.*Phase $N"
```

Blocks removal if dependencies exist.

### 4. Confirm Removal
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► CONFIRM REMOVAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase: {N}: {name}
Status: {status}

This will remove the phase from ROADMAP.md.

───────────────────────────────────────────────────────

A) Remove phase only (keep directory)
B) Remove phase and delete directory
C) Cancel

───────────────────────────────────────────────────────
```

### 5. Remove Phase
Deletes phase section from ROADMAP.md.

**If option B chosen:**
```powershell
Remove-Item -Recurse -Force ".gsd/phases/$N"
```

### 6. Renumber Subsequent Phases (Optional)
Asks:
```
Renumber subsequent phases?
- Yes: Phase 4 becomes Phase 3, etc.
- No: Keep phase numbers (gaps are OK)
```

If yes, renumbers like `/insert-phase` in reverse.

### 7. Update STATE.md
Records removal:
```markdown
Recent changes:
- Removed Phase {N}: {name}
- Reason: {user-provided reason}
```

### 8. Commit
```bash
git add .gsd/ROADMAP.md .gsd/STATE.md
# If directory deleted:
git add .gsd/phases/

git commit -m "docs: remove phase {N} - {name}"
```

### 9. Display Result
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► PHASE REMOVED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Removed: Phase {N}: {name}

───────────────────────────────────────────────────────

/progress — Review updated roadmap

───────────────────────────────────────────────────────
```

## Example Usage

Remove phase 4:
```
/remove-phase 4
```

Then answer safety prompts.

## Example Scenarios

**Scope reduced:**
```
/remove-phase 6
→ Confirms no dependencies
→ Removes from roadmap
→ Keeps directory for reference
```

**Duplicate work:**
```
/remove-phase 3
→ Warns phase is in progress
→ User confirms
→ Removes phase and deletes directory
```

**Can't remove (blocked):**
```
/remove-phase 2
→ Error: Phase 3, 4 depend on Phase 2
→ Must handle dependencies first
```

## Best Practices

- **Understand dependencies** - Check what depends on this phase
- **Keep completed work** - Archive rather than remove
- **Document reason** - Explain why in STATE.md
- **Keep directories** - Unless certain no value
- **Update dependent phases** - Adjust their dependencies after removal

## Safety First

The workflow is designed to prevent:
- ❌ Accidental deletion of completed work
- ❌ Breaking dependent phases
- ❌ Losing in-progress work without warning
- ❌ Silent failures

## Reference

Full workflow: `.agent/workflows/remove-phase.md`
Related:
- `/add-phase` - Add phase to roadmap
- `/insert-phase` - Insert phase between others
- `/progress` - See current phase structure
- `/complete-milestone` - Archive completed phases
