import { supabase } from './supabase';
import { TABLES } from '../constants/database';

/**
 * Evaluates the current state of geolocation permissions in the browser.
 * Provides a fallback for browsers that do not support the Permissions API.
 * @returns {Promise<string>} Permission state: 'granted', 'denied', 'prompt', or 'unavailable'.
 */
export const checkGeolocationPermission = async () => {
  // Check if Permissions API is available
  if (!navigator.permissions || !navigator.permissions.query) {
    // Fallback: check if geolocation is available at all
    return navigator.geolocation ? 'prompt' : 'unavailable';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state; // 'granted', 'denied', or 'prompt'
  } catch {
    return navigator.geolocation ? 'prompt' : 'unavailable';
  }
};

/**
 * Calculates the geographical distance between two points using the Haversine formula.
 * @param {Object} coord1 - The first coordinate {latitude, longitude}.
 * @param {Object} coord2 - The second coordinate {latitude, longitude}.
 * @returns {number} The calculated distance in meters.
 */
export const getDistance = (coord1, coord2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Requests the user's current GPS coordinates via the browser's Geolocation API.
 * Encapsulates the callback-based API into a modern Promise structure.
 * @returns {Promise<Object>} A promise resolving to an object containing {latitude, longitude}.
 */
export const requestUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Identifies the arcade branch geographically closest to the user's current location.
 * Queries the database for all enabled branches and computes distances.
 * @param {Object} userLocation - User's current coordinates {latitude, longitude}.
 * @returns {Promise<Object>} A promise resolving to an object with {nearestBranch, distance}.
 */
export const findNearestBranch = async (userLocation) => {
  const { data: places, error } = await supabase
    .from(TABLES.ALLOWED_PLACES)
    .select('*')
    .eq('enabled', true);

  if (error) {
    throw error;
  }

  if (!places || places.length === 0) {
    return {
      nearestBranch: null,
      distance: null,
      error: 'No branches found in database',
    };
  }

  let nearestBranch = null;
  let minDistance = Infinity;

  places.forEach((place) => {
    const distance = getDistance(userLocation, {
      latitude: place.latitude,
      longitude: place.longitude,
    });

    if (distance < minDistance) {
      minDistance = distance;
      nearestBranch = place;
    }
  });

  return {
    nearestBranch,
    distance: Math.round(minDistance),
  };
};

/**
 * Verifies if the user is within a specified proximity threshold of a branch.
 * Defaults to 100 meters unless overridden. Can target a specific branch or the entire network.
 * @param {Object} userLocation - User's current coordinates {latitude, longitude}.
 * @param {number} [maxDistance=100] - The maximum allow proximity in meters.
 * @param {string} [branchId=null] - Optional ID of a specific branch to check against.
 * @returns {Promise<Object>} A promise resolving to {isAllowed, nearestPlace, distance, error?}.
 */
export const checkUserProximity = async (userLocation, maxDistance = 100, branchId = null) => {
  let query = supabase
    .from(TABLES.ALLOWED_PLACES)
    .select('*')
    .eq('enabled', true);

  // If branchId is provided, only check that specific branch
  if (branchId) {
    query = query.eq('id', branchId);
  }

  const { data: places, error } = await query;

  if (error) {
    throw error;
  }

  if (!places || places.length === 0) {
    return {
      isAllowed: false,
      nearestPlace: null,
      distance: null,
      error: branchId ? 'Branch not found in database' : 'No allowed locations found in database',
    };
  }

  let nearestPlace = null;
  let minDistance = Infinity;

  places.forEach((place) => {
    const distance = getDistance(userLocation, {
      latitude: place.latitude,
      longitude: place.longitude,
    });

    if (distance < minDistance) {
      minDistance = distance;
      nearestPlace = place;
    }
  });

  const isAllowed = minDistance <= maxDistance;

  // Extra safety check: if we somehow didn't find a nearest place (should be covered by empty check, but safe is good)
  if (!nearestPlace) {
     return {
      isAllowed: false,
      nearestPlace: null,
      distance: null,
    };
  }

  return {
    isAllowed,
    nearestPlace,
    distance: Math.round(minDistance),
  };
};

/**
 * Checks the database for a user's administrative or branch-specific edit permissions.
 * @param {string} userId - The unique identifier of the user to check.
 * @returns {Promise<Object>} A promise resolving to {can_edit: boolean, can_edit_on: Array<string>}.
 */
export const checkEditPermissions = async (userId) => {
  try {
    const { data: roles, error } = await supabase
      .from(TABLES.USER_ROLES)
      .select('can_edit, can_edit_on')
      .eq('user_id', userId)
      .single();

    if (error) {
      return { can_edit: false, can_edit_on: [] };
    }

    return {
      can_edit: roles?.can_edit || false,
      can_edit_on: Array.isArray(roles?.can_edit_on) ? roles.can_edit_on : []
    };
  } catch {
    return { can_edit: false, can_edit_on: [] };
  }
};

/**
 * Performs a comprehensive validation of both geographical proximity and role-based permissions.
 * This is the primary guard used by UI components to determine if a queue operation is allowed.
 * @param {string} userId - The unique identifier of the user.
 * @param {string} [branchId=null] - The ID of the branch the user is attempting to edit.
 * @param {boolean} [isSuperAdmin=false] - Flag to bypass all location checks for administrators.
 * @returns {Promise<Object>} A promise resolving to {allowed, reason, location, proximity, error?}.
 */
export const verifyUserLocationAndPermissions = async (userId, branchId = null, isSuperAdmin = false) => {
  // console.log('[Geo] Verifying permissions', { userId, branchId, isSuperAdmin });

  try {
    // 1. Super Admin Override
    if (isSuperAdmin) {
      // console.log('[Geo] Super Admin bypass');
      return {
        allowed: true,
        reason: 'Super Admin: you can edit any queue regardless of location.',
        location: null,
        proximity: null,
      };
    }

    // 2. Request User Location
    let userLocation;
    try {
      userLocation = await requestUserLocation();
      // console.log('[Geo] User location:', userLocation);
    } catch (locationError) {
      // console.error('[Geo] Location error:', locationError);
      return {
        allowed: false,
        reason: 'Please allow geolocation services to edit the queue',
        location: null,
        proximity: null,
        error: locationError.message,
      };
    }

    // 3. Check Proximity
    // console.log('[Geo] Checking proximity for branch:', branchId);
    const proximity = await checkUserProximity(userLocation, 100, branchId);
    // console.log('[Geo] Proximity result:', proximity);

    if (!proximity.isAllowed) {
      const branchMsg = branchId ? 'the selected branch' : 'the arcade';
      return {
        allowed: false,
        reason: `You must be within 100 meters of ${branchMsg} to edit the queue.`,
        location: userLocation,
        proximity,
      };
    }

    // 4. Check Roles (Only if location is valid)
    const { can_edit, can_edit_on } = await checkEditPermissions(userId);
    // console.log('[Geo] Roles:', { can_edit, can_edit_on });
    
    // Check global permission
    if (can_edit) {
        // console.log('[Geo] Global edit granted');
      return {
        allowed: true,
        reason: `Access granted at ${proximity.nearestPlace.arcade_name}`,
        location: userLocation,
        proximity,
      };
    }

    // Check branch-specific permission
    // Use the branch ID from the proximity check (the actual place they are near)
    // or the specifically requested branchId
    const targetBranchId = branchId || proximity.nearestPlace.id;
    
    // Ensure string comparison
    const hasBranchPermission = can_edit_on.some(id => String(id) === String(targetBranchId));
    // console.log('[Geo] Branch permission check:', { targetBranchId, hasBranchPermission });

    if (hasBranchPermission) {
       return {
        allowed: true,
        reason: `Access granted for this branch`,
        location: userLocation,
        proximity,
      };
    }

    // 5. Fallback: Role check failed
    // console.log('[Geo] Access denied (no roles)');
    return {
      allowed: false,
      reason: 'You do not have permission to edit this queue',
      location: userLocation,
      proximity,
    };

  } catch (error) {
    return {
      allowed: false,
      reason: 'An error occurred while verifying your location',
      location: null,
      proximity: null,
      error: error.message,
    };
  }
};
