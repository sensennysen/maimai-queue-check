# SPEC-004: Fix Mobile Keyboard Modal Shake

## Status: FINALIZED

## Problem Statement
When viewing modals on mobile devices (e.g. `QueueRulesModal` or `BranchEditModal`), tapping an input causes the virtual keyboard to appear. This shrinks the viewport and causes the Mantine `<Modal>` component to infinitely jump/shake, which freezes the UI and prevents the user from typing.

## Requirements
1.  **Stop Modal Layout Thrashing**:
    *   Find the root cause of the Mantine `Modal` shaking (typically related to `removeScrollProps` or `centered` calculations).
    *   Apply a global fix in the Mantine theme configuration (`src/config/theme.js`) so that all modals in the application inherit the fix.
    *   Ensure the fix does not break desktop scrolling or click-outside behaviors.
2.  **No Code Duplication**:
    *   The fix must be applied at the theme level to avoid manually updating every single modal file.

## Success Criteria
- Opening a modal on a mobile device and focusing an input (triggering the keyboard) smoothly resizes the viewport.
- The modal does not shake indefinitely.
- Desktop modal behavior remains unaffected.
