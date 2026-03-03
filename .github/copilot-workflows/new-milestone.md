---
description: Create a new milestone with phases
---

# New Milestone

Define a new milestone with goal, phases, and success criteria.

## What This Does

1. **Gathers milestone info** - Name, goal, must-haves, nice-to-haves
2. **Generates phase breakdown** - Suggests logical phase structure
3. **Updates ROADMAP.md** - Adds milestone section
4. **Updates STATE.md** - Records new milestone
5. **Commits changes** - Atomic commit for milestone

## Arguments

- **Milestone name**: e.g., "v2.0", "MVP", "Beta Release"

## When to Use

- Starting a new major version
- Beginning a new feature set
- After completing previous milestone

## Process Flow

### 1. Validation
Checks `.gsd/SPEC.md` exists:
- If not → Error: Run `/new-project` first
- If yes → Continue

### 2. Gather Information
Asks for:

**Name**: Milestone identifier
- Examples: "v1.0", "MVP", "Public Beta"

**Goal**: What does this milestone achieve?
- Example: "Launch core playlist sharing features"

**Must-Haves**: Non-negotiable deliverables
- Example: "User authentication, playlist CRUD, share links"

**Nice-to-Haves**: Optional if time permits
- Example: "Social features, comments, likes"

### 3. Generate Phase Breakdown
Suggests logical phases based on goal:

```markdown
## Suggested Phases

Phase 1: Foundation/Setup
Phase 2: Core Feature A
Phase 3: Core Feature B
Phase 4: Integration/Polish
Phase 5: Verification/Launch
```

User can confirm or modify.

### 4. Update ROADMAP.md
Adds milestone structure:

```markdown
# ROADMAP.md

> **Current Milestone**: {name}
> **Goal**: {goal}

## Must-Haves
- [ ] {must-have 1}
- [ ] {must-have 2}

## Nice-to-Haves
- [ ] {nice-to-have 1}

## Phases

### Phase 1: {name}
**Status**: ⬜ Not Started
**Objective**: {description}
**Depends on**: None

### Phase 2: {name}
**Status**: ⬜ Not Started
**Objective**: {description}
**Depends on**: Phase 1

...
```

### 5. Update STATE.md
Records milestone:

```markdown
## Current Position
- **Milestone**: {name}
- **Phase**: Not started
- **Status**: Milestone planned
```

### 6. Commit
```bash
git add .gsd/ROADMAP.md .gsd/STATE.md
git commit -m "docs: create milestone {name}"
```

### 7. Next Steps
Suggests:
```
/plan 1 — Create execution plans for Phase 1
```

## Example Usage

Create a new milestone:
```
/new-milestone v2.0
```

Then answer the prompts for goal, must-haves, etc.

## Milestone Hierarchy

```
Project (SPEC.md)
└── Milestone (ROADMAP.md section)
    └── Phase 1, 2, 3...
        └── Plans (1-PLAN.md, 2-PLAN.md)
            └── Tasks
```

## Best Practices

- **Clear goals**: Make milestone goals measurable
- **Right-sized phases**: 3-7 phases per milestone
- **Dependencies clear**: Each phase knows what it needs
- **Must vs nice**: Be honest about priorities

## Reference

Full workflow: `.agent/workflows/new-milestone.md`
