// src/hooks/use-product-units.ts
import { useMemo } from 'react';
import type { UnitDefinition } from '@/types';

export function useProductUnits(units: string | UnitDefinition | null | undefined): UnitDefinition {
  return useMemo(() => {
    if (typeof units === 'string') {
      try {
        return JSON.parse(units) as UnitDefinition;
      } catch (e) {
        console.error('Failed to parse product units JSON:', e);
        // Return a safe fallback
        return { baseUnit: 'unit', derivedUnits: [] };
      }
    }
    // If it's already an object or null/undefined, return it or a fallback.
    return units || { baseUnit: 'unit', derivedUnits: [] };
  }, [units]);
}