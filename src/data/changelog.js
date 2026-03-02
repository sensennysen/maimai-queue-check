export const changelogData = [
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
  {
    version: 'v1.7.5',
    date: 'February 22, 2026',
    changes: [
      {
        type: 'bugfix',
        title: 'Profile Page Visibility',
        description: 'Fixed an issue where profile pages were not visible to logged-in users.',
      },
      {
        type: 'refactor',
        title: 'Preferred Branches',
        description: 'Refactored the preferred branches to only use 1 column',
      },
      {
        type: 'bugfix',
        title: 'Error on editing comments on favorite songs',
        description: 'Fixed an issue where users cannot edit the comment on their favorite songs.',
      }
    ]
  },
  {
    version: 'v1.7.4',
    date: 'February 21, 2026',
    changes: [
      {
        type: 'optimization',
        title: 'Profile Page Optimization on Mobile',
        description: 'Refactored CSS that caused performance issues on mobile devices and introduced various optimizations.',
      },
      {
        type: 'bugfix',
        title: 'Bug Fixes',
        description: 'Fixed an issue where multiselect selected both chart types for the same song title. Removed the shareable profile link for visitors.',
      },
      {
        type: 'feature',
        title: 'Playlist enhancements',
        description: 'You can now select DX and Standard charts separately, and select the specific difficulty you want to showcase!',
      }
    ]
  },
  {
    version: 'v1.7.3',
    date: 'February 21, 2026',
    changes: [
      {
        type: 'feature',
        title: 'Custom Display Photo',
        description: 'Added an upload feature for custom display photos.',
      },
      {
        type: 'fix',
        title: 'Favorite songs improvement',
        description: 'Allows user to edit the comment on their favorite songs.',
        footnote: 'Thanks to Sunnyjim for this suggestion!'
      },
      {
        type: 'feature',
        title: 'Multi-select on playlist making',
        description: 'Allows user to select multiple songs when making a playlist.',
      }
    ]
  },
  {
    version: 'v1.7.2',
    date: 'February 20, 2026',
    changes: [
      {
        type: 'feature',
        title: 'Most Played & Total Play Count',
        description: 'Added Most Played section and Total Play Count to user profiles.',
      },
      {
        type: 'fix',
        title: 'Best 50 Calculation',
        description: 'Fixed Best 50 calculation logic.',
      }
    ]
  },
  {
    version: 'v1.7.1',
    date: 'February 20, 2026',
    changes: [
      {
        type: 'bugfix',
        title: 'Best 50 Discrepancies',
        description: 'Fixed an issue where the Best 50 songs are in incorrect order and does not match maimai DX International versioning.',
      },
      {
        type: 'bugfix',
        title: 'Custom URL not updating',
        description: 'Fixed an issue where the custom URL is not updating on the profile menu when the slug is changed.',
      },
      {
        type: 'refactor',
        title: 'Custom URL Character limit',
        description: 'Added a character limit of 20 to custom URLs.',
        footnote: 'Thanks to Tear, really.'
      }
    ]
  },
];
