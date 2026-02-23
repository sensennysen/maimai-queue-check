# SMF Queue Check — Address Codebase Concerns

## What This Is

SMF Queue Check is a React SPA for maimai queue management: branch selection, queue check-in, realtime updates, song database, admin, and public profiles — backed by Supabase. This project is a focused pass to address existing codebase concerns (bugs, performance, security, fragile areas, tech debt) in a fixed order, grouping related items. We are not introducing missing pieces (e.g. test framework) in this pass.

## Core Value

Systematically reduce risk and improve maintainability by fixing known concerns in priority order, without adding new infrastructure or features.

## Requirements

### Validated

- ✓ Auth (Supabase): sign-in, session, roles — existing
- ✓ Branch selection and persistence — existing
- ✓ Queue management, realtime subscriptions, queue rules — existing
- ✓ Song database and selection — existing
- ✓ Admin (users, reports, access requests, branch list, queue rules) — existing
- ✓ Profiles, favorites, playlists, maimai import/export — existing
- ✓ Location guard and geolocation — existing
- ✓ Theme, feature flags, notifications — existing

### Active

- [ ] **Phase 1 — Bugs:** Fix known bugs (e.g. getUserRoles API mismatch); group related bug fixes
- [ ] **Phase 2 — Performance:** Address performance bottlenecks (e.g. single large service bundle, realtime event rate); group related improvements
- [ ] **Phase 3 — Security:** Harden security considerations (client config, dangerouslySetInnerHTML, cached roles); group related items
- [ ] **Phase 4 — Fragile areas:** Stabilize fragile areas (BranchContext, auth/roles loading, early returns/guards, geolocation); group related fixes
- [ ] **Phase 5 — Tech debt:** Address tech debt (monolithic Supabase service, ESLint disables, weak validation, swallowed promise rejections); group related items

### Out of Scope

- Introducing missing pieces (e.g. test framework, Vitest, new tooling) — separate initiative
- New features or product changes — this pass is remediation only
- Scaling limits / infrastructure changes (Supabase/Vercel plans) — unless directly required by a fix

## Context

- Codebase map in `.planning/codebase/` (CONCERNS.md, ARCHITECTURE.md, STACK.md, etc.) defines the current state and recommended fix approaches.
- React 19, Vite 7, Mantine 8, Supabase 2; single `src/services/supabase.js` and context-based state.
- Order and grouping were chosen to fix bugs first, then performance and security, then fragile areas, then structural tech debt.

## Constraints

- **Order:** Work must follow Bugs → Performance → Security → Fragile areas → Tech debt.
- **Scope:** Fix existing concerns only; do not introduce test framework or other missing infrastructure in this project.
- **Grouping:** Related items are addressed together per phase (e.g. all ESLint disables in one phase).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Order: bugs → performance → security → fragile → tech debt | Fix incorrect behavior first, then speed and safety, then brittleness, then structure | — Pending |
| Group related items per phase | Fewer, clearer phases; related changes land together | — Pending |
| Do not introduce missing pieces (e.g. tests) | Keep this project bounded to remediation only | — Pending |

---
*Last updated: 2025-02-23 after initialization*
