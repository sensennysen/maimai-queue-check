# SPEC-003: Toggle for Sharing Most Played Songs

## Status: FINALIZED

## Problem Statement
Currently, a user's "Most Played Songs" section is always visible on their public profile if the profile itself is public. Users need granular control over whether this specific section is displayed to others, similar to other collections like Favorites and Playlists.

## Requirements
1.  **Privacy Setting Addition**:
    *   Introduce a new privacy setting `show_most_played` inside the `privacy_settings` object for a user's profile.
    *   Default value should be `true` for backwards compatibility or when the setting is missing.
2.  **UI Updates - Profile Settings**:
    *   Add a toggle switch in the `ProfileSettingsModal` under the "Score Data" or "Collections" section, labeled "Most Played Songs".
    *   This toggle should allow users to conditionally set the `show_most_played` privacy setting.
3.  **UI Updates - Public Profile**:
    *   In the `PublicProfilePage`, the "Most Played Songs" section must only render if the profile owner's `privacy_settings.show_most_played` is not strictly `false`.

## Success Criteria
- Users can toggle the visibility of their "Most Played Songs" section via the Profile Settings modal.
- The state is persistently saved in the database under `privacy_settings`.
- The public profile strictly respects this setting when viewing another user's profile.
