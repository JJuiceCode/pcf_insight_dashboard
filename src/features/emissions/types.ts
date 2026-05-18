/**
 * Domain types for the Product Carbon Footprint (PCF) dashboard.
 *
 * Modeling principles:
 *  - Activity records describe what happened operationally (kWh consumed,
 *    kg of material used, ton-km of transport, ...).
 *  - Emission factors describe how those activities are converted into
 *    kgCO2e. They are versioned independently because real carbon
 *    accounting systems update factor values over time and need to be
 *    able to recalculate historical emissions against the factor that
 *    was effective at a given point in time.
 *  - Emissions are computed as: activity amount × emission factor.
 *    The calculation itself does NOT live in this module.
 */

/**
 * GHG Protocol scope classification.
 *  - scope1: Direct emissions (e.g. on-site combustion). Not present in
 *    the current CT-045 dataset, but kept in the type so downstream
 *    code can represent it explicitly as 0 instead of silently
 *    omitting the bucket.
 *  - scope2: Indirect emissions from purchased electricity / heat.
 *  - scope3: Other indirect emissions across the value chain
 *    (upstream raw materials, logistics, ...).
 */
export type GhgScope = 'scope1' | 'scope2' | 'scope3';

/**
 * High-level activity categories present in the CT-045 dataset.
 * Korean source labels are normalized to these stable English keys:
 *  - 전기   -> 'electricity'
 *  - 원소재 -> 'material'
 *  - 운송   -> 'transport'
 */
export type ActivityType = 'electricity' | 'material' | 'transport';

/** Unit of measure for an activity record. */
export type ActivityUnit = 'kWh' | 'kg' | 'ton-km';

/**
 * Unit of measure for an emission factor. The numerator is always
 * kgCO2e, the denominator must match the activity unit it applies to.
 */
export type FactorUnit = 'kgCO2e/kWh' | 'kgCO2e/kg' | 'kgCO2e/ton-km';

/**
 * Mapping between an activity unit and the factor unit that is allowed
 * to consume it. Calculation code can use this to enforce unit
 * consistency at the type level.
 */
export type FactorUnitFor<U extends ActivityUnit> = U extends 'kWh'
  ? 'kgCO2e/kWh'
  : U extends 'kg'
    ? 'kgCO2e/kg'
    : U extends 'ton-km'
      ? 'kgCO2e/ton-km'
      : never;

/** ISO date string in `YYYY-MM-DD` form. */
export type IsoDate = string;

/** A product whose carbon footprint is being measured. */
export interface Product {
  id: string;
  /** Human-facing product code, e.g. "CT-045". */
  code: string;
  name: string;
}

/**
 * A single operational activity tied to a product.
 *
 * Activity records intentionally do NOT carry an emission factor or a
 * scope. Those are looked up from the emission factor catalog so that
 * historical activity data does not need to be rewritten when factors
 * are updated.
 */
export interface ActivityRecord {
  id: string;
  productId: string;
  /** Date the activity is attributed to (month-level granularity). */
  date: IsoDate;
  activityType: ActivityType;
  /**
   * Source-of-truth label from the original dataset
   * (e.g. "한국전력", "플라스틱 1", "트럭"). Used to resolve the
   * matching emission factor.
   */
  description: string;
  amount: number;
  unit: ActivityUnit;
}

/**
 * A versioned emission factor used to convert an activity amount into
 * kgCO2e. Real carbon accounting systems manage factor versions
 * independently from activity data, so we model the same separation
 * here.
 */
export interface EmissionFactor {
  id: string;
  activityType: ActivityType;
  /** Matches `ActivityRecord.description` for resolution. */
  name: string;
  /** Numeric factor value in `factorUnit`. */
  factor: number;
  factorUnit: FactorUnit;
  /** GHG Protocol scope this factor contributes to. */
  scope: GhgScope;
  /** Human-readable version tag, e.g. "2025.1". */
  version: string;
  /** First date this factor version is considered effective. */
  effectiveFrom: IsoDate;
  /** Short label describing where the factor value comes from. */
  sourceLabel: string;
  /** Optional free-form note (domain context, caveats, ...). */
  note?: string;
}
