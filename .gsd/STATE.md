## Wave 1 Summary (Modal Shake Fix)

**Objective:** Apply technical fix to all identified centered modals with dropdown components to prevent layout shaking.

**Changes:**
- Added `comboboxProps={{ withinPortal: false }}` to dropdown components in `QueueLogsModal`, `QueueForm`, `UserTable`, `ProfileSettingsModal`, and `SongFilters`.

**Files Touched:**
- `src/features/queue/components/QueueLogsModal.jsx`
- `src/features/queue/components/QueueForm.jsx`
- `src/features/admin/components/UserTable.jsx`
- `src/components/profile/ProfileSettingsModal.jsx`
- `src/features/songs/components/SongFilters.jsx`

**Verification:**
- **Code Audit**: Confirmed all instances of `Select`, `MultiSelect`, and `Autocomplete` within `centered` modals use `withinPortal: false`.
- **Logic**: This prevents the default `<body>` portal rendering, avoiding layout shifts and modal repositioning "shakes".

**Risks/Debt:**
- None. Rendering within portal was originally intended for Z-index issues, but Mantine v7 handles these well in modern stack contexts.

**Next Wave TODO:**
- Milestone complete.
