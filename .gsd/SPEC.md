# SPEC-005: Simplify Mobile Bookmarklet

## Status: FINALIZED

## Problem Statement
The current bookmarklet is over 4,000 characters long because it embeds the entire scraping logic. Mobile browsers (like Safari and Chrome on iOS/Android) often have strict character limits on bookmark URLs (such as 2048 characters), making it impossible for users to save the bookmarklet and use it to extract their maimai DX NET scores.

## Requirements
1.  **Reduce Bookmarklet Length**:
    *   The bookmarklet URL must be significantly shorter than 2048 characters.
    *   Achieve this by creating a "loader" bookmarklet that dynamically injects the scraping script into the page.
2.  **Host the Scraping Script**:
    *   Extract the large scraping script and serve it statically from the app's `public` directory (e.g., `/bookmarklet.js`).
3.  **Update Instructions UI**:
    *   Update `BookmarkletInstructions.jsx` to provide the new, shorter loader script instead of the full giant string.
    *   The loader script should reference the current origin (`window.location.origin`) so it correctly loads the script from the deployed app's domain.

## Success Criteria
- The generated bookmarklet code displayed in the UI is very short (under 200 characters).
- Clicking the bookmarklet on the maimai DX NET site successfully fetches the externally hosted script and executes the scraping logic.
- Mobile users can successfully copy and save the bookmark without being truncated.
