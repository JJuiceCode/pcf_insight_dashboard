/**
 * 평가용 PCF 데모 데이터 (in-memory).
 *
 * 이 파일이 시드 데이터의 **단일 진실 원본**이다.
 *
 *   - `/` 대시보드는 DB 상태와 무관하게 항상 이 데이터를 사용한다.
 *   - `prisma/seed.ts`는 이 모듈을 import 해서 동일한 데이터를 SQLite/Postgres에
 *     적재한다. 코드와 DB 시드가 같은 원본을 공유하므로 두 화면이 어긋날 수 없다.
 *
 * `/`가 DB에 의존하지 않게 만든 이유:
 *   - 평가자가 어느 환경에서 열어도 같은 데모 화면을 본다.
 *   - Vercel 배포 직후 DB 시드를 깜빡해도 `/`는 안정적으로 표시된다.
 *   - 가져온 데이터(`/import`, productId=IMPORTED_PRODUCT_ID)와 데모 데이터
 *     (productId=DEMO_PRODUCT_ID)가 진짜로 분리된다. 같은 DB 테이블에 두 productId가
 *     섞여 있어도 `/`가 시드를 직접 보기 때문에 이중 집계 위험이 사라진다.
 *
 * 타입 결정:
 *   - 도메인 형태(`ActivityRecord`, `EmissionFactor`)를 그대로 사용한다.
 *   - 날짜는 `IsoDate`(YYYY-MM-DD) 문자열. DB 어댑터(`prisma/seed.ts`)에서
 *     Date 객체로 변환한다.
 */

import { DEMO_PRODUCT_ID } from './constants';
import type { ActivityRecord, EmissionFactor } from './types';

/** EmissionFactor 4종 (전기 1 / 원소재 2 / 운송 1). 모두 2025.1 버전, 효력 종료일 없음. */
export const DEMO_EMISSION_FACTORS: readonly EmissionFactor[] = [
  {
    id: 'demo-factor-electricity-han-2025-1',
    activityType: 'electricity',
    name: '한국전력',
    factor: 0.456,
    factorUnit: 'kgCO2e/kWh',
    scope: 'scope2',
    version: '2025.1',
    effectiveFrom: '2025-01-01',
    sourceLabel: '한국전력 기본값',
    note: '구매 전력은 Scope 2.',
  },
  {
    id: 'demo-factor-material-pl1-2025-1',
    activityType: 'material',
    name: '플라스틱 1',
    factor: 2.3,
    factorUnit: 'kgCO2e/kg',
    scope: 'scope3',
    version: '2025.1',
    effectiveFrom: '2025-01-01',
    sourceLabel: '지원자 참고용 배출계수',
    note: '원자재 업스트림 배출은 Scope 3.',
  },
  {
    id: 'demo-factor-material-pl2-2025-1',
    activityType: 'material',
    name: '플라스틱 2',
    factor: 3.2,
    factorUnit: 'kgCO2e/kg',
    scope: 'scope3',
    version: '2025.1',
    effectiveFrom: '2025-01-01',
    sourceLabel: '지원자 참고용 배출계수',
    note: '원자재 업스트림 배출은 Scope 3.',
  },
  {
    id: 'demo-factor-transport-truck-2025-1',
    activityType: 'transport',
    name: '트럭',
    factor: 3.5,
    factorUnit: 'kgCO2e/ton-km',
    scope: 'scope3',
    version: '2025.1',
    effectiveFrom: '2025-01-01',
    sourceLabel: '지원자 참고용 배출계수',
    note: '간접 물류 배출은 Scope 3.',
  },
];

/**
 * CT-045 모니터의 2025-01 ~ 2025-08 운영 활동 30건.
 *
 * 활동 발생일 순서는 DB 시드와 동일하게 카테고리별로 묶어 둔다. ActivityTable의
 * "날짜 최신순/오래된순" 정렬에서 결정적인 순서가 나오도록 같은 월의 중복 행에는
 * 인덱스로 구분되는 명시적 id를 부여한다.
 */
