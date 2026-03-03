---
description: Discuss phase scope and approach before planning
---

# Discuss Phase

Interactive discussion about a phase to clarify scope, approach, and concerns before creating detailed plans.

## What This Does

1. **Loads phase context** - Reads phase from ROADMAP.md
2. **Analyzes requirements** - Extracts what needs clarification
3. **Presents discussion points** - Structured questions
4. **Gathers input** - User decisions and preferences
5. **Documents decisions** - Records in DECISIONS.md
6. **Ready for planning** - Phase scope is now clear

## Arguments

- **Phase number**: e.g., `3` to discuss Phase 3

## When to Use

**Run BEFORE `/plan` when:**
- Phase scope is unclear
- Multiple implementation approaches exist
- Trade-offs need user input
- Dependencies are complex
- Assumptions need validation
- Team alignment needed

## Process Flow

### 1. Load Phase Context
Reads from ROADMAP.md:
- Phase objective
- Phase dependencies
- Current status

### 2. Analyze Requirements
From phase objective, extract:
- What needs to be built
- What constraints exist
- What decisions need to be made
- What assumptions exist

### 3. Present Discussion Points
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► DISCUSS PHASE {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase: {name}
Objective: {objective}

───────────────────────────────────────────────────────

1. SCOPE CLARIFICATION

Questions:
• {scope question 1}
  → User's answer

• {scope question 2}
  → User's answer

Boundaries:
• What's IN scope: {items}
• What's OUT of scope: {items}

───────────────────────────────────────────────────────

2. IMPLEMENTATION APPROACH

We could implement this {N} ways:

Option A: {approach description}
  Pros: {benefits}
  Cons: {drawbacks}

Option B: {approach description}
  Pros: {benefits}
  Cons: {drawbacks}

Which approach do you prefer and why?
→ User's decision and rationale

───────────────────────────────────────────────────────

3. DEPENDENCIES & INTEGRATION

Required from previous phases:
• {dependency 1} from Phase {N}
• {dependency 2} from Phase {M}

Gaps in prerequisites:
• {gap if any}

How should we handle: {integration concern}
→ User's decision

───────────────────────────────────────────────────────

4. CONCERNS & RISKS

Potential issues:
• {risk 1}: {mitigation strategy}
• {risk 2}: {mitigation strategy}

Should we: {risk management question}
→ User's decision

───────────────────────────────────────────────────────

5. TECHNICAL DECISIONS

Need to decide:
• {technology choice}: {options}
• {architecture choice}: {options}
• {pattern choice}: {options}

→ User makes choices

───────────────────────────────────────────────────────
```

### 4. Gather User Input
Listens for:
- Scope decisions
- Approach preferences
- Technical choices
- Risk tolerance
- Priority trade-offs

### 5. Document Decisions
Updates `.gsd/DECISIONS.md`:

```markdown
## Phase {N} Planning Discussion — {date}

### Scope Decisions
- **{Decision}**: {choice and rationale}
- **{Decision}**: {choice and rationale}

### Approach Selected
**{Selected approach}**

Rationale: {why this was chosen}

Alternatives considered:
- {option}: {why not chosen}

### Technical Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| {tech choice} | {selected} | {why} |

### Dependencies Confirmed
- {dependency}: {how it will be handled}

### Risks Acknowledged
- {risk}: {mitigation plan}

### Out of Scope
- {item}: {why excluded}
```

### 6. Create Phase Brief
Creates `.gsd/phases/{N}/BRIEF.md`:

```markdown
# Phase {N}: {name} — Planning Brief

**Discussed**: {date}

## Objective
{refined objective after discussion}

## Scope

### In Scope
- {item 1}
- {item 2}

### Out of Scope
- {item 1}
- {item 2}

## Approach
{selected implementation approach}

## Key Decisions
1. {decision 1}
2. {decision 2}

## Dependencies
- Requires: {items from previous phases}
- Provides: {items for future phases}

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| {risk} | {plan} |

## Ready for /plan
Scope is clear. All decisions documented.
```

### 7. Confirm Ready
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► PHASE DISCUSSION COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase {N}: {name}

Decisions documented:
- .gsd/DECISIONS.md
- .gsd/phases/{N}/BRIEF.md

───────────────────────────────────────────────────────

▶ NEXT

/plan {N} — Create detailed execution plans

───────────────────────────────────────────────────────
```

## Example Usage

Discuss phase before planning:
```
/discuss-phase 3
```

Then answer the structured questions.

## Example Scenario

**Phase 3: User Dashboard**

Unclear: Should it show real-time data or cached?

```
/discuss-phase 3

Discussion:
1. Real-time vs cached data?
   → User: Start with cached, add real-time in Phase 5

2. Which charts to include?
   → User: Activity graph and stats summary only

3. Mobile responsive or desktop only?
   → User: Must be responsive (mobile-first)

Documented in DECISIONS.md and BRIEF.md
Ready for /plan 3
```

## Benefits

**Prevents:**
- ❌ Planning with unclear scope
- ❌ Multiple planning iterations
- ❌ Scope creep during execution
- ❌ Rework from wrong assumptions

**Enables:**
- ✅ Clear planning context
- ✅ Aligned expectations
- ✅ Documented rationale
- ✅ Faster execution

## Best Practices

- **Discuss complex phases** - Simple ones can skip
- **Be thorough** - Better to over-clarify than assume
- **Document everything** - Rationale matters
- **Make trade-offs explicit** - Note what's deferred
- **Validate assumptions** - Challenge "we think..."

## When to Skip

**Can skip discuss if:**
- Phase is simple and clear
- Similar to previous phase
- No technical decisions needed
- No scope ambiguity

**Must discuss if:**
- Multiple approaches possible
- New technology involved
- Integration complexity
- User-facing features
- Performance critical

## Reference

Full workflow: `.agent/workflows/discuss-phase.md`
Related:
- `/plan` - Create detailed plans (after discuss)
- `/research-phase` - Technical research
- `/list-phase-assumptions` - Check planning assumptions
