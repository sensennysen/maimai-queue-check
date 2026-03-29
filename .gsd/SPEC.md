# Specification: Font Consistency for ViewPage

## Problem Statement
The `ViewPage` (Public Monitor) might not be using the same fonts as the rest of the application, leading to a visual inconsistency.

## Requirements
1.  Verify the intended global fonts for the application (Outfit for body, Space Grotesk for headings).
2.  Ensure `ViewPage.jsx` and its components (Mantine Title, Text, etc.) utilize these fonts.
3.  Align the Mantine theme configuration (`theme.js`) with the global CSS (`index.css`) to prevent tag-level vs class-level font mismatches.

## Status
Status: FINALIZED
