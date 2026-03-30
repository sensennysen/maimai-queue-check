/**
 * User attribution constants.
 *
 * Each key matches the value stored in the `user_attributions.attributions` array.
 * `color` maps to Mantine Badge color tokens or CSS custom properties.
 * `icon` is the Tabler icon import path (use the named icon in actual JSX).
 */
export const ATTRIBUTION_KEYS = {
  DEVELOPER: 'DEVELOPER',
  CONTRIBUTOR: 'CONTRIBUTOR',
  TESTER: 'TESTER',
};

/**
 * Display config for each attribution type.
 * Use this to render badges consistently across the app.
 */
export const ATTRIBUTIONS = {
  [ATTRIBUTION_KEYS.DEVELOPER]: {
    key: ATTRIBUTION_KEYS.DEVELOPER,
    label: 'Developer',
    color: 'primary',
    iconName: 'IconCode',
  },
  [ATTRIBUTION_KEYS.CONTRIBUTOR]: {
    key: ATTRIBUTION_KEYS.CONTRIBUTOR,
    label: 'Contributor',
    color: 'accent',
    iconName: 'IconGitPullRequest',
  },
  [ATTRIBUTION_KEYS.TESTER]: {
    key: ATTRIBUTION_KEYS.TESTER,
    label: 'Tester',
    color: 'var(--theme-success)',
    iconName: 'IconBug',
  },
};

/** Ordered list for consistent render order */
export const ATTRIBUTION_ORDER = [
  ATTRIBUTION_KEYS.DEVELOPER,
  ATTRIBUTION_KEYS.CONTRIBUTOR,
  ATTRIBUTION_KEYS.TESTER,
];
