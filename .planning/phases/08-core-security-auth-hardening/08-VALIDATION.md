# Phase 08: Core Security & Auth Hardening - Validation Strategy

**Date:** 2026-03-21
**Status:** Draft

## Validation Architecture

### Dimension 1: Functional Correctness
- [ ] Roles are successfully re-fetched on page load/mount.
- [ ] Users can still perform authorized actions (editing queue, etc.).
- [ ] Bookmarklet still creates sessions correctly.

## Automated Verification

### Critical Regressions
- `AuthContext.jsx` must NOT call `localStorage.setItem` for roles.
