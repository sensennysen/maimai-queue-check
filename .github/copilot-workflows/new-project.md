---
description: Initialize a new GSD project with deep questioning
---

# New Project

Initialize a new project through unified flow: questioning → research → requirements → roadmap.

## What This Does

1. **Validates** - Checks if project already exists
2. **Detects brownfield** - Identifies existing code
3. **Deep questioning** - Gathers complete project context
4. **Research** - Optional deep dive on unknowns
5. **Creates SPEC.md** - Complete requirements document
6. **Creates ROADMAP.md** - Phase breakdown
7. **Initializes state** - Sets up `.gsd/STATE.md`

## When to Use

- Starting a brand new project
- Adding GSD to an existing codebase
- Beginning a major feature milestone

## Creates These Files

```
.gsd/
├── SPEC.md              # Requirements (status: FINALIZED)
├── ROADMAP.md           # Phase structure
├── STATE.md             # Project memory
├── ARCHITECTURE.md      # System design (if brownfield)
├── DECISIONS.md         # Decision log
└── JOURNAL.md           # Session log
```

## Process Flow

### 1. Validation
Checks for existing `.gsd/SPEC.md`:
- If exists → Error, use `/progress` instead
- If not → Continue

Initializes git if needed.

### 2. Brownfield Detection
Scans for existing code:
- Looks for source files (*.ts, *.js, *.py, etc.)
- Checks for package.json, requirements.txt, etc.
- If found → Offers to run `/map` first
- If not → Continue to questioning

### 3. Deep Questioning
Gathers comprehensive context:

**Core Questions:**
- What problem does this solve?
- Who are the users?
- What's the primary goal?
- What exists already?

**Technical Questions:**
- Tech stack preferences?
- Deployment target?
- Scale requirements?
- External integrations?

**Constraints:**
- Timeline?
- Budget?
- Must-have vs nice-to-have?
- Known limitations?

### 4. Discovery Level
Determines research needs:
- **Level 0**: Pure internal work, no research
- **Level 1**: Quick verification (2-5 min)
- **Level 2**: Standard research (15-30 min)
- **Level 3**: Deep dive (1+ hour)

### 5. Creates SPEC.md
Generates complete specification:

```markdown
---
status: FINALIZED
created: {date}
---

# Project: {Name}

## Overview
{Clear problem statement and solution}

## Goals
{Measurable objectives}

## Users
{Who will use this}

## Requirements

### Must-Have
- {Critical requirement 1}
- {Critical requirement 2}

### Nice-to-Have
- {Optional feature 1}
- {Optional feature 2}

## Technical Constraints
{Stack, deployment, integrations}

## Out of Scope
{What we explicitly won't do}

## Success Criteria
{How we measure completion}
```

### 6. Creates ROADMAP.md
Breaks project into phases:

```markdown
# ROADMAP.md

> **Current Milestone**: {name}

## Must-Haves
- [ ] {deliverable 1}
- [ ] {deliverable 2}

## Phases

### Phase 1: {Foundation}
**Status**: ⬜ Not Started
**Objective**: {description}

### Phase 2: {Core Feature}
**Status**: ⬜ Not Started
**Objective**: {description}

...
```

### 7. Next Steps
Commits all files and suggests:
```
/plan 1 — Create execution plans for Phase 1
```

## Example Usage

Initialize new project:
```
/new-project
```

Then answer the deep questioning prompts.

## Quality Standards

**Planning Lock Applied**: SPEC.md created with `status: FINALIZED`, enforcing no code until planning is complete.

**Comprehensive Context**: Deep questioning prevents scope creep and missed requirements.

**Brownfield Support**: Existing codebases get proper architecture mapping.

## Reference

Full workflow: `.agent/workflows/new-project.md`
