/**
 * @typedef {Object} QueueEntry
 * @property {string} id - Unique identifier
 * @property {string} player1 - First player name
 * @property {string} player2 - Second player name (optional)
 * @property {'waiting'|'playing'} status - Current status
 * @property {number} order_position - Position in queue
 * @property {string} branch_id - Branch identifier
 * @property {string} [created_by] - User ID who created the entry
 * @property {string} [created_by_name] - Display name of creator
 * @property {string} [started_at] - ISO timestamp when game started
 * @property {string} created_at - ISO timestamp when entry was created
 */

/**
 * @typedef {Object} Branch
 * @property {string} id - Branch identifier
 * @property {string} name - Branch display name
 * @property {number} latitude - Branch latitude coordinate
 * @property {number} longitude - Branch longitude coordinate
 * @property {number} [radius] - Allowed radius in meters
 */

/**
 * @typedef {Object} UserRoles
 * @property {boolean} can_edit - Whether user can edit queue
 * @property {boolean} is_admin - Whether user is an admin
 */

/**
 * @typedef {Object} LocationState
 * @property {boolean} locationVerified - Whether location has been verified
 * @property {string|null} locationError - Error message if verification failed
 * @property {boolean} locationCheckInProgress - Whether verification is in progress
 * @property {boolean} hasAttemptedVerification - Whether verification has been attempted
 * @property {boolean} needsLocationPermission - Whether permission prompt is needed
 */

// Export empty object to make this a module
export {};
