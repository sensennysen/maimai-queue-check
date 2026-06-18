import {
  ListOrdered,
  Music2,
  Radio,
  Rows3,
} from 'lucide-react';

export const primaryNavigation = [
  { label: 'Feed', path: '/feed', icon: Rows3, requiresAuth: true },
  { label: 'Queue', path: '/queue', icon: ListOrdered },
  { label: 'Songs', path: '/songs', icon: Music2 },
  { label: 'Playlists', path: '/shared-playlists', icon: Radio, requiresAuth: true },
];

export function getVisibleNavigation(user) {
  return primaryNavigation.filter((item) => user || !item.requiresAuth);
}

export function getActiveNavigationPath(pathname) {
  return primaryNavigation.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))?.path;
}
