/**
 * Queue status constants
 */
export const QUEUE_STATUSES = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

/**
 * Error message constants
 */
export const ERRORS = {
  LOCATION_REQUIRED: 'Location verification required to edit the queue',
  NO_BRANCH: 'No branch selected',
  LOGIN_REQUIRED: 'Please log in to edit the queue',
  BRANCH_REQUIRED: 'Please select a branch',
  LOCATION_FAILED: 'Failed to verify location. Please try again.'
};
