/**
 * Feature Flags Configuration
 * 
 * Defines the available experimental features in the application.
 * These flags are stored in the user_profiles table in Supabase.
 */

export const EXPERIMENTAL_FEATURES = [];

// Helper to get default flags state
export const getDefaultFeatureFlags = () => {
  return EXPERIMENTAL_FEATURES.reduce((acc, feature) => {
    acc[feature.id] = feature.defaultValue;
    return acc;
  }, {});
};
