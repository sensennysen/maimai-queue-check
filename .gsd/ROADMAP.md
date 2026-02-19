# Roadmap - Fix Infinite Queries/Mutations

## Phase 1: Core Fix (Immediate)
- Fix infinite loop in `BranchContext.jsx`.
- Status: READY

## Phase 2: Audit & Optimization
- Audit `AuthContext.jsx` for redundant fetches.
- Audit `useQueueData.js` and `useMonitorData.js` for real-time fetch overhead.
- Status: PLANNED

## Phase 3: Verification
- Verify network stability in DevTools.
- Status: PLANNED
