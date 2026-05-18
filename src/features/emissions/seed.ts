/**
 * Seed data for the CT-045 Computer Monitor PCF dashboard.
 *
 * This module exports strongly-typed in-memory data instead of a JSON
 * blob so the dataset is type-checked, easy to import, and trivial to
 * swap for a real API or database later.
 *
 * Domain notes:
 *  - Activity records and emission factors are kept in separate arrays
 *    because real carbon accounting systems version factors
 *    independently of activity data.
 *  - Scope 1 is not present in this dataset. The model still supports
 *    it; downstream code should report scope1 as 0 rather than invent
 *    activity records for it.
 *  - Scope 2 covers purchased electricity (한국전력).
 *  - Scope 3 covers upstream raw materials (플라스틱 1, 플라스틱 2)
 *    and indirect logistics (트럭).
 */

import type {
  ActivityRecord,
  EmissionFactor,
  Product,
} from './types';

export const products: Product[] = [
  {
    id: 'product-ct-045',
    code: 'CT-045',
    name: 'Computer Monitor',
  },
];

/**
 * Emission factor catalog.
 *
 * Each entry is resolvable from an `ActivityRecord` by matching
 * `(activityType, description)` to `(activityType, name)`.
 */
export const emissionFactors: EmissionFactor[] = [
  {
    id: 'ef-electricity-kepco-2025',
    activityType: 'electricity',
    name: '한국전력',
    factor: 0.456,
    factorUnit: 'kgCO2e/kWh',
    scope: 'scope2',
    version: '2025.1',
    effectiveFrom: '2025-01-01',
    sourceLabel: '한국전력 기본값',
    note: 'Purchased electricity is classified as Scope 2.',
  },
  {
    id: 'ef-material-plastic-1-2025',
    activityType: 'material',
    name: '플라스틱 1',
    factor: 2.3,
    factorUnit: 'kgCO2e/kg',
    scope: 'scope3',
    version: '2025.1',
    effectiveFrom: '2025-01-01',
    sourceLabel: '지원자 참고용 배출계수',
    note: 'Upstream raw material emissions are classified as Scope 3.',
  },
  {
    id: 'ef-material-plastic-2-2025',
    activityType: 'material',
    name: '플라스틱 2',
    factor: 3.2,
    factorUnit: 'kgCO2e/kg',
    scope: 'scope3',
    version: '2025.1',
    effectiveFrom: '2025-01-01',
    sourceLabel: '지원자 참고용 배출계수',
    note: 'Upstream raw material emissions are classified as Scope 3.',
  },
  {
    id: 'ef-transport-truck-2025',
    activityType: 'transport',
    name: '트럭',
    factor: 3.5,
    factorUnit: 'kgCO2e/ton-km',
    scope: 'scope3',
    version: '2025.1',
    effectiveFrom: '2025-01-01',
    sourceLabel: '지원자 참고용 배출계수',
    note: 'Indirect logistics-related emissions are classified as Scope 3.',
  },
];

/**
 * Operational activity records for CT-045.
 *
 * Original Korean category labels are normalized to stable English
 * `activityType` keys:
 *   전기   -> 'electricity'
 *   원소재 -> 'material'
 *   운송   -> 'transport'
 */
