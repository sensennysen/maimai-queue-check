---
description: Audit milestone for quality and completeness
---

# Audit Milestone

Review a completed or in-progress milestone for quality, completeness, and lessons learned.

## What This Does

1. **Loads milestone** - Current or archived milestone
2. **Checks must-haves** - Verifies all requirements met
3. **Reviews technical debt** - Catalogs deferred items
4. **Analyzes phase quality** - Reviews gap closures
5. **Generates audit report** - Creates comprehensive review
6. **Recommends actions** - Suggests improvements

## Arguments

- **Milestone name**: Optional - audits current if not specified

## When to Use

- After completing milestone
- Mid-milestone quality check
- Before starting next milestone
- Retrospective reviews

## Process Flow

### 1. Load Milestone Context
If milestone name provided, load from archive:
```powershell
Get-Content ".gsd/milestones/{name}-SUMMARY.md"
```

If no name, audit current milestone from ROADMAP.md.

### 2. Check Must-Haves Verification
For each must-have:
- Was it verified with empirical evidence?
- Is the evidence still valid?
- Any regressions since completion?
- Quality of verification

### 3. Review Technical Debt
Scans TODO.md and DECISIONS.md for:
- Items deferred during milestone
- Technical debt acknowledged
- Items that should be addressed
- Priority of debt

### 4. Analyze Phase Quality
For each phase:
- Review VERIFICATION.md
- Count gap closures (indicates poor planning)
- Note recurring issues
- Check for patterns

### 5. Assess Wave Efficiency
Review execution:
- How many waves per phase?
- Were waves well-organized?
- Many dependencies issues?

### 6. Generate Audit Report
Creates `.gsd/milestones/{name}-AUDIT.md`:

```markdown
# Milestone Audit: {name}

**Audited**: {date}
**Auditor**: {who conducted audit}

## Summary

| Metric | Value | Status |
|--------|-------|--------|
| Phases | {N} | ✅ |
| Gap closures | {M} | 🟡 Higher than expected |
| Technical debt items | {K} | 🟢 Manageable |
| Must-haves verified | {L}/{Total} | ✅ |

## Must-Haves Status

| Requirement | Verified | Evidence | Quality |
|-------------|----------|----------|---------|
| User authentication | ✅ | curl output | Good |
| Playlist CRUD | ✅ | Test suite | Excellent |
| Share links | ✅ | Screenshot | Good |

## Quality Assessment

### Strengths
- {strength 1}
- {strength 2}

### Concerns
-  {concern 1 with details}
- {concern 2 with details}

## Gap Analysis

**Total Gaps**: {N}
**By Phase**:
- Phase 1: {M} gaps (mostly scope creep)
- Phase 2: {P} gaps (integration issues)

**Pattern**: {identified pattern}

## Technical Debt

### Created This Milestone
1. {debt item} — Priority: {high/medium/low}
2. {debt item} — Priority: {high/medium/low}

### Addressed This Milestone
- {what was paid down}

## Phase-by-Phase Review

### Phase 1: {name}
- **Status**: ✅ Complete
- **Gaps**: 1 (acceptable)
- **Quality**: Good
- **Notes**: {observations}

### Phase 2: {name}
- **Status**: ✅ Complete
- **Gaps**: 3 (higher than ideal)
- **Quality**: Fair
- **Notes**: {observations}

[Continue for all phases]

## Lessons Learned

### What Went Well
- {success 1}
- {success 2}

### What Needs Improvement
- {improvement 1}
- {improvement 2}

## Recommendations

### Immediate Actions
1. {recommendation 1}
2. {recommendation 2}

### For Next Milestone
1. {improvement for next time}
2. {process change}

## Technical Debt to Address

Priority order:
1. 🔴 {high priority debt}
2. 🟡 {medium priority debt}
3. 🟢 {low priority debt}

## Metrics

- **Commit count**: {N}
- **Files changed**: {M}
- **Duration**: {days} days
- **Average phase duration**: {X} days
- **Gap closure rate**: {Y}%
- **Velocity**: {commits per day}

## Conclusion

{Overall assessment of milestone quality}

**Grade**: {A/B/C/D/F}
**Ready for production**: {Yes/No/With reservations}
```

### 7. Display Summary
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► MILESTONE AUDIT COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Milestone: {name}

Overall Grade: {grade}

───────────────────────────────────────────────────────

HIGHLIGHTS

✅ Strengths:
   • {strength 1}
   • {strength 2}

⚠️ Concerns:
   • {concern 1}
   • {concern 2}

───────────────────────────────────────────────────────

RECOMMENDATIONS

1. {top recommendation}
2. {second recommendation}

───────────────────────────────────────────────────────

Full report: .gsd/milestones/{name}-AUDIT.md

───────────────────────────────────────────────────────

▶ NEXT

/plan-milestone-gaps — Address identified gaps

───────────────────────────────────────────────────────
```

## Example Usage

Audit current milestone:
```
/audit-milestone
```

Audit archived milestone:
```
/audit-milestone v1.0
```

## Audit Criteria

**Excellent (A):**
- All must-haves verified with quality evidence
- <2 gap closures per phase
- Technical debt documented and minimal
- Lessons learned captured

**Good (B):**
- All must-haves verified
- 2-3 gap closures per phase
- Technical debt managed
- Some lessons documented

**Fair (C):**
- Most must-haves verified
- 4-5 gap closures per phase
- Technical debt accumulating
- Minimal documentation

**Poor (D/F):**
- Missing must-have verification
- >5 gap closures per phase
- Significant undocumented debt
- No lessons learned

## What Gets Audited

✅ **Verification quality**
✅ **Technical debt**
✅ **Gap closure patterns**
✅ **Phase execution**
✅ **Documentation completeness**
✅ **Lessons learned**
✅ **Adherence to GSD principles**

## Best Practices

- **Audit early** - Don't wait until end
- **Be honest** - Identify real issues
- **Document thoroughly** - Future you will thank you
- **Act on findings** - Use /plan-milestone-gaps
- **Share insights** - Update GSD-STYLE.md with learnings

## Reference

Full workflow: `.agent/workflows/audit-milestone.md`
Related:
- `/complete-milestone` - Finish milestone
- `/plan-milestone-gaps` - Address gaps
- `/verify` - Phase-level verification
