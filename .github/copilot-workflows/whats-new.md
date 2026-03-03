---
description: Show recent GSD changes and new features
---

# What's New

Display recent changes, new features, and improvements to the GSD protocol for GitHub Copilot.

## What This Does

1. **Reads changelog** - Extracts recent versions
2. **Displays changes** - Shows what's new
3. **Highlights features** - Key improvements
4. **Suggests actions** - What to try

## When to Use

- After updating GSD
- Check for new features
- See what changed
- Learn about improvements

## Example Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► WHAT'S NEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VERSION 1.3.0 — 2026-03-15
══════════════════════════

🆕 NEW WORKFLOWS

• /research-phase — Deep technical research with Level 1-3
• /list-phase-assumptions — Surface planning assumptions
• /plan-milestone-gaps — Address audit/verification gaps
• /discuss-phase — Clarify scope before planning
• /audit-milestone — Review milestone quality

───────────────────────────────────────────────────────

✨ ENHANCEMENTS

• /plan now auto-detects when research is needed
• /verify includes better evidence formatting
• /execute shows real-time progress updates
• /debug includes hypothesis tracking
• All workflows now support both PowerShell and Bash

───────────────────────────────────────────────────────

🐛 BUG FIXES

• /verify properly handles multiple verification methods
• /execute --gaps-only correctly filters gap plans
• /pause no longer loses context dump
• /resume displays all saved assumptions

───────────────────────────────────────────────────────

📚 DOCUMENTATION

• New GSD-COPILOT-GUIDE.md with examples
• Updated PROJECT_RULES.md with search-first discipline
• Enhanced copilot-instructions.md
• Added assumption validation patterns

───────────────────────────────────────────────────────

VERSION 1.2.0 — 2026-03-01
══════════════════════════

🎯 IMPROVEMENTS

• Better wave detection in /execute
• /progress shows estimated completion
• /map creates STACK.md automatically
• Enhanced commit message formatting

───────────────────────────────────────────────────────

VERSION 1.1.0 — 2026-02-15
══════════════════════════

🚀 FEATURES

• /add-todo and /check-todos for quick capture
• /web-search for research integration
• /pause and /resume for context hygiene
• Phase management: /add-phase, /insert-phase, /remove-phase

───────────────────────────────────────────────────────

💡 TRY THESE NEW FEATURES

1. /research-phase {N} --level 2
   → Deep research before planning

2. /list-phase-assumptions {N}
   → Validate planning assumptions

3. /audit-milestone
   → Review milestone quality

4. /discuss-phase {N}
   → Clarify scope interactively

───────────────────────────────────────────────────────

📖 LEARN MORE

• Read: .github/GSD-COPILOT-GUIDE.md
• View: PROJECT_RULES.md for methodology
• Try: /help to see all commands

───────────────────────────────────────────────────────

/update — Update to latest version

───────────────────────────────────────────────────────
```

## Example Usage

See what's new:
```
/whats-new
```

## Changelog Format

GSD uses semantic versioning and categorizes changes:

### Added
New features and workflows

### Changed  
Modifications to existing functionality

### Fixed
Bug fixes and corrections

### Deprecated
Features being phased out

### Removed
Features that have been removed

## Version History

### Major Versions
- **2.0.0** - Breaking changes
- **1.0.0** - Initial Copilot integration release

### Minor Versions
- **1.3.0** - Research and assumption workflows
- **1.2.0** - Execution improvements
- **1.1.0** - Todo and phase management

### Patch Versions
- **1.2.1** - Bug fixes
- **1.1.1** - Documentation updates

## Staying Updated

**Check for updates:**
```
/update
```

**See full changelog:**
Read `CHANGELOG.md` in project root

**Follow releases:**
Watch the GSD repository on GitHub

## Feature Highlights by Version

### 1.3.0 - Planning & Quality
- Assumption validation
- Gap closure planning
- Milestone auditing
- Phase discussions
- Research workflows

### 1.2.0 - Execution Flow
- Wave optimization
- Progress tracking
- Stack documentation
- Better commit formatting

### 1.1.0 - Productivity
- Todo management
- Session management (pause/resume)
- Phase manipulation
- Web search integration

### 1.0.0 - Foundation
- Core SPEC → PLAN → EXECUTE → VERIFY flow
- 26 GitHub Copilot workflows
- Empirical verification
- Context hygiene
- Planning lock

## Migration Guides

**Upgrading from 1.2.x to 1.3.x:**
- No breaking changes
- New workflows available immediately
- Existing projects compatible
- Review new features in guide

**Upgrading from 1.0.x to 1.1.x:**
- Todo system optional
- Phase management enhanced
- All existing workflows compatible

## Best Practices

- **Update regularly** - Monthly or before new milestones
- **Read changelogs** - Understand what changed
- **Try new features** - Experiment with improvements
- **Provide feedback** - Report issues or suggestions

## Reference

Full workflow: `.agent/workflows/whats-new.md`
Related:
- `/update` - Update to latest version
- `/help` - View all commands
- `/install` - Install GSD
