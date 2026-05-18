/**
 * Dashboard selectors.
 *
 * The single boundary between domain calculations (`calculations.ts`)
 * and presentation components. Pages and client shells call
 * `projectDashboardData()` once and pass the result down — no UI
 * surface ever re-implements aggregation or label formatting.
 *
 * Keeping this projection in one pure function makes the
 * recalculation step in `DashboardShell` trivial to reason about with
 * `useMemo` and trivial to test in isolation.
 */

import {
  ACTIVITY_TYPES,
  GHG_SCOPES,
  calculateActivityRowsWithEmissions,
  calculateEmissionsByActivityType,
  calculateEmissionsByMonth,
  calculateEmissionsByScope,
  calculatePeakMonth,
  calculateTopContributor,
  calculateTotalEmissions,
  type MonthlyEmission,
  type TopContributor,
} from './calculations';
import {
  formatActivityTypeLabel,
  formatScopeLabel,
} from './formatters';
import type {
  ActivityRecord,
  CalculatedEmissionRow,
  EmissionFactor,
} from './types';

/** Row used by breakdown progress lists (by activity type and by scope). */
export interface EmissionBreakdownRow {
  label: string;
  emissionKgCO2e: number;
  percentage: number;
}

/** Fully prepared dashboard data — ready for direct UI consumption. */
export interface DashboardData {
  rows: readonly CalculatedEmissionRow[];
  totalKgCO2e: number;
  scope3SharePercent: number;
  topContributor: TopContributor | null;
  peakMonth: MonthlyEmission | null;
  activityTypeRows: readonly EmissionBreakdownRow[];
  scopeRows: readonly EmissionBreakdownRow[];
  monthlyEmissions: readonly MonthlyEmission[];
}

export function projectDashboardData(
  activityRecords: readonly ActivityRecord[],
  emissionFactors: readonly EmissionFactor[],
): DashboardData {
  const rows = calculateActivityRowsWithEmissions(
    activityRecords,
    emissionFactors,
  );
  const totalKgCO2e = calculateTotalEmissions(rows);
  const byActivityType = calculateEmissionsByActivityType(rows);
  const byScope = calculateEmissionsByScope(rows);

  const shareOfTotal = (value: number): number =>
    totalKgCO2e > 0 ? (value / totalKgCO2e) * 100 : 0;

  return {
    rows,
    totalKgCO2e,
    scope3SharePercent: shareOfTotal(byScope.scope3),
    topContributor: calculateTopContributor(rows),
    peakMonth: calculatePeakMonth(rows),
    activityTypeRows: ACTIVITY_TYPES.map((type) => ({
      label: formatActivityTypeLabel(type),
      emissionKgCO2e: byActivityType[type],
      percentage: shareOfTotal(byActivityType[type]),
    })),
    scopeRows: GHG_SCOPES.map((scope) => ({
      label: formatScopeLabel(scope),
      emissionKgCO2e: byScope[scope],
      percentage: shareOfTotal(byScope[scope]),
    })),
    monthlyEmissions: calculateEmissionsByMonth(rows),
  };
}
