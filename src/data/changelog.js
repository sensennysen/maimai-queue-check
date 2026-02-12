export const changelogData = [
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
  },
  {
    version: 'v1.4.2',
    date: 'February 8, 2026',
    changes: [
      {
        type: 'bugfix',
        title: 'Queue Suggestions',
        description: 'Fixed an issue where the queue suggestions are not suggesting recent players.',
      },
    ]
  },
   {
    version: 'v1.4.1',
    date: 'February 6, 2026',
    changes: [
      {
        type: 'bugfix',
        title: 'Querying Optimization',
        description: 'Optimized the querying of queues to prevent the app from checking all queues from all branches.',
      },
      {
        type: 'feature',
        title: 'Report Form',
        description: 'The Contact Us footer now redirects to report form.',
      },
    ]
  },
   {
    version: 'v1.4.0',
    date: 'February 6, 2026',
    changes: [
      {
        type: 'feature',
        title: 'Queue Function Improvements',
        description: 'Implemented Solo Queue toggle; Input now suggest players that have their preferred branch set to the location and recent players on that day; Adds similarity detection to avoid double entries. (Thanks to Tear for the suggestions!)',
      },
      {
        type: 'improvement',
        title: 'Querying Improvements',
        description: 'Cached branch queries and fixed an issue where queues from the previous day is being carried over to the next day',
      },
      {
        type: 'feature',
        title: 'Name Constraints',
        description: 'Users can now have at most 10 characters in their display name and queue entries.',
      },
      {
        type: 'visual',
        title: 'UI Improvements',
        description: 'General UI improvements',
      },
      {
        type: 'feature',
        title: 'View-Only Mode',
        description: 'Added a view-only mode for users to easily see the information on the branch. (Thanks to GTDD for the suggestion!)',
      },
    ]
  }
];
