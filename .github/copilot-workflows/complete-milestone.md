---
description: Mark milestone complete and archive documentation
---

# Complete Milestone

Finalize current milestone, archive all documentation, and prepare for next milestone.

## What This Does

1. **Verifies completion** - Checks all phases are done
2. **Runs final verification** - Validates all must-haves
3. **Generates summary** - Creates milestone SUMMARY.md
4. **Archives state** - Moves docs to milestone archive
5. **Updates roadmap** - Marks milestone complete
6. **Commits** - Atomic commit for completion

## When to Use

- All phases in milestone are complete
- Ready to  move to next milestone
- Project completion

## Process Flow

### 1. Verify All Phases Complete
Checks ROADMAP.md for incomplete phases:
```powershell
Select-String -Path ".gsd/ROADMAP.md" -Pattern "Status.*Not Started|Status.*In Progress"
```

**If incomplete phases found:**
```
⚠️ Cannot complete milestone — {N} phases incomplete

Incomplete:
- Phase {N}: {name} — {status}

Run /progress to see full status.
```

### 2. Run Final Verification
For each must-have from ROADMAP.md:
- Execute verification command
- Capture evidence
- Create/update VERIFICATION.md

### 3. Generate Milestone Summary
Creates `.gsd/milestones/{name}-SUMMARY.md`:

```markdown
# Milestone: {name}

**Completed**: {date}

## Goal
{milestone goal from ROADMAP.md}

## Deliverables
- ✅ {must-have 1}
- ✅ {must-have 2}
- ✅ {must-have 3}

## Phases Completed
1. Phase 1: {name} — {completion date}
2. Phase 2: {name} — {completion date}
3. Phase 3: {name} — {completion date}

## Metrics
- Total commits: {N}
- Files changed: {M}
- Duration: {days}
- Lines of code: {LOC}

## Key Decisions
{Extract from DECISIONS.md}

## Technical Debt
{Items from TODO.md}

## Lessons Learned
{Auto-extract from JOURNAL.md entries}

## Next Milestone
{If planned, link to next milestone}
```

### 4. Archive Current State
Creates milestone archive:

```powershell
# Create archive directory
New-Item -ItemType Directory -Force ".gsd/milestones/{name}"

# Copy key docs
Copy-Item ".gsd/SPEC.md" ".gsd/milestones/{name}/"
Copy-Item ".gsd/ROADMAP.md" ".gsd/milestones/{name}/"
Copy-Item ".gsd/DECISIONS.md" ".gsd/milestones/{name}/"
Copy-Item ".gsd/JOURNAL.md" ".gsd/milestones/{name}/"

# Move phase folders
Move-Item ".gsd/phases/*" ".gsd/milestones/{name}/phases/"
```

### 5. Update ROADMAP.md
Marks milestone as complete:

```markdown
# ROADMAP.md

> **Status**: ✅ COMPLETE
> **Completed**: {date}
> **Summary**: .gsd/milestones/{name}-SUMMARY.md

[Move to archive section or clear for next milestone]
```

### 6. Update STATE.md
Records completion:

```markdown
## Current Position
- **Milestone**: {name}
- **Status**: Complete ({date})

## Milestone History
- {name}: ✅ Complete ({date})

## Ready For
Next milestone initialization
```

### 7. Commit
```bash
git add -A
git commit -m "docs: complete milestone {name}"
```

### 8. Display Summary
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► MILESTONE COMPLETE! 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Milestone: {name}
Completed: {date}

Deliverables: {N}/{N} ✅
Phases: {M} completed
Duration: {days} days

───────────────────────────────────────────────────────

ARCHIVED

Documentation saved to:
.gsd/milestones/{name}/

Summary:
.gsd/milestones/{name}-SUMMARY.md

───────────────────────────────────────────────────────

▶ NEXT

/new-milestone — Start next milestone
/audit-milestone — Review milestone quality

───────────────────────────────────────────────────────
```

## Example Usage

Complete current milestone:
```
/complete-milestone
```

## What Gets Archived

**Copied to archive:**
- SPEC.md (requirements)
- ROADMAP.md (phase structure)
- DECISIONS.md (decision log)
- JOURNAL.md (session history)
- All phase folders with plans and summaries

**Stays in root:**
- PROJECT_RULES.md
- GSD-STYLE.md
- FEATURES.md
- Current codebase

## Metrics Collected

- **Commits**: Total in milestone
- **Files**: Count of files changed
- **Duration**: Days from start to completion
- **LOC**: Lines of code added/removed
- **Phases**: Number completed
- **Gaps**: Gap closures required

## Best Practices

- **Verify everything** - Don't skip final verification
- **Document lessons** - Review JOURNAL.md for insights
- **Address debt** - Note technical debt in summary
- **Celebrate** - Milestone completion is an achievement!
- **Plan next** - Keep momentum with next milestone

## Safety Checks

The workflow prevents:
- ❌ Completing with unfinished phases
- ❌ Skipping must-have verification
- ❌ Losing documentation
- ❌ Forgetting to archive

## Reference

Full workflow: `.agent/workflows/complete-milestone.md`
Related:
- `/audit-milestone` - Review quality
- `/new-milestone` - Start next milestone
- `/progress` - Check current status
