import { createContext } from 'react';

export const FeatureFlagContext = createContext({
  experimentalEnabled: false,
  flags: {}, // Map of featureId -> boolean
  isLoading: true,
  toggleExperimentalFeatures: async () => { },
  toggleFlag: async () => { },
  setExperimentalFeaturesEnabled: async () => { },
});
