# Agentic Workflow & Skills

This document serves as the central hub for the agent's operation, combining workflows, available skills, and self-improvement protocols.

## Agentic Feature Request Workflow

When tackling a feature request, the agent MUST follow these four phases:

> **IMPORTANT**: The agent must always explicitly state which phase (Inquiry, Planning, Execution, Confirmation) the development is currently in.

### 1. Inquiry
**Goal**: Deeply understand the user's requirements and context.
- Ask clarifying questions about the feature's purpose, scope, and desired behavior.
- Identify any constraints or preferences (e.g., design aesthetics, specific libraries).
- **Exit Condition**: You have a clear, unambiguous understanding of *what* needs to be built.

### 2. Planning
**Goal**: Define *how* the feature will be built.
- Decompose the request into logical, manageable phases.
- Determine the number of phases required.
- Create an implementation plan (e.g., in `implementation_plan.md` or as a task list).
- **User Confirmation Required**: You MUST get user approval on the plan before proceeding to Execution.

### 3. Execution
**Goal**: Implement the feature according to the plan.
- Execute each phase sequentially.
- **Utilize Skills**: Refer to the "Available Skills" section below to apply best practices and specialized knowledge.
- **Phase Checkpoints**: Ask the user if the current phase is done before proceeding to the next one, unless the plan explicitly allows for continuous execution.

### 4. Confirmation
**Goal**: Verify the feature satisfies the user's request.
- Confirm with the user that the feature is working as expected.
- If issues are found, return to Execution (or Planning if the scope changes).
- **Exit Condition**: The user explicitly confirms the feature request is "done".

---

## Available Skills

The following skills are available in the codebase. The agent should reference these to ensure high-quality implementation.

### Frontend Design
- **Path**: [.agents/skills/frontend-design/SKILL.md](.agents/skills/frontend-design/SKILL.md)
- **Description**: Create distinctive, production-grade frontend interfaces with high design quality. Use this when building web components, pages, or applications to avoid generic aesthetics.

### React + Vite Best Practices
- **Path**: [.agents/skills/react-vite-best-practices/SKILL.md](.agents/skills/react-vite-best-practices/SKILL.md)
- **Description**: Performance optimization guidelines for React applications built with Vite. Covers build optimization, code splitting, asset handling, and more.

### Security Review
- **Path**: [.agents/skills/security-review/SKILL.md](.agents/skills/security-review/SKILL.md)
- **Description**: Security checklist and patterns for authentication, user input handling, secrets management, and API security. Must be used when touching sensitive features.

### Supabase Postgres Best Practices
- **Path**: [.agents/skills/supabase-postgres-best-practices/SKILL.md](.agents/skills/supabase-postgres-best-practices/SKILL.md)
- **Description**: Postgres performance optimization and schema design best practices. Critical for SQL queries, indexing, and RLS policies.

### Vercel React Best Practices
- **Path**: [.agents/skills/vercel-react-best-practices/SKILL.md](.agents/skills/vercel-react-best-practices/SKILL.md)
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
(Link to or list specific directives here as they are created)
