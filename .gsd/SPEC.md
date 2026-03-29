# Specification: Modal Shake Fix

## Problem Statement
Centered Mantine modals (v7) "shake" or jump when a dropdown-based component (`Select`, `MultiSelect`, `Autocomplete`) inside them is opened. This happens because the dropdown renders via a portal at the `body` level, changing the document's scroll height and triggering a re-calculation of the centered modal's position.

## Requirements
1.  Identify all instances of dropdown-based components (`Select`, `MultiSelect`, `Autocomplete`) inside `centered` modals.
2.  Apply `comboboxProps={{ withinPortal: false }}` to these components to force rendering within the modal's DOM subtree.
3.  Verify that the modal position remains stable when the dropdown opens/closes.
4.  Ensure visual consistency and usability are maintained (e.g., dropdowns are not clipped by the modal container).

## Status
Status: FINALIZED
