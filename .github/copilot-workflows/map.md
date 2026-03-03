---
description: Analyze existing codebase structure and create architecture docs
---

# Map Codebase

Analyze the existing codebase to understand structure, patterns, and technical debt. Essential for brownfield projects.

## What This Does

1. **Scans project structure** - Identifies directories and components
2. **Analyzes dependencies** - Reads package.json, requirements.txt, etc.
3. **Maps data flow** - Traces key integration points
4. **Identifies patterns** - Recognizes frameworks and conventions
5. **Documents findings** - Creates ARCHITECTURE.md and STACK.md
6. **Flags technical debt** - Notes areas needing attention

## When to Use

- **Before planning** on existing codebases
- When taking over a project
- Before major refactoring
- To understand unfamiliar code

## Creates These Files

```
.gsd/
├── ARCHITECTURE.md    # System design and structure
└── STACK.md          # Technology inventory
```

## Process Flow

### 1. Project Structure Analysis
Scans directories:
- Source code locations (`src/`, `lib/`, `app/`)
- Test directories (`tests/`, `__tests__/`, `spec/`)
- Configuration files
- Asset directories
- Build outputs

### 2. Dependency Analysis
Reads package manifests:
- `package.json` (Node.js)
- `requirements.txt` (Python)
- `Cargo.toml` (Rust)
- `go.mod` (Go)
- `pom.xml` (Java)
- etc.

Catalogs:
- Runtime dependencies
- Dev dependencies
- Versions
- License info (if available)

### 3. Component Detection
Identifies:
- Frontend framework (React, Vue, Svelte, etc.)
- Backend framework (Express, Django, Rails, etc.)
- Database type
- API patterns (REST, GraphQL, etc.)
- State management
- Build tools

### 4. Entry Points
Finds main files:
- Application entry (main.js, app.py, etc.)
- Route definitions
- Configuration entry
- Build scripts

### 5. Data Flow Mapping
Traces:
- How data enters the system
- Processing pipelines
- Storage mechanisms
- External integrations
- API endpoints

### 6. Pattern Recognition
Identifies:
- Code organization style
- Naming conventions
- Testing patterns
- Error handling approach
- Configuration management

### 7. Technical Debt Detection
Flags:
- Outdated dependencies
- Security vulnerabilities
- Code duplication
- Missing tests
- TODO/FIXME comments
- Complex/long files

## Output: ARCHITECTURE.md

```markdown
# Architecture Documentation

## System Overview
{High-level description}

## Technology Stack
See STACK.md for complete inventory.

**Core:**
- Frontend: {framework} {version}
- Backend: {framework} {version}
- Database: {type} {version}

## Project Structure
```
{directory tree}
```

## Entry Points
- Main: {file}
- Routes: {file}
- Config: {file}

## Component Map

### Frontend
{Components and their relationships}

### Backend
{Services and modules}

### Database
{Schema overview}

## Data Flow
{How data moves through the system}

## Integration Points
- {External API 1}
- {External service 2}

## Patterns & Conventions
{Identified code patterns}

## Technical Debt
{Areas needing attention}

## Recommendations
{Suggestions for planning}
```

## Output: STACK.md

```markdown
# Technology Stack

## Runtime Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| {name} | {version} | {usage} |

## Development Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| {name} | {version} | {usage} |

## Infrastructure
- Hosting: {provider}
- CI/CD: {platform}
- Monitoring: {tool}

## Versions
- Node: {version}
- npm: {version}
- {runtime}: {version}
```

## Example Usage

Map the codebase:
```
/map
```

Then review the generated documentation before planning.

## Next Steps After Mapping

1. Review ARCHITECTURE.md
2. Check STACK.md for outdated deps
3. Run `/new-project` to initialize GSD
4. Use architecture context in planning

## Best Practices

- **Run before planning** - Context prevents mistakes
- **Update regularly** - Re-map after major changes
- **Share with team** - Architecture docs help onboarding
- **Use in plans** - Reference ARCHITECTURE.md in PLAN.md files

## Reference

Full workflow: `.agent/workflows/map.md`
Related skill: `.agent/skills/codebase-mapper/SKILL.md`
