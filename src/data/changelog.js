export const changelogData = [
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
  },
   {
    version: 'v1.3.0',
    date: 'February 5, 2026',
    changes: [
      {
        type: 'feature',
        title: 'Request Queue Edit Access',
        description: 'Users can now request queue edit access to branches they want to edit.',
        footnote: 'Admins will receive a notification to approve/reject the request.'
      },
      {
        type: 'feature',
        title: 'Notifications',
        description: 'Users can now receive notifications for various events.',
      },
      {
        type: 'bugfix',
        title: 'Schedule View in Mobile',
        description: 'Fixed an issue where the schedule view is broken in mobile devices.',
      },
       {
        type: 'visual',
        title: 'UI Improvements',
        description: 'Made tabs more visible.',
      },
    ]
  },
   {
    version: 'v1.2.0',
    date: 'February 4, 2026',
    changes: [
      {
        type: 'bugfix',
        title: 'App Data Refresh',
        description: 'App should now show up-to-date data after the browser is focused on mobile devices.',
      },
      {
        type: 'feature',
        title: 'User Preferences',
        description: 'Added User Preferences - now user can update their display name and preferred branches.',
      },
      {
        type: 'misc',
        title: 'Miscellaneous Changes',
        description: 'Various improvements and optimizations.',
      },
      {
        type: 'feature',
        title: 'Admin Panel Improvements',
        description: 'Branches will have their own admins to allow/restrict users from modifying the queue on their branches.',
        footnote: 'Users who want to get permissions should set their preferred branch on user preferences and ask their local admins for the perms.'
      },
       {
        type: 'bugfix',
        title: 'Cross-Branch Queue Restriction',
        description: 'Fixed an issue where users could still add queue entries to other branches when they switch.',
      },
    ]
  },
   {
    version: 'v1.1.0',
    date: 'February 2, 2026',
    changes: [
      {
        type: 'bugfix',
        title: 'Branch Switching Fix',
        description: 'Fixed an issue where users doesn\'t see the correct queue when switching branches, which occurs when doing it to and from a branch with multiple cabinets.',
      },
      {
        type: 'feature',
        title: 'User Role Management',
        description: 'User roles are now automatically added when users sign in with their Google account.',
        footnote: 'The permission to edit is still manually set by me.'
      },
      {
        type: 'rework',
        title: 'Geolocation Support',
        description: 'Reworked to display information about the use of geolocation, such as permission to edit on the branch, and distance from the location.',
      },
    ]
  },
  {
    version: 'v1.0.0',
    date: 'February 1, 2026',
    changes: [
      {
        type: 'feature',
        title: 'Queue Management',
        description: 'Add, update, reorder, remove an entry, and clear the entire queue with real-time live updates across all connected clients.',
      },
      {
        type: 'feature',
        title: 'Google Authentication',
        description: 'Added authentication to control access and manage who can modify the queue.',
      },
      {
        type: 'feature',
        title: 'Geolocation Support',
        description: 'Location-based queue access restriction, allowing users to join the queue only when within approximately 100 meters of the physical location.',
      },
      {
        type: 'feature',
        title: 'Branch Manager',
        description: 'Administrative interface for supporting different branches, with the ability to add, edit, and configure locations (including the schedule).',
      },
      {
        type: 'feature',
        title: 'Multi-Cabinet Support',
        description: 'Support for arcades with multiple cabinets, allowing separate queue management for each cabinet.',
      },
    ]
  }
];
