import { useState, useMemo } from 'react';
import { useBranch } from './useBranch';

/**
 * Hook for managing cabinet selection state in multi-cabinet arcades
 * @returns {Object} Cabinet state and helpers
 */
export const useCabinetManager = () => {
  const { selectedBranch } = useBranch();
  const [selectedCabinet, setSelectedCabinet] = useState(1);

  // Get cabinet count from branch, default to 1
  const cabinetCount = selectedBranch?.cab_count || 1;
  
  // Determine if there are multiple cabinets
  const hasMultipleCabinets = useMemo(() => cabinetCount >= 2, [cabinetCount]);

  // Derive the effective cabinet - if the selected cabinet is invalid for this branch,
  // fall back to cabinet 1. This handles branch switching without needing setState in effects.
  const effectiveCabinet = useMemo(() => {
    return selectedCabinet > cabinetCount ? 1 : selectedCabinet;
  }, [selectedCabinet, cabinetCount]);

  return {
    selectedCabinet: effectiveCabinet,
    setSelectedCabinet,
    cabinetCount,
    hasMultipleCabinets
  };
};
