export const changelogData = [
  {
    version: 'v1.10.0',
    date: 'March 11, 2026',
    changes: [
      {
        type: 'feature',
        title: 'Community Feed',
        description: 'Share posts, follow other users, and engage with the community directly within the app.',
      },
      {
        type: 'bugfix',
        title: 'Miscellaneous bug fixes',
        description: 'Resolved issues with post deletion in the feed, admin branch visibility in profiles, and queue export stability.',
      },
      {
        type: 'improvement',
        title: 'Otoge DB Update',
        description: 'Updated the internal database with the latest song information.',
      }
    ]
  },
  {
    version: 'v1.9.3',
    date: 'March 7, 2026',
    changes: [
      {
        type: 'qol',
        title: 'Branches Refactor',
        description: 'Now allows all branches to be displayed when editing the profile',
        footnote: 'Some branches will still not be available on queueing due to missing coordinates.'
      },
      {
        type: 'qol',
        title: 'Playlist Reordering',
        description: 'Now allows users to reorder their playlists',
      },
      {
        type: 'qol',
        title: 'Songs Discussion Improvement',
        description: 'Now allows users to remove their tags and to see what those tags mean',
      }
    ]
  },
  {
    version: 'v1.9.2',
    date: 'March 5, 2026',
    changes: [
      {
        type: 'bugfix',
        title: 'Miscellaneous bug fixes',
        description: 'Fixes on adding songs from the songs db, the queue page not loading when coming from profile, and song discussion not loading properly on some modules.',
      },
      {
        type: 'qol',
        title: 'Edit caption on shared playlist posts',
        description: 'Users can now edit the caption of their shared playlist posts.',
      }
    ]
  },
  {
    version: 'v1.9.1',
    date: 'March 4, 2026',
    changes: [
      {
        type: 'QOL',
        title: 'Save playlist as drafts while editing',
        description: 'Playlists will now be saved as drafts while editing, allowing you to come back and finish them later without losing your progress.',
        note: 'Thanks for this suggestion King Halo @ maiph! This still relies on how fast your internet connection is, so it may not work well for users with slow connections. We are working on a more robust solution for this in the future.',
      },
      {
        type: 'QOL',
        title: 'Allow deletion of comments and posts',
        description: 'Users can now delete their own comments and playlist posts.',
      },
      {
        type: 'QOL',
        title: 'Added Artists filter on Songs DB',
        description: 'Users can now filter songs by artists in the Songs DB.',
        note: 'Thanks Marethyu @ maiph for this suggestion!',
      },
      {
        type: 'refactor',
        title: 'Tag Management Refactor',
        description: 'Refactored the tag management system for admins to manage tags better.',
      },
      {
        type: 'bugfix',
        title: 'Play count not being hidden on toggling hide play count',
        description: 'Fixed an issue where play counts are not hidden when toggling the hide play count setting.',
      }
    ]
  },
  {
    version: 'v1.9.0',
    date: 'March 2, 2026',
    changes: [
      {
        type: 'feature',
        title: 'Shared Playlist page',
        description: 'Collaborate and share your favorite song lists with others.',
      },
      {
        type: 'feature',
        title: 'Songs Discussion',
        description: 'Engage with the community and share your thoughts on specific tracks. Add tags to songs to help with organization and discovery.',
      },
      {
        type: 'feature',
        title: 'View as Public on profile',
        description: 'Preview how your profile appears to other users.',
      },
      {
        type: 'feature',
        title: 'Circle name and recent plays on import',
        description: 'Automatically pull your Circle name and recent play history during account import.',
      },
      {
        type: 'feature',
        title: 'Queue History and Logs',
        description: 'Track past queue entries and monitor activity in real-time.',
      },
      {
        type: 'revamp',
        title: 'Privacy Settings',
        description: 'Complete overhaul of privacy controls for better data management.',
      },
      {
        type: 'improvement',
        title: 'Filter Cleanup',
        description: 'Removed redundant reset filters for a cleaner interface.',
      },
      {
        type: 'bugfix',
        title: 'B50 Export Fix',
        description: 'Resolved an issue where Best 50 could not be exported due to resource restrictions.',
      },
      {
        type: 'feature',
        title: 'Audit Trail for Super Admins',
        description: 'Comprehensive tracking of administrative actions for enhanced accountability.',
      },
    ]
  },
  {
    version: 'v1.8.2',
    date: 'February 26, 2026',
    changes: [
      {
        type: 'feature',
        title: 'DX/STD and Region Filters on Songs DB',
        description: 'Added filters to the songs DB to filter by DX/STD and Region.',
      },
      {
        type: 'bugfix',
        title: 'Miscellaneous Bugfixes',
        description: 'Fixes on mobile modals, pages failing to load, and B50 export sizes',
      },
    ]
  },
  {
    version: 'v1.8.1',
    date: 'February 25, 2026',
    changes: [
      {
        type: 'revamp',
        title: 'Songs DB Rework and Patch',
        description: 'Reworked the songs DB for a faster, smoother experience. Patched missing song jackets',
      },
      {
        type: 'feature',
        title: 'Favorite Songs and Best 50 details toggle',
        description: 'Added a toggle to hide/show the details of the songs in the Favorite Songs and Best 50 sections.',
      },
    ]
  },
  {
    version: 'v1.8.0',
    date: 'February 24, 2026',
    changes: [
      {
        type: 'feature',
        title: 'User Introductions',
        description: 'Express yourself with a new introduction section on your profile.',
      },
      {
        type: 'feature',
        title: 'Decoupled Identity',
        description: 'Queue names and Profile names are now independent, giving you more flexibility in how you are seen.',
      },
      {
        type: 'feature',
        title: 'Combo and Sync Achievements',
        description: 'The bookmarklet now fetches your combo and sync achievements.',
      },
      {
        type: 'feature',
        title: 'Best 50 Rendering rework',
        description: 'Reworked the Best 50 rendering to display the Combo and Sync achievements.',
      },
      {
        type: 'optimization',
        title: 'Streamlined Score Fetching',
        description: 'Significantly simplified the process of fetching all user scores for better reliability.',
        footnote: 'No need to update your bookmark. Just copy and paste the code, wait for the loading to finish, and you\'re good to go!'
      },
      {
        type: 'visual',
        title: 'UI Polish & Animations',
        description: 'Standardized loading states across the app and refined modal transitions for a more premium feel.',
      },
      {
        type: 'bugfix',
        title: 'Profile Photo Persistence',
        description: 'Fixed an issue where removing Best 50 data would unexpectedly delete custom profile pictures.',
      },
      {
        type: 'bugfix',
        title: 'Branch Selection Lock',
        description: 'Fixed a bug that caused the nearest branch to be re-selected even after a manual choice was made.',
      },
    ]
  },
  {
    version: 'v1.7.6',
    date: 'February 24, 2026',
    changes: [
      {
        type: 'refactor',
        title: 'Code Optimization',
        description: 'General code optimization.',
      },
    ]
  },
];
