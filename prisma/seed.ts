/**
 * Prisma seed — 평가용 PCF 데이터 중 **DB에 반드시 있어야 하는 행만** 적재한다.
 *
 * 실행: `yarn db:seed` (또는 `yarn prisma db seed`)
 *
 * 시드 대상:
 *   - EmissionFactor 4종 (전기/원소재 2종/운송)
 *     → `/import`의 계산 파이프라인이 DB에서 활성 계수를 조회한다.
 *     → 이 행이 없으면 가져온 활동이 모두 invalid 처리된다.
 *
 * 시드하지 않는 것:
 *   - ActivityRecord
 *     → 데모 활동은 `src/features/emissions/seed.ts`의 in-memory 데이터로
 *       `/` 대시보드가 직접 렌더링한다. DB에는 두지 않는다.
 *     → 가져온 활동은 `/import` 워크플로우가 `IMPORTED_PRODUCT_ID`로 적재한다.
 *     → 두 경로 모두 prisma seed가 활동 행을 미리 깔아 둘 필요가 없다.
 *
 * 부수 효과(의도된 baseline 복원):
 *   - 기존 `ActivityRecord` 행도 모두 비운다. `db:seed`는 "DB를 데모 초기 상태로
 *     되돌리는" 명령이므로, 가져온 데이터가 남아 있어 `/import` 화면이 이전 상태로
 *     보이는 것을 막는다. 운영자가 가져온 데이터를 보존하고 싶다면 in-app
 *     "엑셀 데이터 지우기"를 쓰지 않듯이 `db:seed`도 다시 실행하지 않으면 된다.
 *
 * 단일 진실 원본:
 *   - 시드 도메인 데이터는 `src/features/emissions/seed.ts`에 있다.
 *   - 이 스크립트는 그 모듈에서 EmissionFactor 정의를 그대로 가져와 DB 컬럼
 *     (`DateTime`)으로 변환만 거쳐 적재한다.
 */

import { PrismaClient } from '@prisma/client';
import { DEMO_EMISSION_FACTORS } from '../src/features/emissions/seed';
import type { IsoDate } from '../src/features/emissions/types';

const prisma = new PrismaClient();

/** UTC 자정 기준 Date — 타임존 차이로 인한 날짜 밀림을 막는다. */
function utcDate(isoDate: IsoDate): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

async function main(): Promise<void> {
  // 멱등 실행. EmissionFactor는 같은 행을 다시 깔기 위해, ActivityRecord는
  // 가져온 데이터까지 baseline으로 되돌리기 위해 모두 비운다.
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

  const factorCount = await prisma.emissionFactor.count();
  console.log(
    `Seed complete: ${factorCount} emission factors. ` +
      `(ActivityRecord는 시드 대상 아님 — 데모 활동은 in-memory, 가져온 활동은 /import에서 적재됩니다.)`,
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
