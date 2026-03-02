---
description: Systematic debugging with hypothesis-driven approach
---

# Debug Issue

Systematically diagnose and fix issues using hypothesis-driven debugging with persistent state to prevent circular attempts.

## What This Does

1. **Documents** the symptom clearly
2. **Gathers** evidence before forming theories
3. **Forms** testable hypotheses
4. **Tests** each hypothesis systematically
5. **Records** attempts to prevent repetition
6. **Implements** the fix once root cause is found
7. **Verifies** the fix resolves the issue

## Arguments

- **Issue description**: Brief description of the problem

## Core Principle

**Fresh context sees what polluted context misses** - Systematic approach prevents:
- Circular debugging (trying same thing repeatedly)
- Assumption bias (guessing without evidence)
- Context pollution (carrying wrong theories)

## Debugging Flow

### 1. Document the Symptom
Create/update `.gsd/DEBUG.md`:

```markdown
# Debug Session: {Issue Description}

## Symptom
{Exact description of what's broken}

**When**: {When does it occur?}
**Expected**: {What should happen?}
**Actual**: {What actually happens?}
**Severity**: Critical / High / Medium / Low

## Environment
- OS: {operating system}
- Runtime: {Node version, browser, etc.}
- Branch: {git branch}
- Last working: {when was it last working?}
```

### 2. Gather Evidence FIRST
Collect data before theorizing:

**Error Messages**:
```bash
# Capture full error output
npm run dev 2>&1 | tee error.log
```

**Logs**:
```bash
# Check application logs
tail -50 logs/error.log
# or
Get-Content logs/error.log -Tail 50
```

**Environment**:
```bash
# Verify dependencies
npm list --depth=0
# Check configuration
cat config/settings.json
```

**Git History**:
```bash
# When did it break?
git log --oneline -10
git diff HEAD~5
```

Document all evidence in DEBUG.md.

### 3. Form Hypotheses
Based on evidence, create testable theories:

```markdown
## Hypotheses

### H1: {Theory 1}
**Likelihood**: High / Medium / Low
**Test**: {How to test this}
**Predicted outcome**: {What we expect}

### H2: {Theory 2}
**Likelihood**: High / Medium / Low
**Test**: {How to test this}
**Predicted outcome**: {What we expect}
```

Order by likelihood based on evidence.

### 4. Test Systematically
For each hypothesis (highest likelihood first):

1. **Design test**: Minimal code/command to test theory
2. **Run test**: Execute and capture full output
3. **Record result**: Document in DEBUG.md
4. **Update theories**: Adjust other hypotheses based on new info

```markdown
## Test Results

### Test H1: {Theory}
**Method**: {what you did}
**Output**:
```
{full output}
```
**Result**: CONFIRMED / REJECTED / INCONCLUSIVE
**Notes**: {observations}
```

### 5. Identify Root Cause
When hypothesis is confirmed:

```markdown
## Root Cause
{Clear statement of the actual problem}

**Why it happened**: {explanation}
**Why it wasn't caught**: {gap in testing/verification}
```

### 6. Implement Fix
Create fix with:
- Minimal changes to address root cause
- Test to prevent regression
- Update related documentation

```markdown
## Fix Applied

**Changes**:
- {file}: {what changed}
- {file}: {what changed}

**Commit**: {commit hash and message}
```

### 7. Verify Resolution
Prove the fix works:

```bash
# Run the scenario that was failing
{reproduction command}

# Run related tests
npm test

# Verify in application
{manual verification steps}
```

```markdown
## Verification

**Status**: RESOLVED / PARTIAL / UNRESOLVED
**Evidence**:
```
{proof the issue is fixed}
```
```

### 8. Clean Up
Once resolved:
- Move DEBUG.md to `.gsd/debug-archive/{date}-{issue}.md`
- Update FEATURES.md if it was a regression
- Consider adding test to prevent recurrence

## Common Patterns

**Import/Module Issues**:
```bash
# Check import paths
grep -r "import.*Component" src/
# Verify file exists
ls -la src/components/Component.jsx
```

**State/Props Issues**:
- Add console.log at key points
- Use React DevTools
- Check component hierarchy

**API/Network Issues**:
```bash
# Check endpoint
curl -v http://localhost:3000/api/endpoint
# Check network tab in DevTools
```

**Build/Config Issues**:
```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Example Usage

Debug a specific issue:
```
/debug Login button not responding on mobile
```

Resume debugging session:
```
/debug (will load existing .gsd/DEBUG.md)
```

## Reference

Full workflow details: `.agent/workflows/debug.md`
Skill details: `.agent/skills/debugger/SKILL.md`
