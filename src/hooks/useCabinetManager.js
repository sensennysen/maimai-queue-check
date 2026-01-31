import { useState, useEffect, useMemo } from 'react';
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

  // Reset to cabinet 1 when branch changes
  useEffect(() => {
    setSelectedCabinet(1);
  }, [selectedBranch?.id]);

  return {
    selectedCabinet,
    setSelectedCabinet,
    cabinetCount,
    hasMultipleCabinets
  };
};
