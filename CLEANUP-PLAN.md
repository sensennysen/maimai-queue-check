# Codebase Cleanup Plan — maipaqueuecheck-ph v1.9.3

---

## Round 1 — Completed

| # | Task | Status |
|---|------|--------|
| 1.1 | Consolidate `subscribeToUserRoleChanges` | Completed |
| 1.2 | Use `STORAGE_KEYS` constant in `BranchContext` | Completed |
| 2.1 | Remove dead code in `vite.config.js` | Completed |
| 2.2 | Fix duplicate `useBranch` import in BranchSelector | Not needed (no duplicate) |
| 2.3 | Clean up test file console statements | Completed |
| 2.4 | Review `AuthContext` useEffect dependencies | Verified correct |
| 2.5 | Clean up empty hook directories | Completed |
| 2.6 | Audit console.* statements | Cleaned commented-out logs in geolocation.js |
| 3.1 | Consolidate duplicated constants | Verified correct (utils/constants.js is fine) |
| 3.2 | Clean up dead comments in `theme.js` | Completed |
| 3.3 | Investigate unused `useCabinetManager` | Verified — used in useQueueManager.js |

---

## Round 2 — Completed

| # | Task | Status |
|---|------|--------|
| 1.1 | Fix barrel file duplicate export | Completed |
| 1.2 | Remove duplicate `subscribeToUserRoleChanges` from queue.js | Completed |
| 1.3 | Remove unused `subscribeToGameSessionChanges` | Completed |
| 2.1 | Add error logging in LoginForm.jsx silent catch blocks | Completed |
| 2.2 | Add error context in posts.js error handlers | Completed |
| 2.3 | Add error logging in BranchContext.jsx location fallback | Completed |
| 3.1 | Standardize icon imports to deep paths (36 files) | Completed |

---

## Round 3 — Pending Improvements

### 3.1 Additional silent catch blocks (34 found)
**Files with silent catch blocks that could benefit from error logging:**
- `src/services/geolocation.js:19,221`
- `src/components/layout/GlobalNavbar.jsx:85`
- `src/components/feed/FeedPostCard.jsx:66,79,104,134`
- `src/features/queue/components/QueueManager.jsx:194,204,214,236,247,279,298`
- `src/features/playlists/components/PlaylistPostCard.jsx:135,158`
- `src/features/feed/hooks/useFeedData.js:182,218`
- `src/contexts/AuthContext.jsx:47,105`
- `src/pages/ExportBest50Page.jsx:117`
- `src/hooks/useNotifications.js:66,83,164`
- `src/features/feed/hooks/usePostComments.js:17,35,49,82`
- `src/hooks/useQueueManager.js:92`
- `src/hooks/useLocationVerification.js:58,171`
- `api/profile-meta.js:56`
- `api/proxy.js:65,83`

**Note**: Many catch blocks have "// Error handled by hook" comments, indicating errors are handled via notification hooks. Review each to determine if additional logging is needed.

---

## Execution Order
1. Round 2 Phase 1 → Phase 2 → Phase 3 (Completed)
2. Each phase can be a separate commit for reviewability
3. Run `npm run lint` and `npm run test` after each phase
