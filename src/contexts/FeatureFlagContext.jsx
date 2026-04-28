import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { getDefaultFeatureFlags } from '../constants/featureFlags';
import { notifications } from '@mantine/notifications';
import { TABLES } from '../constants/database';

import { FeatureFlagContext } from './FeatureFlagContextDef';


/**
 * Provider component for the Feature Flag context.
 * Manages user-specific experimental feature toggles and persists them to the database.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to be wrapped by the provider.
 * @returns {JSX.Element} The rendered context provider.
 */
export const FeatureFlagProvider = ({ children }) => {
  const { user } = useAuth();
  const [experimentalEnabled, setExperimentalEnabled] = useState(false);
  const [flags, setFlags] = useState(() => getDefaultFeatureFlags()); // Initialize with defaults
  const [isLoading, setIsLoading] = useState(true);

  // Load flags when user changes
  useEffect(() => {
    if (!user) {
      setExperimentalEnabled(false);
      setFlags(getDefaultFeatureFlags());
      setIsLoading(false);
      return;
    }

    const loadFlags = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from(TABLES.USER_PROFILES)
          .select('experimental_features_enabled, experimental_flags')
          .eq('id', user.id)
          .single();

        if (error) {
          // If error (e.g. column doesn't exist yet/migration not run), log and fallback to defaults
          console.warn('Failed to load feature flags, using defaults:', error.message);
          return;
        }

        if (data) {
          setExperimentalEnabled(!!data.experimental_features_enabled);
          // Merge saved flags with defaults to ensure all defined flags exist
          setFlags({
            ...getDefaultFeatureFlags(),
            ...(data.experimental_flags || {})
          });
        }
      } catch (err) {
        console.error('Error in loadFlags:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFlags();
  }, [user]);

  /**
   * Toggles the global experimental features master switch for the current user.
   * @param {boolean} enabled - Whether to enable or disable experimental features.
   * @returns {Promise<void>} A promise that resolves when the update is complete.
   */
  const toggleExperimentalFeatures = async (enabled) => {
    if (!user) return;

    // Optimistic update
    const previousState = experimentalEnabled;
    setExperimentalEnabled(enabled);

    try {
      const { error } = await supabase
        .from(TABLES.USER_PROFILES)
        .update({ experimental_features_enabled: enabled })
        .eq('id', user.id);

      if (error) throw error;

      notifications.show({
        title: enabled ? 'Experimental Features Enabled' : 'Experimental Features Disabled',
        message: enabled ? 'You now have access to experimental features.' : 'Experimental features have been turned off.',
        color: 'blue',
      });

    } catch (error) {
      console.error('Failed to toggle experimental features:', error);
      // Revert optimistic update
      setExperimentalEnabled(previousState);
      notifications.show({
        title: 'Error',
        message: 'Failed to update settings',
        color: 'red',
      });
    }
  };

  const setExperimentalFeaturesEnabled = toggleExperimentalFeatures;

  /**
   * Toggles a specific experimental feature flag for the current user.
   * Only functional if global experimental features are enabled.
   * @param {string} featureId - The unique identifier of the feature flag to toggle.
   * @param {boolean} enabled - The new state of the flag.
   * @returns {Promise<void>} A promise that resolves when the update is complete.
   */
  const toggleFlag = async (featureId, enabled) => {
    if (!user) return;

    if (!experimentalEnabled) {
      console.warn('Cannot toggle flag when experimental features are disabled');
      return;
    }

    // Optimistic update
    const previousFlags = { ...flags };
    const newFlags = { ...flags, [featureId]: enabled };
    setFlags(newFlags);

    try {
      const { error } = await supabase
        .from(TABLES.USER_PROFILES)
        .update({ experimental_flags: newFlags })
        .eq('id', user.id);

      if (error) throw error;

    } catch (error) {
      console.error(`Failed to toggle flag ${featureId}:`, error);
      setFlags(previousFlags);
      notifications.show({
        title: 'Error',
        message: 'Failed to update feature flag',
        color: 'red',
      });
    }
  };

  return (
    <FeatureFlagContext.Provider
      value={{
        experimentalEnabled,
        flags,
        isLoading,
        toggleExperimentalFeatures,
        setExperimentalFeaturesEnabled,
        toggleFlag
      }}
    >
      {children}
    </FeatureFlagContext.Provider>
  );
};