export const activityRecords: ActivityRecord[] = [
  {
    id: 'activity-2025-01-electricity-001',
    productId: 'product-ct-045',
    date: '2025-01-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 110,
    unit: 'kWh',
  },
  {
    id: 'activity-2025-02-electricity-001',
    productId: 'product-ct-045',
    date: '2025-02-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 112,
    unit: 'kWh',
  },
  {
    id: 'activity-2025-03-electricity-001',
    productId: 'product-ct-045',
    date: '2025-03-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 115,
    unit: 'kWh',
  },
  {
    id: 'activity-2025-04-electricity-001',
    productId: 'product-ct-045',
    date: '2025-04-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 130,
    unit: 'kWh',
  },
  {
    id: 'activity-2025-05-electricity-001',
    productId: 'product-ct-045',
    date: '2025-05-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 120,
    unit: 'kWh',
  },
  {
    id: 'activity-2025-06-electricity-001',
    productId: 'product-ct-045',
    date: '2025-06-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 110,
    unit: 'kWh',
  },
  {
    id: 'activity-2025-07-electricity-001',
    productId: 'product-ct-045',
    date: '2025-07-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 120,
    unit: 'kWh',
  },
  {
    id: 'activity-2025-08-electricity-001',
    productId: 'product-ct-045',
    date: '2025-08-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 111,
    unit: 'kWh',
  },
  {
    id: 'activity-2025-05-electricity-002',
    productId: 'product-ct-045',
    date: '2025-05-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 101,
    unit: 'kWh',
  },

  {
    id: 'activity-2025-01-material-001',
    productId: 'product-ct-045',
    date: '2025-01-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 230,
    unit: 'kg',
  },
  {
    id: 'activity-2025-02-material-001',
    productId: 'product-ct-045',
    date: '2025-02-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 340,
    unit: 'kg',
  },
  {
    id: 'activity-2025-03-material-001',
    productId: 'product-ct-045',
    date: '2025-03-01',
    activityType: 'material',
    description: '플라스틱 2',
    amount: 23,
    unit: 'kg',
  },
  {
    id: 'activity-2025-03-material-002',
    productId: 'product-ct-045',
    date: '2025-03-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 430,
    unit: 'kg',
  },
  {
    id: 'activity-2025-04-material-001',
    productId: 'product-ct-045',
    date: '2025-04-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 510,
    unit: 'kg',
  },
  {
    id: 'activity-2025-05-material-001',
    productId: 'product-ct-045',
    date: '2025-05-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 424,
    unit: 'kg',
  },
  {
    id: 'activity-2025-05-material-002',
    productId: 'product-ct-045',
    date: '2025-05-01',
    activityType: 'material',
    description: '플라스틱 2',
    amount: 40,
    unit: 'kg',
  },
  {
    id: 'activity-2025-06-material-001',
    productId: 'product-ct-045',
    date: '2025-06-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 450,
    unit: 'kg',
  },
  {
    id: 'activity-2025-07-material-001',
    productId: 'product-ct-045',
    date: '2025-07-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 340,
    unit: 'kg',
  },
  {
    id: 'activity-2025-07-material-002',
    productId: 'product-ct-045',
    date: '2025-07-01',
    activityType: 'material',
    description: '플라스틱 2',
    amount: 43,
    unit: 'kg',
  },
  {
    id: 'activity-2025-08-material-001',
    productId: 'product-ct-045',
    date: '2025-08-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 230,
    unit: 'kg',
  },
  {
    id: 'activity-2025-05-material-003',
    productId: 'product-ct-045',
    date: '2025-05-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 232,
    unit: 'kg',
  },

  {
    id: 'activity-2025-01-transport-001',
    productId: 'product-ct-045',
    date: '2025-01-01',
    activityType: 'transport',
    description: '트럭',
    amount: 41,
    unit: 'ton-km',
  },
  {
    id: 'activity-2025-02-transport-001',
    productId: 'product-ct-045',
    date: '2025-02-01',
    activityType: 'transport',
    description: '트럭',
    amount: 211,
    unit: 'ton-km',
  },
  {
    id: 'activity-2025-03-transport-001',
    productId: 'product-ct-045',
    date: '2025-03-01',
    activityType: 'transport',
    description: '트럭',
    amount: 123,
    unit: 'ton-km',
  },
  {
    id: 'activity-2025-04-transport-001',
    productId: 'product-ct-045',
    date: '2025-04-01',
    activityType: 'transport',
    description: '트럭',
    amount: 42,
    unit: 'ton-km',
  },
  {
    id: 'activity-2025-05-transport-001',
    productId: 'product-ct-045',
    date: '2025-05-01',
    activityType: 'transport',
    description: '트럭',
    amount: 123,
    unit: 'ton-km',
  },
  {
    id: 'activity-2025-06-transport-001',
    productId: 'product-ct-045',
    date: '2025-06-01',
    activityType: 'transport',
    description: '트럭',
    amount: 123,
    unit: 'ton-km',
  },
  {
    id: 'activity-2025-07-transport-001',
    productId: 'product-ct-045',
    date: '2025-07-01',
    activityType: 'transport',
    description: '트럭',
    amount: 41,
    unit: 'ton-km',
  },
  {
    id: 'activity-2025-08-transport-001',
    productId: 'product-ct-045',
    date: '2025-08-01',
    activityType: 'transport',
    description: '트럭',
    amount: 123,
    unit: 'ton-km',
  },
  {
    id: 'activity-2025-05-transport-002',
    productId: 'product-ct-045',
    date: '2025-05-01',
    activityType: 'transport',
    description: '트럭',
    amount: 12,
    unit: 'ton-km',
  },
];
