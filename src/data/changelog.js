export const changelogData = [
  {
    version: 'v1.11.0',
    date: 'March 31, 2026',
    changes: [
      {
        type: 'revamp',
        title: 'Complete Visual Redesign & Accessibility',
        description: 'App-wide application of a new design system. Enjoy the new theme, improved typography sizes for better readability, and a completely overhauled light theme that prioritizes visual comfort and accessibility (WCAG AA compliant).',
      },
      {
        type: 'feature',
        title: 'Public Profile Improvements',
        description: 'Redesigned public profiles for a better narrative flow, moving from identity to track taste to activity.',
      },
      {
        type: 'feature',
        title: 'Regional Branch Grouping',
        description: 'Branches on the queue page are now categorized by geographical region with visual dividers.',
        footnote: 'Thanks for this suggestion, ryuki.kiyomizu @ maiph!'
      },
      {
        type: 'qol',
        title: 'Pull-to-Refresh & Mobile Polish',
        description: 'Added intuitive pull-to-refresh gestures across the Feed, Shared Playlists, and Profiles. Also revamped the mobile search bar layout to appear seamlessly as a top pop-up.',
      },
    ]
  },
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
  }
];
