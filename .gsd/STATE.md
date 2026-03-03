# Project State

> Last updated by `/map` workflow on March 2, 2026

## Last Session Summary

**Codebase mapping complete.**

- **Components identified**: 50+ (9 pages, 5 context providers, 17 custom hooks, 10+ services)
- **Dependencies analyzed**: 43 production + 12 dev (all recent, no critical outdated packages)
- **Technical debt items found**: 6 (context duplication, hook proliferation, side-effect patterns, service consolidation)

### Key Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Frontend Packages | 43 prod, 12 dev | ✓ Healthy |
| Build Tool | Vite 7.2.4 | ✓ Latest |
| React Version | 19.2.0 | ✓ Latest |
| Mantine UI | 8.3.15 | ✓ Current |
| Test Coverage | 0% | ⚠ Critical gap |
| Code Quality | ESLint enabled | ✓ Active |

---

## Architecture Overview

```
React 19 SPA with Vite
├── Context-based State Management
├── Mantine UI Components
├── 17 Custom Hooks (Business Logic)
├── Domain Services (Supabase Facade)
└── Real-time Queue Sync
```

---

## Critical Files

- `.gsd/ARCHITECTURE.md` - System design, data flow, components
- `.gsd/STACK.md` - Technology inventory, versions, deployment
- `src/App.jsx` - Main entry point, route definitions
- `src/features/queue/` - Core queue management feature
- `src/services/supabase/` - Backend integration layer
- `vite.config.js` - Build configuration

---

## Next Steps

1. **Review Architecture** - Validate component organization & data flow
2. **Plan Improvements** - Use `/plan` workflow with this mapping as context
3. **Add Tests** - Implement unit tests for hooks & services (identified gap)
4. **Refactor Contexts** - Consolidate duplicate context definitions
5. **Simplify Hooks** - Consider grouping related hooks

---

## Team Context

- **Language**: React + JavaScript (JSX)
- **Framework**: Vite + React Router
- **Backend**: Supabase (Auth, PostgreSQL, Realtime)
- **UI Library**: Mantine
- **Build**: Automated compression (gzip + brotli)
- **Deployment**: Vercel
- **Monitoring**: Vercel Analytics + Speed Insights
- **Code Quality**: ESLint with Husky pre-commit hooks

---

## Decisions Recorded

See `.gsd/DECISIONS.md` for Phase 1-5 architectural decisions regarding:
- Song tagging & discussion features
- Data model (individual tables vs. unified feed)
- User identification strategy (display_name)
- Circle/group membership scope

