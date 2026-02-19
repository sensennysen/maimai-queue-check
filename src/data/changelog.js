export const changelogData = [
  {
    version: 'v1.7.0',
    date: 'February 19, 2026',
    changes: [
      {
        type: 'feature',
        title: 'User Profile',
        description: 'Showcase your favorite songs, build a playlist, and import your best 50 songs for everyone to see!',
        footnote: 'You can share your profile via the link button beside your display name. You can also set privacy settings. Big thanks to albinokoi for this idea!'
      },

      {
        type: 'feature',
        title: 'Queue Rules',
        description: 'Added a way for branch admins to display their queue rules',
        footnote: 'Thanks to the UPTC maimai community for this one!'
      },
      {
        type: 'visual',
        title: 'Premium UI Redesign',
        description: 'Redesigned headers for the Song Database and Profile pages for a more consistent feel.',
      },
      {
        type: 'feature',
        title: 'Song Database',
        description: 'Added a song database for users to search songs and add to their favorites/playlists',
        footnote: 'Thanks to the data-fetching scripts by zetaraku@github!'
      },
      {
        type: 'optimization',
        title: 'Performance & Architecture',
        description: 'Implemented lazy-loading for the song database and refactored context management for better stability.',
      },
      {
        type: 'fix',
        title: 'Bug Fixes',
        description: 'Various bug fixes',
      },
      {
        type: 'feature',
        title: 'Privacy Compliance (RA 10173)',
        description: 'Updated privacy policy and data handling to comply with Philippines Data Privacy Laws.',
      },
    ]
  },
  {
    version: 'v1.6.0',
    date: 'February 18, 2026',
    changes: [
      {
        type: 'feature',
        title: 'Experimental Features',
        description: 'Added a new tab in the Profile Dropdown Menu which contains experimental features.',
      },
      {
        type: 'feature',
        title: 'mpqcheck Profile',
        description: '[Experimental] Added a new tab in the Profile Dropdown Menu which contains your maimai Best 50 songs.',
        footnote: 'This requires you to import your scores, which I have provided instructions on how to',
      },
      {
        type: 'visual',
        title: 'UI Improvements',
        description: 'Used a new font family, better loading animation, and thematic issues being addressed',
      },
      {
        type: 'optimization',
        title: 'Code Optimization',
        description: 'Generic code optimizatio and security hardening',
      }
    ]
  },
  {
    version: 'v1.5.0',
    date: 'February 14, 2026',
    changes: [
      {
        type: 'hotfix',
        title: 'Distance Badge',
        description: 'Fixed an issue where the distance badge is not showing up.',
      },
      {
        type: 'visual',
        title: 'UI Improvements',
        description: 'Added themes! You can select your preferred theme in the settings.',
      },
    ]
  },
  {
    version: 'v1.4.3',
    date: 'February 12, 2026',
    changes: [
      {
        type: 'hotfix',
        title: 'Notifications',
        description: 'Notifs that are more than a week old won\'t show up on the list anymore.',
      },
      {
        type: 'visual',
        title: 'UI Improvements',
        description: 'Added visual feedback for queue updates.',
      },
      {
        type: 'visual',
        title: 'Branch Short Names',
        description: 'Added short names for branches to make them easier to identify.',
      },
    ]
  }
];
