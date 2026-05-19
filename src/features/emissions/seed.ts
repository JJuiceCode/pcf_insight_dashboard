/**
 * CT-045 컴퓨터 모니터 PCF 대시보드용 시드 데이터.
 *
 * JSON 파일 대신 타입이 지정된 메모리 데이터를 export한다.
 * 타입 검사가 되고 import가 쉬우며, 나중에 API·DB로 바꾸기도 편하다.
 *
 * 도메인 메모:
 *  - 활동 레코드와 배출계수는 배열을 나눠 둔다.
 *    실무에서도 계수 버전과 활동 데이터를 따로 관리하기 때문이다.
 *  - Scope 1 데이터는 없다. 모델은 scope1을 지원하며,
 *    downstream에서는 0으로 보고하고 활동을 임의로 만들지 않는다.
 *  - Scope 2: 구매 전력(한국전력).
 *  - Scope 3: 원자재(플라스틱 1, 플라스틱 2), 물류(트럭).
 */

import type { ActivityRecord, EmissionFactor, Product } from './types';

export const products: Product[] = [
  {
    id: 'product-ct-045',
    code: 'CT-045',
    name: 'Computer Monitor',
  },
];

/**
 * 배출계수 카탈로그 - factor값은 변경될 수 있음
 *
 * `ActivityRecord`의 (activityType, description)과
 * (activityType, name)을 맞추면 각 항목을 찾을 수 있다.
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
    note: '구매 전력은 Scope 2로 분류한다.',
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
    note: '상류 원자재 배출은 Scope 3으로 분류한다.',
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
    note: '상류 원자재 배출은 Scope 3으로 분류한다.',
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
    note: '간접 물류 배출은 Scope 3으로 분류한다.',
  },
];

/**
 * CT-045 운영 활동 레코드.
 *
 * 원본 한글 구분을 아래 `activityType` 키로 통일한다:
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
