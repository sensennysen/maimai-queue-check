---
description: Create plans to address milestone gaps
---

# Plan Milestone Gaps

Create targeted plans to address gaps, technical debt, and issues identified during milestone audit or verification.

## What This Does

1. **Loads gap info** - From audit, verification, or todo lists
2. **Categorizes gaps** - By priority and type
3. **Creates gap phase** - Adds to roadmap if needed
4. **Generates plans** - Fix plan for each gap
5. **Updates roadmap** - Marks as gap closure
6. **Ready for execution** - Can run /execute with --gaps-only

## When to Use

- After `/audit-milestone` finds issues
- After `/verify` reveals failures
- Before starting next milestone
- To address accumulated technical debt
- When quality issues need attention

## Process Flow

### 1. Load Gap Information
Reads from:
- `.gsd/milestones/{name}-AUDIT.md`
- `.gsd/phases/{N}/VERIFICATION.md`
- `.gsd/TODO.md` (deferred items)
- `.gsd/DECISIONS.md` (acknowledged debt)

### 2. Categorize Gaps

| Category | Priority | Impact |
|----------|----------|--------|
| **Must-have failures** | 🔴 Critical | Blocks milestone completion |
| **Integration issues** | 🔴 High | Affects core functionality |
| **Technical debt** | 🟡 Medium | Maintainability concern |
| **Nice-to-have misses** | 🟢 Low | Enhancement opportunity |

### 3. Display Gaps
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► MILESTONE GAPS FOUND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total: {N} gaps identified

───────────────────────────────────────────────────────

CRITICAL (🔴)
─────────────
1. User authentication fails on mobile Safari
   Source: Phase 2 verification
   Impact: Blocks mobile users

2. Payment webhook not receiving events
   Source: Phase 3 verification
   Impact: Payments not confirmed

HIGH (🟡)
─────────
3. N+1 query issue in dashboard
   Source: TODO.md (technical debt)
   Impact: Performance degradation

4. Missing error handling in API layer
   Source: Audit
   Impact: Poor error experience

LOW (🟢)
────────
5. Improve loading state UI
   Source: Nice-to-have from Phase 2
   Impact: User experience polish

───────────────────────────────────────────────────────

How should we proceed?

A) Create gap closure phase
B) Add to next milestone
C) Create individual fix plans
D) Cancel

───────────────────────────────────────────────────────
```

### 4. Create Gap Closure Phase (Option A)
Adds phase to ROADMAP.md:

```markdown
---

### Phase {N}: Gap Closure
**Status**: ⬜ Not Started
**Objective**: Address gaps from {milestone} audit/verification

**Gap Type**: 🔧 Maintenance / Quality

**Gaps to Close**:
- [ ] {gap 1} — Priority: 🔴 Critical
- [ ] {gap 2} — Priority: 🔴 High
- [ ] {gap 3} — Priority: 🟡 Medium

**Verification**:
- All originally failed verifications now pass
- Technical debt items resolved
- No new regressions introduced
```

### 5. Create Gap Plans
For each gap, creates `.gsd/phases/{N}/{gap-id}-GAP-PLAN.md`:

```markdown
---
phase: {N}
plan: gap-{id}
wave: {based on dependencies}
gap_closure: true
original_phase: {where gap originated}
---

# Gap Fix: {Gap Description}

## Problem
{What the audit/verification found}

**Severity**: {Critical/High/Medium/Low}

**Impact**: {User/system impact}

**Source**: {Where identified}

## Root Cause
{Why this gap exists}

**Contributing factors**:
- {factor 1}
- {factor 2}

## Context
@.gsd/phases/{original}/VERIFICATION.md
@{affected files}

## Tasks

### Task 1: {Fix description}
**What**: {Specific fix action}

**Files**:
- {file 1}
- {file 2}

**Action**: {Implementation details}

**Verify**: {Run the original failed verification}
```{original verification command}```

**Evidence**: {What success looks like}

**Done**: {Completion criteria}

### Task 2: {Add test/prevention}
**What**: Prevent regression

**Files**:
- {test files}

**Action**: Add test that would have caught this

**Verify**:
```{test command}```

**Done**: Test passes and covers gap scenario

## Success Criteria
- [ ] Original verification now passes
- [ ] Test added to prevent regression
- [ ] No new issues introduced
- [ ] Documentation updated if needed

## Dependencies
- Requires: {any prerequisite fixes}
- Blocks: {gaps that depend on this}

## Notes
{Additional context}
```

### 6. Organize by Wave
Groups gap plans by dependencies:

```
Wave 1 (Independent):
- gap-1-PLAN.md (auth fix)
- gap-3-PLAN.md (N+1 query)

Wave 2 (Depends on Wave 1):
- gap-2-PLAN.md (webhook, needs auth working)

Wave 3 (Final verification):
- gap-4-PLAN.md (error handling)
```

### 7. Update STATE.md
Records gap closure phase:

```markdown
## Current Position
- **Phase**: {N} (Gap Closure)
- **Type**: Maintenance
- **Origin**: {milestone} audit/verification

## Gap Closure
Addressing {M} gaps from {milestone}:
- Critical: {X}
- High: {Y}
- Medium: {Z}
```

### 8. Commit
```bash
git add .gsd/ROADMAP.md .gsd/phases/{N}/
git commit -m "docs: create gap closure plans for {milestone}"
```

### 9. Display Summary
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► GAP PLANS CREATED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase {N}: Gap Closure

Created:
- {M} gap fix plans
- {W} execution waves
- Verification for each gap

───────────────────────────────────────────────────────

SUMMARY

Critical: {X} plans
High: {Y} plans
Medium: {Z} plans

Total estimated tasks: {T}

───────────────────────────────────────────────────────

▶ NEXT

/execute {N} --gaps-only — Fix all gaps

Or execute wave-by-wave:
/execute {N} → Runs Wave 1, then 2, then 3

───────────────────────────────────────────────────────
```

## Example Usage

After audit finds gaps:
```
/plan-milestone-gaps
```

Specify milestone:
```
/plan-milestone-gaps v1.0
```

## Example Scenario

**After Phase 2 verification:**

Failed verification: Authentication broken on iOS

```
/plan-milestone-gaps

Gaps identified:
🔴 Auth fails on iOS Safari
🟡 Missing mobile browser tests

Creates:
- Phase 4: Gap Closure
- gap-1-PLAN.md: Fix iOS Safari auth
- gap-2-PLAN.md: Add mobile browser tests

Ready to:
/execute 4 --gaps-only
```

## Gap Plan vs Regular Plan

**Gap Plans:**
- Focus on fixing specific issue
- Include root cause analysis
- Always include regression prevention
- Reference original verification
- Marked with `gap_closure: true`

**Regular Plans:**
- Build new functionality
- Forward-looking
- May not have existing tests to fix

## Best Practices

- **Fix critical first** - Priority order matters
- **Add tests** - Prevent same gap recurring
- **Root cause** - Don't just patch symptoms
- **Document why** - Explain how gap happened
- **Verify thoroughly** - Run original failed verification

## Integration with Workflows

```
/verify 2 → finds gaps
→ /plan-milestone-gaps → creates fix plans
→ /execute 4 --gaps-only → fixes gaps
→ /verify 4 → confirms fixed
```

## Reference

Full workflow: `.agent/workflows/plan-milestone-gaps.md`
Related:
- `/audit-milestone` - Identify gaps
- `/verify` - Find verification failures
- `/execute --gaps-only` - Fix gaps