export const DEMO_ACTIVITY_RECORDS: readonly ActivityRecord[] = [
  // 전기 - 한국전력 (kWh)
  {
    id: 'demo-act-001',
    productId: DEMO_PRODUCT_ID,
    date: '2025-01-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 110,
    unit: 'kWh',
  },
  {
    id: 'demo-act-002',
    productId: DEMO_PRODUCT_ID,
    date: '2025-02-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 112,
    unit: 'kWh',
  },
  {
    id: 'demo-act-003',
    productId: DEMO_PRODUCT_ID,
    date: '2025-03-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 115,
    unit: 'kWh',
  },
  {
    id: 'demo-act-004',
    productId: DEMO_PRODUCT_ID,
    date: '2025-04-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 130,
    unit: 'kWh',
  },
  {
    id: 'demo-act-005',
    productId: DEMO_PRODUCT_ID,
    date: '2025-05-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 120,
    unit: 'kWh',
  },
  {
    id: 'demo-act-006',
    productId: DEMO_PRODUCT_ID,
    date: '2025-06-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 110,
    unit: 'kWh',
  },
  {
    id: 'demo-act-007',
    productId: DEMO_PRODUCT_ID,
    date: '2025-07-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 120,
    unit: 'kWh',
  },
  {
    id: 'demo-act-008',
    productId: DEMO_PRODUCT_ID,
    date: '2025-08-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 111,
    unit: 'kWh',
  },
  {
    id: 'demo-act-009',
    productId: DEMO_PRODUCT_ID,
    date: '2025-05-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 101,
    unit: 'kWh',
  },

  // 원소재 - 플라스틱 1 (kg)
  {
    id: 'demo-act-010',
    productId: DEMO_PRODUCT_ID,
    date: '2025-01-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 230,
    unit: 'kg',
  },
  {
    id: 'demo-act-011',
    productId: DEMO_PRODUCT_ID,
    date: '2025-02-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 340,
    unit: 'kg',
  },
  {
    id: 'demo-act-012',
    productId: DEMO_PRODUCT_ID,
    date: '2025-03-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 430,
    unit: 'kg',
  },
  {
    id: 'demo-act-013',
    productId: DEMO_PRODUCT_ID,
    date: '2025-04-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 510,
    unit: 'kg',
  },
  {
    id: 'demo-act-014',
    productId: DEMO_PRODUCT_ID,
    date: '2025-05-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 424,
    unit: 'kg',
  },
  {
    id: 'demo-act-015',
    productId: DEMO_PRODUCT_ID,
    date: '2025-06-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 450,
    unit: 'kg',
  },
  {
    id: 'demo-act-016',
    productId: DEMO_PRODUCT_ID,
    date: '2025-07-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 340,
    unit: 'kg',
  },
  {
    id: 'demo-act-017',
    productId: DEMO_PRODUCT_ID,
    date: '2025-08-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 230,
    unit: 'kg',
  },
  {
    id: 'demo-act-018',
    productId: DEMO_PRODUCT_ID,
    date: '2025-05-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 232,
    unit: 'kg',
  },

  // 원소재 - 플라스틱 2 (kg)
  {
    id: 'demo-act-019',
    productId: DEMO_PRODUCT_ID,
    date: '2025-03-01',
    activityType: 'material',
    description: '플라스틱 2',
    amount: 23,
    unit: 'kg',
  },
  {
    id: 'demo-act-020',
    productId: DEMO_PRODUCT_ID,
    date: '2025-05-01',
    activityType: 'material',
    description: '플라스틱 2',
    amount: 40,
    unit: 'kg',
  },
  {
    id: 'demo-act-021',
    productId: DEMO_PRODUCT_ID,
    date: '2025-07-01',
    activityType: 'material',
    description: '플라스틱 2',
    amount: 43,
    unit: 'kg',
  },

  // 운송 - 트럭 (ton-km)
  {
    id: 'demo-act-022',
    productId: DEMO_PRODUCT_ID,
    date: '2025-01-01',
    activityType: 'transport',
    description: '트럭',
    amount: 41,
    unit: 'ton-km',
  },
  {
    id: 'demo-act-023',
    productId: DEMO_PRODUCT_ID,
    date: '2025-02-01',
    activityType: 'transport',
    description: '트럭',
    amount: 211,
    unit: 'ton-km',
  },
  {
    id: 'demo-act-024',
    productId: DEMO_PRODUCT_ID,
    date: '2025-03-01',
    activityType: 'transport',
    description: '트럭',
    amount: 123,
    unit: 'ton-km',
  },
  {
    id: 'demo-act-025',
    productId: DEMO_PRODUCT_ID,
    date: '2025-04-01',
    activityType: 'transport',
    description: '트럭',
    amount: 42,
    unit: 'ton-km',
  },
  {
    id: 'demo-act-026',
    productId: DEMO_PRODUCT_ID,
    date: '2025-05-01',
    activityType: 'transport',
    description: '트럭',
    amount: 123,
    unit: 'ton-km',
  },
  {
    id: 'demo-act-027',
    productId: DEMO_PRODUCT_ID,
    date: '2025-06-01',
    activityType: 'transport',
    description: '트럭',
    amount: 123,
    unit: 'ton-km',
  },
  {
    id: 'demo-act-028',
    productId: DEMO_PRODUCT_ID,
    date: '2025-07-01',
    activityType: 'transport',
    description: '트럭',
    amount: 41,
    unit: 'ton-km',
  },
  {
    id: 'demo-act-029',
    productId: DEMO_PRODUCT_ID,
    date: '2025-08-01',
    activityType: 'transport',
    description: '트럭',
    amount: 123,
    unit: 'ton-km',
  },
  {
    id: 'demo-act-030',
    productId: DEMO_PRODUCT_ID,
    date: '2025-05-01',
    activityType: 'transport',
    description: '트럭',
    amount: 12,
    unit: 'ton-km',
  },
];
