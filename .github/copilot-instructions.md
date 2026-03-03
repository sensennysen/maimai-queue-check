# Maimai Queue Management System

This is a React-based queue management system for maimai rhythm game sessions. Players can manage queues for games with the following features:

## Features
- Add new queue entries with Player 1 and Player 2 names
- Edit existing queue entries
- Reorder queue entries (move up/down)
- Remove individual entries from queue
- Clear entire queue
- Real-time visual feedback for next player up

## Project Structure
- Built with React + Vite for fast development
- Component-based architecture
- Responsive design for mobile and desktop
- Clean, modern UI with maimai-inspired styling

## Components
- QueueManager: Main container component with state management
- QueueForm: Form for adding/editing entries with validation
- QueueList: Display container for the queue
- QueueItem: Individual queue entry with controls

## Development
Use `npm run dev` to start the development server.
The application will be available at http://localhost:5173/

---

## GSD Development Protocol

This project follows the **Get Shit Done (GSD)** methodology for disciplined, high-quality development. Full documentation in [PROJECT_RULES.md](../PROJECT_RULES.md).

### Core Workflow

**SPEC → PLAN → EXECUTE → VERIFY → COMMIT**

1. **SPEC**: Define requirements in `.gsd/SPEC.md` (must be FINALIZED before coding)
2. **PLAN**: Decompose into phases in `.gsd/ROADMAP.md`, then create detailed PLAN.md files
3. **EXECUTE**: Implement with atomic commits per task
4. **VERIFY**: Prove completion with empirical evidence
5. **COMMIT**: Format: `type(scope): description`

### Key Principles

**Planning Lock**: Never write implementation code until `.gsd/SPEC.md` status is `FINALIZED`.

**Proof Requirements**: Every change requires verification evidence:
- API endpoint → curl/HTTP response output
- UI change → Screenshot or visual confirmation
- Build/compile → Command output showing success
- Test → Test runner output
- Config → Verification command result

**Search-First Discipline**: Before reading any file completely:
1. Search first using grep/ripgrep/IDE search
2. Evaluate snippets to determine if full read is needed
3. Use targeted reads of specific line ranges only

**Wave Execution**: Group related tasks by dependencies, execute waves sequentially, but tasks within a wave can be parallel.

### File References

- **Canonical Rules**: [PROJECT_RULES.md](../PROJECT_RULES.md)
- **Writing Style**: [GSD-STYLE.md](../GSD-STYLE.md)
- **Feature Tracking**: [FEATURES.md](../FEATURES.md)
- **Workflows**: `.agent/workflows/*.md` (can use `/workflow-name` in Copilot Chat)
- **Skills**: `.agent/skills/*/SKILL.md` (specialized behaviors)

### Quality Standards

- No "trust me, it works" - require empirical proof
- Context is limited - prevent degradation through search-first approach
- Plans are prompts - PLAN.md files ARE the execution instructions
- One task = one commit with conventional format