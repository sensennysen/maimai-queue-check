---
description: Update GSD to latest version
---

# Update GSD

Update GSD for GitHub Copilot to the latest version from the repository.

## What This Does

1. **Checks current version** - Reads local CHANGELOG.md
2. **Fetches latest** - Downloads from GitHub
3. **Compares versions** - Determines if update available
4. **Shows changes** - Displays what's new
5. **Applies updates** - Updates files
6. **Cleans up** - Removes temporary files

## When to Use

- Check for new GSD features
- Get bug fixes
- Update workflows
- Access new documentation

## Process Flow

### 1. Check Current Version
Reads from `CHANGELOG.md` or `VERSION` file:
```powershell
if (Test-Path "CHANGELOG.md") {
    $version = Select-String -Path "CHANGELOG.md" -Pattern "## \[(\d+\.\d+\.\d+)\]" | 
        Select-Object -First 1
    Write-Output "Current version: $($version.Matches.Groups[1].Value)"
}
```

### 2. Fetch Latest
Clones repository to temporary location:
```bash
git clone --depth 1 https://github.com/your-org/gsd-copilot.git .gsd-update-temp
```

### 3. Compare Versions
Extracts remote version:
```powershell
$remoteVersion = Select-String -Path ".gsd-update-temp/CHANGELOG.md" -Pattern "## \[(\d+\.\d+\.\d+)\]"
```

**If same version:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► ALREADY UP TO DATE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Version: {version}

No updates available.

───────────────────────────────────────────────────────
```

**If newer version available, continue...**

### 4. Show Changes
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► UPDATE AVAILABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current: {current-version}
Latest:  {remote-version}

───────────────────────────────────────────────────────

WHAT'S NEW

{Extract from CHANGELOG.md showing changes between versions}

Example:
## [1.3.0] - 2026-03-15
### Added
- New /research-phase workflow with Level 1-3 discovery
- /list-phase-assumptions for assumption validation
- Enhanced PLAN.md templates

### Fixed
- /verify now properly handles multiple verifications
- improved error messages in /execute

### Changed
- /plan now auto-detects research needs

───────────────────────────────────────────────────────

Update now?
A) Yes — Apply updates (safe, preserves your work)
B) No — Cancel
C) Show detailed changes

───────────────────────────────────────────────────────
```

### 5. Apply Updates (if confirmed)

**Preserves your work:**
- Does NOT overwrite: `.gsd/SPEC.md`, `.gsd/STATE.md`, `.gsd/phases/`
- DOES update: Workflows, core files, documentation

```powershell
# Update core GSD files
Copy-Item -Force ".gsd-update-temp/.github/copilot-workflows/*" "./.github/copilot-workflows/"
Copy-Item -Force ".gsd-update-temp/.github/copilot-instructions.md" "./.github/"
Copy-Item -Force ".gsd-update-temp/PROJECT_RULES.md" "./"
Copy-Item -Force ".gsd-update-temp/GSD-STYLE.md" "./"
Copy-Item -Force ".gsd-update-temp/.github/GSD-COPILOT-GUIDE.md" "./.github/"

# Update templates if they exist
if (Test-Path ".gsd/templates") {
    Copy-Item -Force ".gsd-update-temp/.gsd/templates/*" "./.gsd/templates/"
}
```

### 6. Cleanup
```bash
rm -rf .gsd-update-temp
```

### 7. Display Success
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► UPDATE COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Updated to: {new-version}

Updated files:
✅ Copilot workflows ({N} files)
✅ Core documentation
✅ Instructions file
✅ Integration guide

Your project files preserved:
✓ .gsd/SPEC.md
✓ .gsd/STATE.md  
✓ .gsd/phases/
✓ Your codebase

───────────────────────────────────────────────────────

/whats-new — See full changelog
/help — View updated commands

───────────────────────────────────────────────────────
```

## Example Usage

Check for updates:
```
/update
```

## Safety Features

**Files Never Touched:**
- Your project SPEC.md
- Your STATE.md and ROADMAP.md
- Phase directories and plans
- Your source code
- Your git history

**Files Updated:**
- Workflow definitions
- Core GSD documentation
- Helper scripts
- Templates

**Backup Created:**
Before updating, creates:
```.gsd-backup-{timestamp}/```

## Rollback

If update causes issues:

```powershell
# Restore from backup
Copy-Item -Recurse -Force ".gsd-backup-{timestamp}/*" "./"
```

Or use git:
```bash
git checkout HEAD -- .github/ PROJECT_RULES.md GSD-STYLE.md
```

## Update Frequency

**Check for updates:**
- Monthly - Stay current
- Before new milestone - Get latest features
- After GSD announcements - Get specific improvements
- When issues arise - Bug fixes may be available

## What Gets Updated

### Always Updated
✅ `.github/copilot-workflows/*.md` - Workflow commands
✅ `.github/copilot-instructions.md` - Auto-loaded context
✅ `.github/GSD-COPILOT-GUIDE.md` - Integration guide
✅ `PROJECT_RULES.md` - Canonical rules
✅ `GSD-STYLE.md` - Writing style guide

### Optionally Updated  
⚙️ `.gsd/templates/*.md` - Document templates (if you haven't customized)

### Never Updated
❌ `.gsd/SPEC.md` - Your project requirements
❌ `.gsd/STATE.md` - Your project state
❌ `.gsd/ROADMAP.md` - Your phases
❌ `.gsd/phases/**` - Your plans and work
❌ `src/**` - Your source code
❌ `.env`, `package.json`, etc. - Your project config

## Version Numbering

GSD uses semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (e.g., 2.0.0)
- **MINOR**: New features, backwards compatible (e.g., 1.3.0)
- **PATCH**: Bug fixes (e.g., 1.2.1)

## Best Practices

- **Review changes** - Read what's new before updating
- **Commit first** - Have clean git state before updating
- **Test after update** - Try a workflow to ensure it works
- **Report issues** - If update causes problems

## Troubleshooting

**Update fails:**
```powershell
# Clean up and retry
Remove-Item -Recurse -Force .gsd-update-temp
# Run /update again
```

**Need specific version:**
```bash
# Manual install specific version
git clone --branch v1.2.0 https://github.com/your-org/gsd-copilot.git .gsd-update-temp
# Then manually copy files
```

## Reference

Full workflow: `.agent/workflows/update.md`

Related:
- `/install` - Initial GSD installation
- `/whats-new` - See recent changes
- `/help` - View all commands
