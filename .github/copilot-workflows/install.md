---
description: Install GSD into current project
---

# Install GSD

Install GSD (Get Shit Done) protocol files into the current project from GitHub.

## What This Does

1. **Checks existing** - Looks for GSD installation
2. **Clones repository** - Downloads GSD files
3. **Copies files** - Installs into project
4. **Sets up structure** - Creates `.gsd/` directory
5. **Cleans up** - Removes temporary files
6. **Guides next steps** - Shows how to start

## When to Use

- First time using GSD in a project
- Adding GSD to existing codebase
- Reinstalling after removal
- Setting up fresh project

## Process Flow

### 1. Check for Existing Installation
Looks for GSD marker directories:
```powershell
$alreadyInstalled = (Test-Path ".agent") -or (Test-Path ".gsd") -or (Test-Path ".github/copilot-workflows")
```

**If already installed:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► ALREADY INSTALLED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GSD files already exist in this project.

───────────────────────────────────────────────────────

A) Reinstall — Overwrite with latest version (safe)
B) Cancel — Keep current installation

Tip: To update existing installation, use /update instead

───────────────────────────────────────────────────────
```

### 2. Clone from GitHub
Downloads GSD repository:
```bash
git clone --depth 1 https://github.com/your-org/gsd-copilot.git .gsd-install-temp
```

### 3. Copy Files
Installs GSD structure:

**Core directories:**
```powershell
# Copilot integration
Copy-Item -Recurse ".gsd-install-temp/.github/copilot-workflows" "./.github/"
Copy-Item -Force ".gsd-install-temp/.github/copilot-instructions.md" "./.github/"
Copy-Item -Force ".gsd-install-temp/.github/GSD-COPILOT-GUIDE.md" "./.github/"

# Full agent workflows (optional, for advanced use)
Copy-Item -Recurse ".gsd-install-temp/.agent" "./"
Copy-Item -Recurse ".gsd-install-temp/.gemini" "./"

# GSD directory structure
New-Item -ItemType Directory -Force ".gsd"
Copy-Item -Recurse ".gsd-install-temp/.gsd/templates" "./.gsd/"
Copy-Item -Recurse ".gsd-install-temp/.gsd/examples" "./.gsd/"
```

**Root files:**
```powershell
Copy-Item -Force ".gsd-install-temp/PROJECT_RULES.md" "./"
Copy-Item -Force ".gsd-install-temp/GSD-STYLE.md" "./"
Copy-Item -Force ".gsd-install-temp/FEATURES.md" "./"
```

**Scripts (if present):**
```powershell  
if (Test-Path ".gsd-install-temp/scripts") {
    Copy-Item -Recurse ".gsd-install-temp/scripts" "./"
}
```

### 4. Create .gsd Structure
Initializes empty directories:
```powershell
New-Item -ItemType Directory -Force ".gsd/phases"
New-Item -ItemType Directory -Force ".gsd/milestones"
```

### 5. Cleanup
```bash
rm -rf .gsd-install-temp
```

### 6. Display Success
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► INSTALLATION COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GSD has been installed into your project!

Installed:
✅ GitHub Copilot workflows (26 commands)
✅ Copilot instructions (auto-loaded)
✅ Core GSD documentation
✅ Templates and examples
✅ Full agent workflows (advanced)

───────────────────────────────────────────────────────

QUICK START

1. /new-project — Initialize your project with GSD
2. /help — See all available commands
3. Read: PROJECT_RULES.md for core methodology

───────────────────────────────────────────────────────

WHAT YOU CAN DO NOW

In GitHub Copilot Chat, type:
• /help — View all GSD commands
• /new-project — Start a new project
• /progress — Check project status (after init)
• /map — Analyze existing codebase

───────────────────────────────────────────────────────

DOCUMENTATION

• PROJECT_RULES.md — Core GSD methodology
• GSD-STYLE.md — Writing conventions
• .github/GSD-COPILOT-GUIDE.md — Integration guide
• .gsd/examples/ — Example workflows

───────────────────────────────────────────────────────

🚀 Ready to Get Shit Done!

───────────────────────────────────────────────────────
```

## Example Usage

Install GSD:
```
/install
```

## What Gets Installed

### GitHub Copilot Integration
✅ `.github/copilot-workflows/*.md` - All slash commands
✅ `.github/copilot-instructions.md` - Auto-loaded context
✅ `.github/GSD-COPILOT-GUIDE.md` - How to use

### Core Documentation  
✅ `PROJECT_RULES.md` - Canonical GSD rules
✅ `GSD-STYLE.md` - Writing style guide
✅ `FEATURES.md` - Feature tracking template

### GSD Directory
✅ `.gsd/templates/` - Document templates
✅ `.gsd/examples/` - Example workflows
✅ `.gsd/phases/` - Empty, ready for plans
✅ `.gsd/milestones/` - Empty, ready for archives

### Agent Workflows (Advanced)
✅ `.agent/workflows/*.md` - Full GSD workflows
✅ `.agent/skills/*/SKILL.md` - Specialized behaviors
✅ `.gemini/GEMINI.md` - Agent  configuration

## File Sizes

**Minimal (Copilot only):** ~500KB
**Full (with agent workflows):** ~2MB

## Git Integration

**Add to .gitignore:**
```gitignore
# Temporary GSD files
.gsd/DEBUG.md
*.swp
```

**Commit GSD files:**
```bash
git add .github/ .gsd/ .agent/ PROJECT_RULES.md GSD-STYLE.md
git commit -m "chore: install GSD protocol"
```

## Customization

After installation, you can:
- ✅ Customize `.gsd/templates/` for your team
- ✅ Modify `copilot-instructions.md` for project specifics
- ✅ Add project-specific workflows
- ❌ Don't modify `PROJECT_RULES.md` (canonical)

## Reinstallation

If you need  to reinstall:
```
/install
→ Choose "Reinstall"
→ Overwrites GSD files
→ Preserves your .gsd/SPEC.md, STATE.md, phases/
```

## Uninstallation

To remove GSD:
```bash
rm -rf .github/copilot-workflows/
rm -rf .agent/ .gemini/ .gsd/
rm PROJECT_RULES.md GSD-STYLE.md FEATURES.md
```

Your project code and git history remain untouched.

## Next Steps After Install

**For new project:**
```
1. /new-project → Initialize with deep questioning
2. /plan 1 → Create Phase 1 plans
3. /execute 1 → Implement Phase 1
4. /verify 1 → Validate work
```

**For existing project:**
```
1. /map → Analyze existing codebase
2. /new-project → Initialize GSD tracking
3. Continue with planning
```

## Troubleshooting

**Clone fails:**
```bash
# Check internet connection
# Try manual clone
git clone https://github.com/your-org/gsd-copilot.git .gsd-install-temp
```

**Permission errors:**
```powershell
# Run with appropriate permissions
# On Windows: Run PowerShell as Administrator
# On Mac/Linux: Use sudo if needed
```

**Conflicts with existing files:**
```bash
# Backup first
mv .github .github-backup
# Then install
/install
# Merge any custom changes
```

## Reference

Full workflow: `.agent/workflows/install.md`
Related:
- `/update` - Update to latest version
- `/new-project` - Initialize after install
- `/help` - View all commands
