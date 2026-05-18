/**
 * Pure calculation utilities for the Product Carbon Footprint (PCF)
 * dashboard.
 *
 * Calculation flow:
 *   Activity Data
 *     -> Emission Factor Matching
 *     -> Emission Calculation (amount × factor)
 *     -> GHG Scope Classification
 *     -> Aggregation (totals, by activity type, by scope, by month)
 *
 * Design rules:
 *  - All internal numbers are kgCO2e. Conversion to tCO2e is left to
 *    the formatter layer.
 *  - Activity records and emission factors are matched at calculation
 *    time, not stored together, because real carbon accounting systems
 *    manage factor versions independently of activity data.
 *  - Functions are pure: they never mutate inputs and never read
 *    external state.
 *  - Invalid rows (missing factor) are kept in the row list with
 *    `isValid: false` so the UI can surface data-quality issues, but
 *    they never contribute to aggregated totals.
 */

import type {
  ActivityRecord,
  ActivityType,
  CalculatedEmissionRow,
  EmissionFactor,
  GhgScope,
} from './types';
import { ACTIVITY_TYPES, GHG_SCOPES } from './types';

/**
 * Resolve the emission factor that applies to a given activity record.
 *
 * Matching key: `activityType` + `description` (vs. factor `name`).
 *
 * Real SaaS carbon accounting systems usually resolve factors via
 * controlled IDs, factor catalog relations, and effective-date
 * windows. This seed dataset is intentionally simpler and keys off the
 * human-facing description string, which is good enough for a first
 * foundation phase.
 */
export function findEmissionFactorForActivity(
  activity: ActivityRecord,
  emissionFactors: readonly EmissionFactor[],
): EmissionFactor | undefined {
  return emissionFactors.find(
    (factor) =>
      factor.activityType === activity.activityType &&
      factor.name === activity.description,
  );
}

/**
 * Calculate the emission contribution of a single activity record.
 *
 * Returns a row that is either valid (factor resolved, emission
 * computed) or invalid (factor missing, emission forced to 0 with an
 * `errorMessage`). The invalid case is explicit so callers cannot
 * accidentally fold a "0" from a missing factor into aggregated
 * totals.
 */
export function calculateActivityEmission(
  activity: ActivityRecord,
  emissionFactors: readonly EmissionFactor[],
): CalculatedEmissionRow {
  const matchedFactor = findEmissionFactorForActivity(
    activity,
    emissionFactors,
  );

  if (!matchedFactor) {
    return {
      activity,
      emissionKgCO2e: 0,
      isValid: false,
      errorMessage: `No emission factor matched for activityType="${activity.activityType}" description="${activity.description}".`,
    };
  }

  const emissionKgCO2e = activity.amount * matchedFactor.factor;

  return {
    activity,
    emissionFactor: matchedFactor,
    emissionKgCO2e,
    scope: matchedFactor.scope,
    isValid: true,
  };
}

/**
 * Apply emission calculation to every activity record in the dataset.
 *
 * The output preserves input order so the UI can render an
 * activity-level table without re-sorting.
 */
export function calculateActivityRowsWithEmissions(
  activityRecords: readonly ActivityRecord[],
  emissionFactors: readonly EmissionFactor[],
): CalculatedEmissionRow[] {
  return activityRecords.map((activity) =>
    calculateActivityEmission(activity, emissionFactors),
  );
}

/** Total kgCO2e across all valid rows. Invalid rows are ignored. */
export function calculateTotalEmissions(
  rows: readonly CalculatedEmissionRow[],
): number {
  return rows.reduce(
    (sum, row) => (row.isValid ? sum + row.emissionKgCO2e : sum),
    0,
  );
}

/**
 * Emissions grouped by activity type.
 *
 * Every known activity type is present in the result, even if its
 * total is 0, so the dashboard can render a stable category list
 * without conditional rendering.
 */
export function calculateEmissionsByActivityType(
  rows: readonly CalculatedEmissionRow[],
): Record<ActivityType, number> {
  const result: Record<ActivityType, number> = {
    electricity: 0,
    material: 0,
    transport: 0,
  };

  for (const row of rows) {
    if (!row.isValid) continue;
    result[row.activity.activityType] += row.emissionKgCO2e;
  }

  return result;
}

/**
 * Emissions grouped by GHG scope.
 *
 * Scope 1 is intentionally returned as 0 when the dataset has no
 * direct emission activities: the dashboard needs to show that
 * Scope 1 was considered but had no provided data, rather than
 * hiding the bucket entirely.
 */
