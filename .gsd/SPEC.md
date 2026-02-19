# SPEC-001: Fix Infinite Queries/Mutations

## Status: FINALIZED

## Problem Statement
Users have reported (or internal monitoring shows) that the application is performing redundant or infinite network requests (queries/mutations). This causes performance degradation, unnecessary load on Supabase, and potential UI freezes.

## Requirements
1.  **Identify and eliminate infinite loops** in React `useEffect` hooks.
2.  **Optimize data fetching** to avoid redundant calls on every render.
3.  **Ensure state stability** by providing correct dependency arrays to hooks.
4.  **Verify** that network activity settles after initial load and only triggers on intentional events (user action or real-time updates).

## Identified Issues
- **Major**: `BranchContext.jsx` has a `useEffect` hook without a dependency array that calls `loadBranches()`. This causes an infinite re-render loop as `loadBranches` updates state (`loading`, `branches`, `selectedBranch`).
- **Potential**: `AuthContext.jsx` has complex real-time subscription logic that triggers `getUserRoles`. While likely intended, it should be audited for efficiency.
- **Audit**: Review `useQueueData` and `useMonitorData` to ensure real-time updates don't trigger recursive fetches unnecessarily.

## Success Criteria
- The application performs a stable number of requests on page load.
- No "infinite loop" console errors or rapidly incrementing network requests in DevTools.
- `BranchContext` initialization runs exactly once (or when explicitly reloaded).
