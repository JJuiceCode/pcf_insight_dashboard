/**
 * 배출계수 영속화 레이어. **server-only**.
 *
 * 이 모듈은 Prisma에 의존하는 유일한 계수 접근 지점이다.
 * 도메인 타입(`EmissionFactor`)으로 정제된 데이터만 외부로 노출하고,
 * 활성 계수 선택 같은 비즈니스 규칙은 service 레이어에서 처리한다.
 *
 * 클라이언트 컴포넌트에서 직접 import하면 Prisma 의존성 때문에 번들이
 * 실패하지만, 명시적인 호출 지점은 서버 컴포넌트와 server-only service에 한정한다.
 */

import type { EmissionFactor as PrismaEmissionFactor } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ActivityType, EmissionFactor } from '../types';
import { toActivityType, toFactorUnit, toGhgScope, toIsoDate } from './mappers';

/**
 * 같은 (activityType, name, version) 조합은 한 시점에 하나만 활성이라고 가정한다.
 * 활성 기간이 겹치는 데이터는 service 단에서 가장 최근 `effectiveFrom`을 사용한다.
 */
function fromPrismaRow(row: PrismaEmissionFactor): EmissionFactor | null {
  const activityType = toActivityType(row.activityType);
  const scope = toGhgScope(row.scope);
  const factorUnit = toFactorUnit(row.factorUnit);

  if (!activityType || !scope || !factorUnit) {
    // 알 수 없는 도메인 값이 들어온 행은 매칭 후보에서 제외한다.
    // 데이터를 임의 보정하지 않고 호출 측이 "계수 없음" 상태를 그대로 보게 한다.
    return null;
  }

  return {
    id: row.id,
    activityType,
    name: row.name,
    factor: row.factor,
    factorUnit,
    scope,
    version: row.version,
    effectiveFrom: toIsoDate(row.effectiveFrom),
    sourceLabel: row.sourceLabel ?? '',
    note: row.note ?? undefined,
  };
}

/** 모든 계수 행을 효력 시작일 오름차순으로 가져온다(버전 히스토리 포함). */
export async function findAllEmissionFactors(): Promise<EmissionFactor[]> {
  const rows = await prisma.emissionFactor.findMany({
    orderBy: [
      { activityType: 'asc' },
      { name: 'asc' },
      { effectiveFrom: 'asc' },
    ],
  });
  return rows.map(fromPrismaRow).filter((f): f is EmissionFactor => f !== null);
}

/**
 * 주어진 활동 시점에 유효한 계수 후보를 반환한다.
 *
 * Active 조건:
 *   effectiveFrom <= activityDate
 *   AND (effectiveTo IS NULL OR activityDate <= effectiveTo)
 *
 * 여러 버전이 동시에 유효할 경우 service에서 최신 `effectiveFrom`을 고른다.
 */
export async function findActiveFactorCandidates(params: {
  activityType: ActivityType;
  description: string;
  activityDate: Date;
}): Promise<EmissionFactor[]> {
  const { activityType, description, activityDate } = params;

  const rows = await prisma.emissionFactor.findMany({
    where: {
      activityType,
      name: description,
      effectiveFrom: { lte: activityDate },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: activityDate } }],
    },
    orderBy: { effectiveFrom: 'desc' },
  });

  return rows.map(fromPrismaRow).filter((f): f is EmissionFactor => f !== null);
}
