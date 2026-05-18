/**
 * Display formatters for the PCF dashboard.
 *
 * All numerical inputs to these helpers are in their canonical unit
 * (kgCO2e for emissions, fractional percentage value already in the
 * 0..100 range) — formatters never recompute domain numbers, they
 * only style them for display.
 */

import type { ActivityType, GhgScope } from './types';

const EMISSION_DECIMALS = 3;
const PERCENTAGE_DECIMALS = 1;

/**
 * Locale used for thousands separators and decimal points. en-US is
 * chosen for consistent grouping (`11,072.724`) across browsers and
 * server-rendered output.
 */
const NUMBER_LOCALE = 'en-US';

function formatFixedDecimals(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString(NUMBER_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Generic numeric formatter for table cells that may contain either
 * integer amounts (e.g. `110`) or factor values with significant
 * decimals (e.g. `0.456`).
 *
 * Trailing zeros are not forced — display preserves the natural
 * precision of the source value while still grouping thousands.
 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString(NUMBER_LOCALE, {
    maximumFractionDigits: 6,
  });
}

/** e.g. `11,072.724 kgCO2e` */
export function formatKgCO2e(value: number): string {
  return `${formatFixedDecimals(value, EMISSION_DECIMALS)} kgCO2e`;
}

/**
 * e.g. `11.073 tCO2e`
 *
 * Input is in kgCO2e — conversion to tonnes happens here so callers
 * never need to remember to divide by 1,000 before formatting.
 */
export function formatTCO2e(valueInKg: number): string {
  if (!Number.isFinite(valueInKg)) return '—';
  const valueInTonnes = valueInKg / 1000;
  return `${formatFixedDecimals(valueInTonnes, EMISSION_DECIMALS)} tCO2e`;
}

/**
 * Format a percentage value where the input is already in the 0..100
 * range (i.e. `92.4`, not `0.924`).
 *
 * e.g. `92.4%`
 */
export function formatPercentage(value: number): string {
  return `${formatFixedDecimals(value, PERCENTAGE_DECIMALS)}%`;
}

const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  electricity: 'Electricity',
  material: 'Material',
  transport: 'Transport',
};

/** `electricity` -> `Electricity`. */
export function formatActivityTypeLabel(activityType: ActivityType): string {
  return ACTIVITY_TYPE_LABEL[activityType];
}

const SCOPE_LABEL: Record<GhgScope, string> = {
  scope1: 'Scope 1',
  scope2: 'Scope 2',
  scope3: 'Scope 3',
};

/** `scope2` -> `Scope 2`. */
export function formatScopeLabel(scope: GhgScope): string {
  return SCOPE_LABEL[scope];
}

/**
 * Format a `YYYY-MM` calendar-month key for display.
 *
 *  - `'2025-05'` -> `'May 2025'`
 *  - invalid input is returned unchanged so the UI never silently
 *    masks a data problem.
 *
 * `Date.UTC` + `timeZone: 'UTC'` is used to keep the month label
 * stable regardless of the server/browser timezone. This matters for
 * SSR consistency.
 */
export function formatMonth(yyyymm: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(yyyymm);
  if (!match) return yyyymm;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return yyyymm;

  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat(NUMBER_LOCALE, {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
