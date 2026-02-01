export const changelogData = [
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
