import { supabase } from './supabase';

/**
 * Check if geolocation permission is already granted
 * @returns {Promise<string>} Permission state: 'granted', 'denied', 'prompt', or 'unavailable'
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
  } catch (error) {
    console.error('Error checking geolocation permission:', error);
    return navigator.geolocation ? 'prompt' : 'unavailable';
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} coord1 - First coordinate {latitude, longitude}
 * @param {Object} coord2 - Second coordinate {latitude, longitude}
 * @returns {number} Distance in meters
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
 * Request user's current location
 * @returns {Promise<Object>} Promise that resolves to {latitude, longitude}
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
 * Find the nearest branch to the user's location
 * @param {Object} userLocation - User's location {latitude, longitude}
 * @returns {Promise<Object>} Promise that resolves to {nearestBranch, distance}
 */
export const findNearestBranch = async (userLocation) => {
  try {
    const { data: places, error } = await supabase
      .from('allowed_places')
      .select('*');

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
  } catch (error) {
    console.error('Error finding nearest branch:', error);
    throw error;
  }
};

/**
 * Check if user is within allowed distance of any allowed place
 * @param {Object} userLocation - User's location {latitude, longitude}
 * @param {number} maxDistance - Maximum allowed distance in meters (default: 100)
 * @param {string} branchId - Optional: Check proximity to specific branch only
 * @returns {Promise<Object>} Promise that resolves to {isAllowed, nearestPlace, distance}
 */
export const checkUserProximity = async (userLocation, maxDistance = 100, branchId = null) => {
  try {
    let query = supabase
      .from('allowed_places')
      .select('*');
    
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

    return {
      isAllowed: minDistance <= maxDistance,
      nearestPlace,
      distance: Math.round(minDistance),
    };
  } catch (error) {
    console.error('Error checking proximity:', error);
    throw error;
  }
};

/**
 * Check if user has edit permissions
 * @param {string} userId - User's ID
 * @returns {Promise<boolean>} Promise that resolves to true if user has edit permissions
 */
export const checkEditPermissions = async (userId) => {
  try {
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('can_edit')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error checking permissions:', error);
      return false;
    }

    return roles?.can_edit || false;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
};

/**
 * Verify user location and permissions
 * @param {string} userId - User's ID
 * @param {string} branchId - Optional: Verify proximity to specific branch
 * @returns {Promise<Object>} Promise that resolves to {allowed, reason, location, proximity}
 */
export const verifyUserLocationAndPermissions = async (userId, branchId = null) => {
  try {
    // Check if user has edit permissions
    const hasEditPermissions = await checkEditPermissions(userId);
    
    if (!hasEditPermissions) {
      return {
        allowed: false,
        reason: 'You do not have edit permissions',
        location: null,
        proximity: null,
      };
    }

    // Request user location
    let userLocation;
    try {
      userLocation = await requestUserLocation();
    } catch (locationError) {
      return {
        allowed: false,
        reason: 'Please allow geolocation services to edit the queue',
        location: null,
        proximity: null,
        error: locationError.message,
      };
    }

    // Check proximity to allowed places
    const proximity = await checkUserProximity(userLocation, 100, branchId);

    if (!proximity.isAllowed) {
      const branchMsg = branchId ? 'the selected branch' : 'the arcade';
      return {
        allowed: false,
        reason: `You must be within 100 meters of ${branchMsg} to edit the queue.`,
        location: userLocation,
        proximity,
      };
    }

    return {
      allowed: true,
      reason: `Access granted at ${proximity.nearestPlace.arcade_name}`,
      location: userLocation,
      proximity,
    };
  } catch (error) {
    console.error('Error verifying location and permissions:', error);
    return {
      allowed: false,
      reason: 'An error occurred while verifying your location',
      location: null,
      proximity: null,
      error: error.message,
    };
  }
};
