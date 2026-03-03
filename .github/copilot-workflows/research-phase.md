---
description: Deep technical research for phase planning
---

# Research Phase

Conduct focused technical research to inform planning decisions for a phase. Creates RESEARCH.md with findings.

## What This Does

1. **Loads context** - Phase objective and tech stack
2. **Identifies questions** - What needs research
3. **Conducts research** - Based on discovery level
4. **Evaluates options** - Compares alternatives
5. **Makes recommendations** - Based on findings
6. **Documents** - Creates RESEARCH.md

## Arguments

- **Phase number**: e.g., `3`
- **--level 1|2|3**: Research depth (default: 2)

## Discovery Levels

| Level | Time | Use When |
|-------|------|----------|
| **1** | 2-5 min | Single library, confirming syntax/version |
| **2** | 15-30 min | Choosing between 2-3 options, new integration |
| **3** | 1+ hour | Architectural decision, novel problem |

**Default**: Level 2 unless specified.

## When to Use

**Before planning when you need to:**
- Choose between technologies/libraries
- Understand integration requirements
- Verify API capabilities
- Prototype complex solutions
- Research best practices
- Evaluate performance implications

## Process Flow

### 1. Load Phase Context
Reads:
- Phase objective from ROADMAP.md
- ARCHITECTURE.md (if exists)
- STACK.md (current technologies)

### 2. Identify Research Questions
What needs understanding?

```markdown
## Research Questions

1. {Technical question 1}
   Context: {why this matters}

2. {Technical question 2}
   Context: {why this matters}

3. {Integration question}
   Context: {why this matters}
```

### 3. Conduct Research by Level

**Level 1: Quick Verification**
- Check official documentation
- Confirm API/syntax exists
- Verify version compatibility
- Total: 2-5 minutes

**Level 2: Comparison Research**
- Identify 2-3 options
- Compare features
- Evaluate trade-offs  
- Check community support
- Read recent articles
- Make recommendation
- Total: 15-30 minutes

**Level 3: Deep Dive**
- Comprehensive option evaluation
- Prototype if needed
- Performance testing
- Research edge cases
- Community feedback
- Document all unknowns
- Total: 1+ hours

### 4. Use Web Search
For each question:
```
/web-search {focused query}
```

Extract and synthesize findings.

### 5. Generate RESEARCH.md
Creates `.gsd/phases/{N}/RESEARCH.md`:

```markdown
---
phase: {N}
level: {1|2|3}
researched_at: {date}
researcher: {who}
---

# Research: Phase {N} — {phase name}

## Research Questions

1. {Question 1}
2. {Question 2}
3. {Question 3}

## Findings

### Question 1: {question}

**Context**: {why this matters to the phase}

**Options Considered**:

#### Option A: {name}
**What**: {description}
**Pros**:
- {benefit 1}
- {benefit 2}

**Cons**:
- {drawback 1}  
- {drawback 2}

**Sources**:
- {URL 1}
- {URL 2}

#### Option B: {name}
**What**: {description}
**Pros**:
- {benefit 1}

**Cons**:
- {drawback 1}

**Sources**:
- {URL 1}

#### Recommendation: {Option A}

**Rationale**: {why this is the best choice}

**Risk**: {any concerns with this choice}

**Mitigation**: {how to handle risks}

---

### Question 2: {question}

[Same structure]

---

## Summary

### Recommended Approach
{High-level summary of recommended tech/approach}

### Key Decisions Made
1. {Decision}: {choice and why}
2. {Decision}: {choice and why}

### Remaining Unknowns
- {Unknown 1}: {why it's unclear and how to resolve}
- {Unknown 2}: {why it's unclear and how to resolve}

### Sources Consulted
1. {Source title} — {URL}
2. {Source title} — {URL}
3. {Source title} — {URL}

## Next Steps

Ready to proceed with planning:
```bash
/plan {N}
```

Use these findings in task definitions and context.
```

### 6. Update DECISIONS.md
Records research outcomes:

```markdown
## Phase {N} Research — {date}

### Technical Research Completed
Discovery level: {level}

### Key Decisions
- **{Decision}**: Chose {option} over {alternatives}
  - Rationale: {reasoning}
  - Risk: {if any}
  - Mitigation: {if needed}

### Sources
{List of key sources}
```

### 7. Display Summary
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► RESEARCH COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase {N}: {name}
Level: {discovery level}

Researched: {N} questions
Documented: .gsd/phases/{N}/RESEARCH.md

───────────────────────────────────────────────────────

KEY RECOMMENDATIONS

1. {Recommendation 1}
2. {Recommendation 2}

───────────────────────────────────────────────────────

▶ NEXT

/plan {N} — Create execution plans using research

───────────────────────────────────────────────────────
```

## Example Usage

Standard research (Level 2):
```
/research-phase 3
```

Quick verification (Level 1):
```
/research-phase 3 --level 1
```

Deep architectural research (Level 3):
```
/research-phase 3 --level 3
```

## Example Scenario

**Phase 3: Real-time Features**

Need to choose WebSocket library:

```
/research-phase 3 --level 2

Questions:
1. Which WebSocket library for Node.js?
2. How to handle reconnection logic?
3. What's the best way to scale WebSocket connections?

Research Level 2 (15-30 min):
→ Compares Socket.io vs ws vs uWebSockets.js
→ Evaluates Redis pub/sub for scaling
→ Checks recent benchmarks

Recommendation:
→ Socket.io for ease of use and built-in reconnection
→ Redis adapter for horizontal scaling
→ Document findings in RESEARCH.md

Ready for /plan 3 with informed decisions
```

## Integration with Planning

**Normal flow:**
```
/new-milestone → /research-phase 1 → /plan 1 → /execute 1
```

**When research needed:**
```
/plan decides research is needed
→ Creates RESEARCH.md stub
→ User runs /research-phase
→ Returns to /plan with findings
```

## Best Practices

- **Research before deciding** - Don't guess technology choices
- **Document sources** - Links for future reference
- **Consider trade-offs** - No perfect solution
- **Note unknowns** - What still needs testing
- **Time-box research** - Don't over-research
- **prototype when uncertain** - Level 3 should include testing

## Reference

Full workflow: `.agent/workflows/research-phase.md`
Related:
- `/plan` - Use research in planning
- `/web-search` - Search during research
- `/discuss-phase` - Clarify requirements
