/**
 * Prisma seed - 평가용 PCF 데이터 초기화 스크립트.
 *
 * 실행: `yarn db:seed` 또는 `yarn prisma db seed`
 *
 * 시드 데이터는 두 종류로 분리한다:
 *   1) EmissionFactor v2025.1 - 4종 (전기/원소재 2종/운송)
 *   2) ActivityRecord - CT-045 모니터의 2025-01 ~ 2025-08 운영 데이터 30건
 *
 * 두 데이터셋은 서로 참조하지 않는다. 활동에는 계수 ID를 박지 않고,
 * 매칭은 활동 시점과 effective 기간을 기반으로 service 레이어에서 수행한다.
 * 따라서 계수 값이 바뀌어도 활동 데이터는 그대로 두고 새 계수 행을
 * 추가하면 대시보드가 자동으로 새 값을 사용한다.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PRODUCT_ID = 'product-ct-045';

/** UTC 자정 기준 Date - 타임존 차이로 인한 날짜 밀림을 막는다. */
function utcDate(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T00:00:00.000Z`);
}

const emissionFactors = [
  {
    activityType: 'electricity',
    name: '한국전력',
    factor: 0.456,
    factorUnit: 'kgCO2e/kWh',
    scope: 'scope2',
    version: '2025.1',
    effectiveFrom: utcDate('2025-01-01'),
    effectiveTo: null as Date | null,
    sourceLabel: '한국전력 기본값',
    note: '구매 전력은 Scope 2.',
  },
  {
    activityType: 'material',
    name: '플라스틱 1',
    factor: 2.3,
    factorUnit: 'kgCO2e/kg',
    scope: 'scope3',
    version: '2025.1',
    effectiveFrom: utcDate('2025-01-01'),
    effectiveTo: null,
    sourceLabel: '지원자 참고용 배출계수',
    note: '원자재 업스트림 배출은 Scope 3.',
  },
  {
    activityType: 'material',
    name: '플라스틱 2',
    factor: 3.2,
    factorUnit: 'kgCO2e/kg',
    scope: 'scope3',
    version: '2025.1',
    effectiveFrom: utcDate('2025-01-01'),
    effectiveTo: null,
    sourceLabel: '지원자 참고용 배출계수',
    note: '원자재 업스트림 배출은 Scope 3.',
  },
  {
    activityType: 'transport',
    name: '트럭',
    factor: 3.5,
    factorUnit: 'kgCO2e/ton-km',
    scope: 'scope3',
    version: '2025.1',
    effectiveFrom: utcDate('2025-01-01'),
    effectiveTo: null,
    sourceLabel: '지원자 참고용 배출계수',
    note: '간접 물류 배출은 Scope 3.',
  },
] as const;

interface ActivitySeed {
  date: string;
  activityType: 'electricity' | 'material' | 'transport';
  description: string;
  amount: number;
  unit: 'kWh' | 'kg' | 'ton-km';
}

const activities: readonly ActivitySeed[] = [
  // 전기 - 한국전력 (kWh)
  {
    date: '2025-01-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 110,
    unit: 'kWh',
  },
  {
    date: '2025-02-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 112,
    unit: 'kWh',
  },
  {
    date: '2025-03-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 115,
    unit: 'kWh',
  },
  {
    date: '2025-04-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 130,
    unit: 'kWh',
  },
  {
    date: '2025-05-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 120,
    unit: 'kWh',
  },
  {
    date: '2025-06-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 110,
    unit: 'kWh',
  },
  {
    date: '2025-07-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 120,
    unit: 'kWh',
  },
  {
    date: '2025-08-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 111,
    unit: 'kWh',
  },
  {
    date: '2025-05-01',
    activityType: 'electricity',
    description: '한국전력',
    amount: 101,
    unit: 'kWh',
  },

  // 원소재 - 플라스틱 1 (kg)
  {
    date: '2025-01-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 230,
    unit: 'kg',
  },
  {
    date: '2025-02-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 340,
    unit: 'kg',
  },
  {
    date: '2025-03-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 430,
    unit: 'kg',
  },
  {
    date: '2025-04-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 510,
    unit: 'kg',
  },
  {
    date: '2025-05-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 424,
    unit: 'kg',
  },
  {
    date: '2025-06-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 450,
    unit: 'kg',
  },
  {
    date: '2025-07-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 340,
    unit: 'kg',
  },
  {
    date: '2025-08-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 230,
    unit: 'kg',
  },
  {
    date: '2025-05-01',
    activityType: 'material',
    description: '플라스틱 1',
    amount: 232,
    unit: 'kg',
  },

  // 원소재 - 플라스틱 2 (kg)
  {
    date: '2025-03-01',
    activityType: 'material',
    description: '플라스틱 2',
    amount: 23,
    unit: 'kg',
  },
  {
    date: '2025-05-01',
    activityType: 'material',
    description: '플라스틱 2',
    amount: 40,
    unit: 'kg',
  },
  {
    date: '2025-07-01',
    activityType: 'material',
    description: '플라스틱 2',
    amount: 43,
    unit: 'kg',
  },

  // 운송 - 트럭 (ton-km)
  {
    date: '2025-01-01',
    activityType: 'transport',
    description: '트럭',
    amount: 41,
    unit: 'ton-km',
  },
  {
    date: '2025-02-01',
    activityType: 'transport',
    description: '트럭',
    amount: 211,
    unit: 'ton-km',
  },
  {
    date: '2025-03-01',
    activityType: 'transport',
    description: '트럭',
    amount: 123,
    unit: 'ton-km',
  },
  {
    date: '2025-04-01',
    activityType: 'transport',
    description: '트럭',
    amount: 42,
    unit: 'ton-km',
  },
  {
    date: '2025-05-01',
    activityType: 'transport',
    description: '트럭',
    amount: 123,
    unit: 'ton-km',
  },
  {
    date: '2025-06-01',
    activityType: 'transport',
    description: '트럭',
    amount: 123,
    unit: 'ton-km',
  },
  {
    date: '2025-07-01',
    activityType: 'transport',
    description: '트럭',
    amount: 41,
    unit: 'ton-km',
  },
  {
    date: '2025-08-01',
    activityType: 'transport',
    description: '트럭',
    amount: 123,
    unit: 'ton-km',
  },
  {
    date: '2025-05-01',
    activityType: 'transport',
    description: '트럭',
    amount: 12,
    unit: 'ton-km',
  },
];

async function main(): Promise<void> {
  // 멱등 실행을 위해 기존 행을 모두 지운다.
  // hiring assignment 평가용 dev DB이므로 cascade 걱정 없이 단순 삭제로 충분하다.
  await prisma.activityRecord.deleteMany();
  await prisma.emissionFactor.deleteMany();

  await prisma.emissionFactor.createMany({
    data: emissionFactors.map((f) => ({
      activityType: f.activityType,
      name: f.name,
      factor: f.factor,
      factorUnit: f.factorUnit,
      scope: f.scope,
      version: f.version,
      effectiveFrom: f.effectiveFrom,
      effectiveTo: f.effectiveTo,
      sourceLabel: f.sourceLabel,
      note: f.note,
    })),
  });

  await prisma.activityRecord.createMany({
    data: activities.map((a) => ({
      productId: PRODUCT_ID,
      activityType: a.activityType,
      description: a.description,
      amount: a.amount,
      unit: a.unit,
      activityDate: utcDate(a.date),
    })),
  });

  const factorCount = await prisma.emissionFactor.count();
  const activityCount = await prisma.activityRecord.count();
  console.log(
    `Seed complete: ${factorCount} emission factors, ${activityCount} activity records.`,
  );
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
