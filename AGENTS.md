# Agentic Workflow & Skills

This document serves as the central hub for the agent's operation, combining workflows, available skills, and self-improvement protocols.

## Agentic Feature Request Workflow

When tackling a feature request, the agent MUST follow these five phases, aligned with the **GSD Protocol**:

> **IMPORTANT**: The agent must always explicitly state which phase (SPEC, PLAN, EXECUTE, VERIFY, COMMIT) the development is currently in.

### 1. SPEC (Inquiry)
**Goal**: Deeply understand requirements and define the "what".
- Ask clarifying questions.
- Define requirements in `.gsd/SPEC.md` until status is `FINALIZED`.
- **Exit Condition**: Clear, unambiguous understanding of requirements.

### 2. PLAN
**Goal**: Define "how" the feature will be built.
- Decompose request into logical phases in `.gsd/ROADMAP.md`.
- Create/Update `implementation_plan.md`.
- **User Confirmation Required**: Must get approval before Execution.

### 3. EXECUTE
**Goal**: Implement the feature.
- Execute logically grouped tasks (waves).
- **Utilize Skills**: Refer to "Available Skills" below.
- **Phase Checkpoints**: Verify work before moving to next phase.

### 4. VERIFY
**Goal**: Prove completion with evidence.
- Verify changes with tests, screenshots, or command output.
- **Never accept**: "It looks correct". Always require proof.

### 5. COMMIT (Confirmation)
**Goal**: Finalize the work.
- Commit changes with `type(scope): description` format.
- Update `STATE.md` and feature tracking logs.
- **Exit Condition**: User explicitly confirms the feature is done.

---

## Available Skills

The following skills are available in the codebase. The agent should reference these to ensure high-quality implementation.

### Frontend Design
- **Path**: [.agent/skills/frontend-design/SKILL.md](.agent/skills/frontend-design/SKILL.md)
- **Description**: Create distinctive, production-grade frontend interfaces with high design quality. Use this when building web components, pages, or applications to avoid generic aesthetics.

### React + Vite Best Practices
- **Path**: [.agent/skills/react-vite-best-practices/SKILL.md](.agent/skills/react-vite-best-practices/SKILL.md)
- **Description**: Performance optimization guidelines for React applications built with Vite. Covers build optimization, code splitting, asset handling, and more.

### Security Review
- **Path**: [.agent/skills/security-review/SKILL.md](.agent/skills/security-review/SKILL.md)
- **Description**: Security checklist and patterns for authentication, user input handling, secrets management, and API security. Must be used when touching sensitive features.

### Supabase Postgres Best Practices
- **Path**: [.agent/skills/supabase-postgres-best-practices/SKILL.md](.agent/skills/supabase-postgres-best-practices/SKILL.md)
- **Description**: Postgres performance optimization and schema design best practices. Critical for SQL queries, indexing, and RLS policies.

### Vercel React Best Practices
- **Path**: [.agent/skills/vercel-react-best-practices/SKILL.md](.agent/skills/vercel-react-best-practices/SKILL.md)
- **Description**: Optimization guidelines for React and Next.js applications, focusing on eliminating waterfalls, bundle size, and server-side performance.

---

## Self-Improvement Protocol

The agent is an adaptive system that learns from failures and successes.

### 2. Self-Anneal when things break
- **Read**: Carefully analyze error messages and stack traces.
- **Fix**: Correct the script or code and test it again.
  - *Note*: If the fix involves paid tokens/credits, check with the user first.
- **Update**: Update the relevant directive/skill with what you learned (e.g., API limits, edge cases, timing issues).
- **Example**: If you hit an API rate limit, research batch endpoints, rewrite the script, test it, and then update the directive to prevent future occurrences.

### 3. Update directives as you learn
- Directives are **living documents**.
- When you discover better approaches, common errors, or new constraints, **update the directive**.
- **Rule**: Do not create or overwrite directives without asking unless explicitly told to.
- **Goal**: Continuously improve the instruction set so the system becomes stronger over time.

### Self-Annealing Loop
1.  **Fix it**: Resolve the immediate error.
2.  **Update the tool**: Modify the tool/script to handle the case.
3.  **Test tool**: Ensure it works reliably.
4.  **Update directive**: document the new flow/fix in the directive.
5.  **Result**: The system is now stronger.

## Directives

- [GEMINI.md](file:///e:/git/smf-queue-check/adapters/GEMINI.md) — Gemini-specific GSD protocol adapter.
