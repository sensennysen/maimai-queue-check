---
description: List and validate planning assumptions
---

# List Phase Assumptions

Surface and document assumptions made during phase planning that should be validated before or during execution.

## What This Does

1. **Loads phase plans** - Reads all PLAN.md files
2. **Extracts assumptions** - Identifies implicit/explicit assumptions
3. **Categorizes** - Groups by type and risk level
4. **Displays** - Shows organized list with risk indicators
5. **Offers validation** - Suggests how to verify
6. **Documents** - Records in phase directory

## Arguments

- **Phase number**: e.g., `3`

## When to Use

- **Before execution** - Validate risky assumptions
- **During planning** - Surface hidden assumptions
- **After plan creation** - Quality check
- **When uncertain** - Make assumptions explicit

## Process Flow

### 1. Load Phase Plans
Reads all plans:
```powershell
Get-ChildItem ".gsd/phases/{N}/*-PLAN.md"
```

### 2. Extract Assumptions
Scans plans for:

**Technical Assumptions:**
- "Uses {library}" → Library works as expected
- "API returns {data}" → API structure assumption
- "Compatible with {tech}" → Compatibility not verified

**Integration Assumptions:**
- "Service is available" → External dependency
- "Auth works with {X}" → Integration untested
- "Data format is {Y}" → Schema assumption

**Scope Assumptions:**
- "User wants {feature}" → Requirement not confirmed
- "Out of scope: {item}" → Boundary assumption
- "Similar to {existing}" → Pattern applies

**Performance Assumptions:**
- "Will handle {N} users" → Scale not tested
- "Fast enough" → Performance not measured
- "Won't timeout" → Duration assumption

**Timeline Assumptions:**
- "2-3 tasks" → Effort estimate
- "One wave" → Dependencies clear
- "Quick to implement" → Complexity guess

### 3. Categorize by Risk

**Risk Levels:**
- 🔴 **High**: Wrong assumption blocks phase
- 🟡 **Medium**: Wrong assumption adds work
- 🟢 **Low**: Wrong assumption is minor

### 4. Display Assumptions
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► PHASE {N} ASSUMPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Found: {total} assumptions

───────────────────────────────────────────────────────

TECHNICAL
─────────

🔴 HIGH RISK
• Stripe API supports custom metadata
  Source: Plan 2, Task 1
  Validate: Check Stripe docs, test with sandbox

🟡 MEDIUM RISK
• React Query caching works with auth
  Source: Plan 1, Task 3
  Validate: Prototype before implementing

🟢 LOW RISK
• CSS Grid supported in target browsers
  Source: Plan 3, Task 2
  Validate: Check caniuse.com

───────────────────────────────────────────────────────

INTEGRATION
───────────

🔴 HIGH RISK
• External payment service has 99.9% uptime
  Source: Plan 2, Task 2
  Validate: Check SLA, implement fallback

🟡 MEDIUM RISK
• Database has existing user table
  Source: Plan 1, Task 1
  Validate: Review schema before coding

───────────────────────────────────────────────────────

SCOPE
───────

🟡 MEDIUM RISK
• Users want email notifications (not push)
  Source: Plan 3, Task 1
  Validate: Confirm with user/stakeholder

🟢 LOW RISK
• Admin features can wait for Phase 4
  Source: Plan 1 (out of scope)
  Validate: Confirm deferral is acceptable

───────────────────────────────────────────────────────

PERFORMANCE
───────────

🟡 MEDIUM RISK
• Current infrastructure handles 1000 concurrent users
  Source: Plan 2, Task 3
  Validate: Load test before launch

───────────────────────────────────────────────────────

TIMELINE
─────────

🟢 LOW RISK
• Implementation takes 2-3 days
  Source: Plan 1
  Validate: As work progresses

───────────────────────────────────────────────────────

▶ ACTIONS

HIGH RISK ({N} items)
→ Validate BEFORE starting /execute

MEDIUM RISK ({M} items)
→ Validate during execution or prototype first

LOW RISK ({K} items)
→ Accept and proceed, adjust if wrong

───────────────────────────────────────────────────────

Save assumptions report?
A) Yes — Save to .gsd/phases/{N}/ASSUMPTIONS.md
B) No — Just display

───────────────────────────────────────────────────────
```

### 5. Offer Validation
For each high-risk assumption:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 VALIDATE HIGH RISK ASSUMPTIONS?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{N} high-risk assumptions should be validated before /execute

Options:
A) Validate now — Research and verify each
B) Add to TODO.md — Validate later
C) Accept and proceed — Take the risk

Which do you prefer?
```

**If "Validate now":**
For each assumption:
- Run appropriate validation (web search, test, etc.)
- Document result
- Update assumption status

**If "Add to TODO.md":**
```bash
/add-todo Validate: {assumption} --priority high
```

**If "Accept and proceed":**
Mark assumptions as accepted risks in DECISIONS.md.

### 6. Save Report (if requested)
Creates `.gsd/phases/{N}/ASSUMPTIONS.md`:

```markdown
# Phase {N} Planning Assumptions

**Analyzed**: {date}
**Total**: {count}

## High Risk (🔴)

### {Assumption}
**Context**: {where it appears}
**Risk**: {what happens if wrong}
**Validation**: {how to verify}
**Status**: {Not Validated / Validated / Accepted Risk}

## Medium Risk (🟡)

[Same structure]

## Low Risk (🟢)

[Same structure]

## Validation Plan

Before /execute:
- [ ] {High risk item 1}
- [ ] {High risk item 2}

During /execute:
- [ ] {Medium risk item 1}

## Notes

{Additional context}
```

## Example Usage

Check assumptions for phase 3:
```
/list-phase-assumptions 3
```

## Example Scenario

**Phase 2: Payment Integration**

Plans mention "Stripe API" but don't verify:

```
/list-phase-assumptions 2

Found assumptions:
🔴 Stripe supports our currency (GBP)
🔴 Webhook system works with our infrastructure
🟡 Stripe fees are acceptable
🟢 Stripe UI components work in React

User chooses: Validate now
→ Research confirms GBP supported
→ Webhook test succeeds
→ Document results in ASSUMPTIONS.md

Ready for /execute 2 with confidence
```

## Benefits

**Prevents:**
- ❌ Mid-execution surprises
- ❌ Rework from wrong assumptions
- ❌ Blocked progress
- ❌ Scope creep from hidden requirements

**Enables:**
- ✅ Informed decision-making
- ✅ Risk awareness
- ✅ Proactive validation
- ✅ Better estimates

## Best Practices

- **Check before execution** - Don't discover during coding
- **Validate high risk** - Don't assume critical items
- **Document rationale** - Why assumption was made
- **Update when validated** - Track verification
- **Review regularly** - Assumptions change over time

## Assumption Red Flags

Watch for these phrases in plans:
- "Should work"
- "Probably"
- "Assuming"
- "Similar to"
- "As far as I know"
- "I think"
- "Most likely"

These indicate assumptions that need validation.

## Reference

Full workflow: `.agent/workflows/list-phase-assumptions.md`
Related:
- `/plan` - Create plans (that contain assumptions)
- `/research-phase` - Validate technical assumptions
- `/discuss-phase` - Surface assumptions early
- `/execute` - Where wrong assumptions cause problems
