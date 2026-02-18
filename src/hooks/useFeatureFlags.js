import { useContext } from 'react';
import { FeatureFlagContext } from '../contexts/FeatureFlagContextDef';

export const useFeatureFlags = () => useContext(FeatureFlagContext);