export function calculateEmissionsByScope(
  rows: readonly CalculatedEmissionRow[],
): Record<GhgScope, number> {
  const result: Record<GhgScope, number> = {
    scope1: 0,
    scope2: 0,
    scope3: 0,
  };

  for (const row of rows) {
    if (!row.isValid || !row.scope) continue;
    result[row.scope] += row.emissionKgCO2e;
  }

  return result;
}

export interface MonthlyEmission {
  /** `YYYY-MM` */
  month: string;
  emissionKgCO2e: number;
}

/**
 * Emissions grouped by calendar month (`YYYY-MM`), sorted ascending.
 *
 * The month key is derived from the first 7 characters of the ISO
 * date string. This is intentional: it avoids `Date` parsing and the
 * associated timezone surprises for month-level aggregation.
 */
export function calculateEmissionsByMonth(
  rows: readonly CalculatedEmissionRow[],
): MonthlyEmission[] {
  const monthToTotal = new Map<string, number>();

  for (const row of rows) {
    if (!row.isValid) continue;
    const month = row.activity.date.slice(0, 7);
    monthToTotal.set(
      month,
      (monthToTotal.get(month) ?? 0) + row.emissionKgCO2e,
    );
  }

  return Array.from(monthToTotal.entries())
    .map(([month, emissionKgCO2e]) => ({ month, emissionKgCO2e }))
    .sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
}

export interface TopContributor {
  /** Description / factor name, e.g. "플라스틱 1". */
  name: string;
  activityType: ActivityType;
  emissionKgCO2e: number;
}

/**
 * The single description (e.g. "플라스틱 1") that contributes the
 * largest share of total emissions across all valid rows.
 *
 * Returns `null` when there are no valid rows so callers can render
 * an explicit empty state instead of a misleading zero.
 */
export function calculateTopContributor(
  rows: readonly CalculatedEmissionRow[],
): TopContributor | null {
  const key = (activityType: ActivityType, name: string): string =>
    `${activityType}::${name}`;

  const totals = new Map<
    string,
    { name: string; activityType: ActivityType; emissionKgCO2e: number }
  >();

  for (const row of rows) {
    if (!row.isValid) continue;
    const k = key(row.activity.activityType, row.activity.description);
    const existing = totals.get(k);
    if (existing) {
      existing.emissionKgCO2e += row.emissionKgCO2e;
    } else {
      totals.set(k, {
        name: row.activity.description,
        activityType: row.activity.activityType,
        emissionKgCO2e: row.emissionKgCO2e,
      });
    }
  }

  let top: TopContributor | null = null;
  for (const candidate of totals.values()) {
    if (!top || candidate.emissionKgCO2e > top.emissionKgCO2e) {
      top = candidate;
    }
  }

  return top;
}

/**
 * The month (`YYYY-MM`) with the highest total emissions.
 *
 * Returns `null` when there are no valid rows.
 */
export function calculatePeakMonth(
  rows: readonly CalculatedEmissionRow[],
): MonthlyEmission | null {
  const monthly = calculateEmissionsByMonth(rows);
  if (monthly.length === 0) return null;

  let peak = monthly[0];
  for (let i = 1; i < monthly.length; i += 1) {
    if (monthly[i].emissionKgCO2e > peak.emissionKgCO2e) {
      peak = monthly[i];
    }
  }
  return peak;
}

/** Convert kgCO2e to tCO2e (1 tCO2e = 1,000 kgCO2e). */
export function kgToTonnes(kg: number): number {
  return kg / 1000;
}

/**
 * Build per-activity-type lists of available description options from
 * the emission factor catalog.
 *
 * Used by input forms that should only offer descriptions which will
 * actually resolve to a factor at calculation time — preventing
 * "Missing factor" rows from being introduced from the UI layer.
 */
export function getDescriptionOptionsByActivityType(
  emissionFactors: readonly EmissionFactor[],
): Record<ActivityType, string[]> {
  const result: Record<ActivityType, string[]> = {
    electricity: [],
    material: [],
    transport: [],
  };
  for (const factor of emissionFactors) {
    const list = result[factor.activityType];
    if (!list.includes(factor.name)) list.push(factor.name);
  }
  return result;
}

/**
 * Re-export of the canonical lists so the UI layer can iterate over
 * activity types and scopes in a stable, agreed order without
 * importing from two modules.
 */
export { ACTIVITY_TYPES, GHG_SCOPES };
