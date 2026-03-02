---
description: Create detailed execution plans for a phase
---

# Plan Phase

Decompose a roadmap phase into executable PLAN.md files with task breakdown and verification criteria.

## What This Does

1. **Validates** that `.gsd/SPEC.md` is FINALIZED (Planning Lock)
2. **Loads** phase definition from `.gsd/ROADMAP.md`
3. **Researches** external dependencies if needed
4. **Creates** detailed PLAN.md files with tasks and context
5. **Verifies** plans meet quality standards
6. **Iterates** until plans pass verification (max 3 attempts)

## Arguments

- **Phase number**: Optional (auto-detects next unplanned phase if not provided)
- **--research**: Force re-research even if RESEARCH.md exists
- **--skip-research**: Skip research, go straight to planning
- **--gaps**: Gap closure mode (reads VERIFICATION.md, creates fix plans)

## Planning Philosophy

### Plans Are Prompts
PLAN.md files are NOT documents that get transformed. They ARE the execution instructions containing:
- **Objective**: What and why
- **Context**: @file references to relevant code
- **Tasks**: With verification criteria
- **Success criteria**: Measurable outcomes

### Aggressive Atomicity
Each plan: **2-3 tasks maximum**. Break complex work into multiple plans.

### Quality Degradation Awareness
Plans should complete within ~50% context budget. If more scope is needed, create more plans with smaller scope.

## Planning Flow

### 1. Validate Environment
- Check `.gsd/SPEC.md` exists and status is `FINALIZED`
- Check `.gsd/ROADMAP.md` exists with phases defined
- Determine target phase (from args or auto-detect)

### 2. Research Phase (if needed)
Determine discovery level:
- **Level 0 (Skip)**: Pure internal work, no new dependencies
- **Level 1 (Quick)**: Single known library, quick verification
- **Level 2 (Standard)**: Choosing between options, create RESEARCH.md
- **Level 3 (Deep)**: Architectural decision, comprehensive research

### 3. Create Plans
For the phase:
1. Break down into 2-3 task plans
2. Each plan gets its own `{N}-PLAN.md` file
3. Include:
   - Clear objective
   - Context files to reference
   - Task list with verification
   - Success criteria
   - Dependencies on other plans

### 4. Verify Plans
Check each plan:
- Has clear objective
- Tasks are specific and actionable
- Verification criteria defined
- Context references are valid
- Scope is appropriate (2-3 tasks)

### 5. Iterate if Needed
If verification fails:
- Identify specific issues
- Refine plans
- Re-verify
- Max 3 iterations

## Plan Structure Template

```markdown
# {Plan Name}

## Objective
{What this plan achieves and why it matters}

## Context
@.gsd/SPEC.md
@src/components/Component.jsx
@src/utils/helper.js

## Tasks

### Task 1: {Description}
**What**: {Specific action}
**Verify**: {How to prove it works}
**Files**: {Files to modify}

### Task 2: {Description}
**What**: {Specific action}
**Verify**: {How to prove it works}
**Files**: {Files to modify}

## Success Criteria
- [ ] {Measurable outcome 1}
- [ ] {Measurable outcome 2}

## Dependencies
- Requires: {other plan numbers, if any}
- Blocks: {plans that depend on this}
```

## Example Usage

Plan next unplanned phase:
```
/plan
```

Plan specific phase with research:
```
/plan 3 --research
```

Create gap closure plans after verification:
```
/plan 2 --gaps
```

## Reference

Full workflow details: `.agent/workflows/plan.md`
