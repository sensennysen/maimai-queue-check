---
description: Validate work against spec with empirical evidence
---

# Verify Phase

Validate that implemented work meets specification requirements using empirical evidence and documented proof.

## What This Does

1. **Loads** phase definition and requirements
2. **Extracts** must-have deliverables from the phase
3. **Executes** verification commands for each requirement
4. **Collects** empirical evidence (output, screenshots)
5. **Creates** verification report with pass/fail status
6. **Generates** gap closure plans if issues found

## Core Principle

**No "trust me, it works"** - Every verification must produce proof:
- Command output showing success
- Screenshots of UI changes
- Test results
- Build outputs
- Actual behavior confirmation

## Arguments

- **Phase number**: Required (e.g., `1`, `2`, `3`)

## Verification Flow

### 1. Load Context
Read:
- Phase definition from `.gsd/ROADMAP.md`
- Original requirements from `.gsd/SPEC.md`
- Implementation summaries from `.gsd/phases/{phase}/*-SUMMARY.md`

### 2. Extract Must-Haves
From phase definition, identify requirements that MUST be true:
```markdown
### Must-Haves for Phase {N}
1. API endpoint /api/users returns user list → verify with curl
2. Login form validates email format → verify with screenshot
3. Tests pass for auth module → verify with npm test
```

### 3. Verify Each Requirement
For each must-have, determine method and execute:

| Requirement Type | Verification Method | Evidence Type |
|-----------------|---------------------|---------------|
| API/Backend | Run curl or HTTP test | Command output |
| UI Component | Check in browser/preview | Screenshot |
| Build/Compile | Run build command | Success output |
| Tests | Run test suite | Test results |
| File exists | Check filesystem | File listing |
| Code behavior | Run specific scenario | Output |

### 4. Record Evidence
For each must-have, capture:
- **Status**: PASS / FAIL
- **Evidence**: Full command output or screenshot
- **Notes**: Observations, edge cases
- **Timestamp**: When verified

### 5. Create Report
Write `.gsd/phases/{phase}/VERIFICATION.md`:

```markdown
---
phase: {N}
date: {ISO-8601}
status: {PASS / PARTIAL / FAIL}
---

# Phase {N} Verification

## Summary
- Total requirements: {N}
- Passed: {N}
- Failed: {N}

## Verification Results

### 1. {Requirement name}
**Status**: PASS / FAIL
**Method**: {How verified}
**Evidence**:
```
{command output or screenshot description}
```
**Notes**: {observations}

[Repeat for each requirement]

## Issues Found
{If any failures, list them}

## Next Steps
{If FAIL: needs gap closure plans}
{If PARTIAL: specific items to address}
{If PASS: ready to proceed}
```

### 6. Handle Failures
If any verification fails:
1. Document the gap in VERIFICATION.md
2. Create gap closure plans in `.gsd/phases/{phase}/`
3. User can run `/execute {phase} --gaps-only` to fix

## Verification Standards

**API Endpoints**:
```bash
# Must show successful response
curl -X GET http://localhost:3000/api/endpoint
```

**UI Changes**:
- Screenshot showing the change
- Confirm responsive behavior if applicable

**Tests**:
```bash
# Must show all tests passing
npm test
# or
npm run test:coverage
```

**Build**:
```bash
# Must complete without errors
npm run build
```

**Configuration**:
```bash
# Must show config is active
cat config/file.json
# or
npm run config:verify
```

## Example Usage

Verify phase 2 implementation:
```
/verify 2
```

After verification, if issues found:
```
/execute 2 --gaps-only
```

## Reference

Full workflow details: `.agent/workflows/verify.md`
