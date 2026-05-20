/**
 * Prisma seed — 평가용 PCF 데이터를 DB에 적재한다.
 *
 * 실행: `yarn db:seed` (또는 `yarn prisma db seed`)
 *
 * 시드 원본은 `src/features/emissions/seed.ts`에 있다.
 *   - `/` 대시보드는 그 in-memory 데이터를 직접 사용한다(DB 의존 없음).
 *   - 이 스크립트는 같은 원본을 SQLite/Postgres에 복사해 `/import` 워크플로우
 *     초기 상태나 통합 테스트, 데모 환경에서 활용할 수 있게 한다.
 *
 * 단일 진실 원본이라 두 화면(코드/DB)이 어긋날 일이 없다. 도메인 타입의
 * `IsoDate` 문자열은 DB 컬럼(`DateTime`)으로 변환만 거쳐 그대로 적재된다.
 */

import { PrismaClient } from '@prisma/client';
import {
  DEMO_ACTIVITY_RECORDS,
  DEMO_EMISSION_FACTORS,
} from '../src/features/emissions/seed';
import type { IsoDate } from '../src/features/emissions/types';

const prisma = new PrismaClient();

/** UTC 자정 기준 Date — 타임존 차이로 인한 날짜 밀림을 막는다. */
function utcDate(isoDate: IsoDate): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

async function main(): Promise<void> {
  // 멱등 실행을 위해 기존 행을 모두 지운다.
  // hiring assignment 평가용 DB이므로 cascade 걱정 없이 단순 삭제로 충분하다.
  await prisma.activityRecord.deleteMany();
  await prisma.emissionFactor.deleteMany();

  await prisma.emissionFactor.createMany({
    data: DEMO_EMISSION_FACTORS.map((f) => ({
      activityType: f.activityType,
      name: f.name,
      factor: f.factor,
      factorUnit: f.factorUnit,
      scope: f.scope,
      version: f.version,
      effectiveFrom: utcDate(f.effectiveFrom),
      // 도메인 타입에는 effectiveTo가 없다(현재 유효한 활성 계수만 표현).
      // 향후 버전 종료를 추적하려면 in-memory seed와 타입에 필드를 함께 추가한다.
      effectiveTo: null,
      sourceLabel: f.sourceLabel,
      note: f.note ?? null,
    })),
  });

  await prisma.activityRecord.createMany({
    data: DEMO_ACTIVITY_RECORDS.map((a) => ({
      productId: a.productId,
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
