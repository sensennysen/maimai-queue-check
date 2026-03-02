# GSD Copilot Integration Guide

This guide explains how to use the GSD (Get Shit Done) protocol with GitHub Copilot in VS Code and other editors.

## Quick Start

The GSD protocol is now integrated with GitHub Copilot through:
1. **Copilot Instructions** - Automatic context loaded for all interactions
2. **Copilot Workflows** - Slash commands for GSD workflows

## Available Workflows

Use these commands in GitHub Copilot Chat (VS Code, CLI, or web):

### `/execute [phase-number]`
Execute all plans in a phase with wave-based execution.

**Examples**:
- `/execute 2` - Execute phase 2
- `/execute 3 --gaps-only` - Execute only gap closure plans

**What it does**:
- Validates phase exists
- Groups plans by dependency waves
- Executes with empirical verification
- Creates atomic commits per task
- Updates state and features

### `/plan [phase-number]`
Create detailed execution plans for a phase.

**Examples**:
- `/plan` - Plan next unplanned phase
- `/plan 3 --research` - Plan with forced research
- `/plan 2 --gaps` - Create gap closure plans

**What it does**:
- Validates SPEC is finalized
- Researches dependencies if needed
- Creates PLAN.md files (2-3 tasks each)
- Verifies plans meet standards
- Iterates until quality checks pass

### `/verify [phase-number]`
Validate work against spec with empirical evidence.

**Examples**:
- `/verify 2` - Verify phase 2 implementation

**What it does**:
- Extracts must-have requirements
- Executes verification commands
- Collects proof (output, screenshots)
- Creates verification report
- Generates gap closure plans if needed

### `/debug [issue-description]`
Systematic debugging with hypothesis-driven approach.

**Examples**:
- `/debug Login button not responding`
- `/debug` - Resume existing debug session

**What it does**:
- Documents symptom clearly
- Gathers evidence before theorizing
- Forms and tests hypotheses
- Records attempts to prevent loops
- Implements fix with verification

## Using in Different Editors

### VS Code
1. Open GitHub Copilot Chat (Ctrl+Shift+I / Cmd+Shift+I)
2. Type `/` to see available workflows
3. Select a workflow or type the command

### GitHub CLI
```bash
gh copilot explain "/execute 2"
```

### Web (github.com)
Use Copilot in GitHub.com chat interface with same commands.

## GSD Protocol Overview

The GSD methodology follows this workflow:

```
SPEC → PLAN → EXECUTE → VERIFY → COMMIT
```

### Core Principles

**Planning Lock**: Never write code until `.gsd/SPEC.md` status is `FINALIZED`.

**Proof Requirements**: Every change needs empirical evidence:
- API endpoint → curl/HTTP response
- UI change → Screenshot
- Build/compile → Command output
- Test → Test runner results

**Search-First**: Before reading files:
1. Search first (grep/IDE search)
2. Evaluate snippets
3. Use targeted reads only

**Wave Execution**: Group tasks by dependencies, execute waves sequentially.

**Atomic Commits**: One task = one commit with format: `type(scope): description`

## File Structure

```
.gsd/
├── SPEC.md              # Requirements (must be FINALIZED)
├── ROADMAP.md           # Phase definitions
├── STATE.md             # Current position
├── phases/              # Phase execution folders
│   └── {N}/
│       ├── 1-PLAN.md    # Plan 1 for phase N
│       ├── 2-PLAN.md    # Plan 2 for phase N
│       ├── 1-SUMMARY.md # Execution summary
│       └── VERIFICATION.md

.agent/
├── workflows/           # Full GSD workflows
└── skills/              # Specialized behaviors

.github/
├── copilot-instructions.md    # Auto-loaded context
└── copilot-workflows/         # Slash commands
    ├── execute.md
    ├── plan.md
    ├── verify.md
    └── debug.md
```

## Quality Standards

### Evidence Requirements

| Change Type | Required Proof |
|------------|----------------|
| API endpoint | `curl` output or HTTP test response |
| UI change | Screenshot or visual confirmation |
| Build/compile | Successful build command output |
| Test | Test runner output showing pass |
| Config | Verification command result |

### Commit Format

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

## Tips for Success

1. **Start with SPEC**: Always finalize requirements first
2. **Small Plans**: Keep plans to 2-3 tasks maximum
3. **Verify Everything**: Get proof for every change
4. **Use Search First**: Don't read entire files unnecessarily
5. **Trust the Process**: SPEC → PLAN → EXECUTE → VERIFY

## Reference Files

- **Canonical Rules**: [PROJECT_RULES.md](../PROJECT_RULES.md)
- **Writing Style**: [GSD-STYLE.md](../GSD-STYLE.md)
- **Feature Tracking**: [FEATURES.md](../FEATURES.md)
- **Full Workflows**: `.agent/workflows/*.md`
- **Skills**: `.agent/skills/*/SKILL.md`

## Getting Help

Ask GitHub Copilot:
- "Explain the GSD workflow"
- "How do I create a SPEC?"
- "What's the difference between plan and execute?"
- "Show me an example PLAN.md"

Or reference the canonical documentation in PROJECT_RULES.md for complete details.
