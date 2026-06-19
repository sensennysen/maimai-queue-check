/**
 * Converts a date string into a human-readable relative time format (e.g., "5 minutes ago").
 * @param {string} dateString - The ISO date string to format.
 * @returns {string} A string representing the time elapsed since the given date.
 */
export const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
};

/**
 * Converts a date string into a compact relative timestamp for dense activity UI.
 * @param {string} dateString - The ISO date string to format.
 * @returns {string} A compact elapsed time such as "5m", "3d", or "2mo".
 */
export const getCompactRelativeTime = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const diffInSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffInSeconds < 60) return 'now';

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo`;

  return `${Math.floor(diffInDays / 365)}y`;
};

/**
 * Determines the best available profile image URL for a user based on a priority hierarchy.
 * Priority: custom display photo > maimai DX icon > null.
 * @param {Object} profile - The user profile object containing photo candidate URLs.
 * @returns {string|null} The resolved image URL or null if no candidate is found.
 */
export const getProfileImageUrl = (profile) => {
  if (!profile) return null;
  return profile.display_photo_url || profile.dx_display_photo_url || null;
};
