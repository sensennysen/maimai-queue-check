# Roadmap: Modal Shake Fix

## Overview
Phase-wise approach to identifying and fixing modal shaking in Mantine centered modals.

## Phase 1: Modal Audit and Technical Fix
- Audit `centered` modals for `Select`, `MultiSelect`, and `Autocomplete` components.
- Apply `comboboxProps={{ withinPortal: false }}` fix to all identified components.
- Status: COMPLETED

## Phase 2: Verification
- Verify stable repositioning for all updated modals.
- Status: COMPLETED
