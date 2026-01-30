export const changelogData = [
  {
    version: 'v0.0.7',
    date: 'January 30, 2026',
    changes: [
      {
        type: 'security',
        title: 'Security Patches',
        description: 'Implemented security and privacy patches across the system.',
      },
      {
        type: 'fix',
        title: 'Queue Logic & RLS',
        description: 'Fixed "Infinite Recursion" errors in database policies and resolved CRUD issues for authorized staff. Added "cancelled" status to allow proper entry removal.',
      },
      {
        type: 'feature',
        title: 'Branch Selection',
        description: 'Added the ability for users to select specific branches/locations for queue viewing.',
        footnote: 'Currently, we have 2 branches but we will soon add more as I connect to communities and continue to develop it to handle branches that have multiple cabinets.',
      },
      {
        type: 'feature',
        title: 'Geolocation Support',
        description: 'Integrated user geolocation to filter and display nearby places automatically.',
        footnote: 'Gelocation accuracy depends on your device and browser settings.'
      },
      {
        type: 'fix',
        title: 'Session & CSS Fixes',
        description: 'Resolved issues with session transitions and fixed UI glitches in queue item displays and disabled buttons.',
      },
      {
        type: 'feature',
        title: 'Flavor Texts',
        description: 'Added flavor texts to some parts of the app.',
        footnote: 'If you have any suggestions for flavor texts, feel free to message me on Discord!'
      },
    ]
  }
];
