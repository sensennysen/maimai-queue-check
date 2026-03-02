---
description: Show all available GSD commands
---

# Help

Display all available GSD workflow commands with descriptions and usage hints.

## Available Commands

### Core Workflow
- `/map` - Analyze codebase → ARCHITECTURE.md
- `/plan [N]` - Create execution plans for phase N
- `/execute [N]` - Wave-based execution with atomic commits
- `/verify [N]` - Validate work with empirical proof
- `/debug [issue]` - Systematic hypothesis-driven debugging

### Project Setup
- `/new-project` - Initialize with deep questioning → SPEC.md
- `/new-milestone` - Create milestone with phases
- `/complete-milestone` - Archive completed milestone
- `/audit-milestone` - Review milestone quality

### Phase Management
- `/add-phase` - Add phase to end of roadmap
- `/insert-phase` - Insert phase (renumbers subsequent)
- `/remove-phase` - Remove phase (with safety checks)
- `/discuss-phase` - Clarify scope before planning
- `/research-phase` - Deep technical research
- `/list-phase-assumptions` - Surface planning assumptions
- `/plan-milestone-gaps` - Create gap closure plans

### Navigation & State
- `/progress` - Show current position in roadmap
- `/pause` - Save state for session handoff
- `/resume` - Restore from last session
- `/add-todo` - Quick capture idea
- `/check-todos` - List pending items

### Utilities
- `/update` - Update GSD to latest version
- `/install` - Install GSD into project
- `/web-search` - Search web for information
- `/whats-new` - Show recent changes
- `/help` - Show this help

## Quick Start Guide

```
1. /new-project      → Initialize with deep questioning
2. /plan 1           → Create Phase 1 plans
3. /execute 1        → Implement Phase 1
4. /verify 1         → Confirm it works
5. Repeat for next phases
```

## Core GSD Rules

**🔒 Planning Lock**
No implementation code until SPEC.md status is `FINALIZED`

**💾 State Persistence**
Update STATE.md after every significant task

**🧹 Context Hygiene**
After 3 failures → state dump → fresh session

**✅ Empirical Validation**
Proof required for every change - no "it should work"

**🔍 Search-First**
Before reading files: search → evaluate → targeted read

**🌊 Wave Execution**
Group tasks by dependencies, execute waves sequentially

## File Structure

```
.gsd/
├── SPEC.md              # Requirements (FINALIZED status)
├── ROADMAP.md           # Phase definitions
├── STATE.md             # Current position
├── ARCHITECTURE.md      # System design (brownfield)
├── STACK.md             # Technology inventory
├── DECISIONS.md         # Decision log
├── JOURNAL.md           # Session log
├── TODO.md              # Todo items
└── phases/              # Phase execution
    └── {N}/
        ├── 1-PLAN.md
        ├── 2-PLAN.md
        ├── 1-SUMMARY.md
        └── VERIFICATION.md
```

## Commit Format

```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- refactor: Code restructure
- test: Tests
- chore: Maintenance
```

## Documentation

- **Canonical Rules**: [PROJECT_RULES.md](../PROJECT_RULES.md)
- **Writing Style**: [GSD-STYLE.md](../GSD-STYLE.md)
- **Features**: [FEATURES.md](../FEATURES.md)
- **Full Workflows**: `.agent/workflows/*.md`
- **Skills**: `.agent/skills/*/SKILL.md`
- **Integration Guide**: [.github/GSD-COPILOT-GUIDE.md](.github/GSD-COPILOT-GUIDE.md)

## Getting Started

New to GSD? Start here:
1. Read [PROJECT_RULES.md](../PROJECT_RULES.md) for core methodology
2. Run `/new-project` to initialize your project
3. Use `/progress` to check status anytime
4. Use `/help` to see all commands

## Reference

Full workflow: `.agent/workflows/help.md`
