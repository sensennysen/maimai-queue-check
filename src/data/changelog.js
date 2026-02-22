export const changelogData = [
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
        type: 'feature',
        title: 'Best 50 render',
        description: 'Allows the user to render their Best 50 in an image.',
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
];
