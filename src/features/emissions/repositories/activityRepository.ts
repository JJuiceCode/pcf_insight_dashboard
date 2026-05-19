/**
 * 활동 레코드 영속화 레이어. **server-only**.
 *
 * 활동 레코드에는 계산된 배출량이나 계수 스냅샷을 저장하지 않는다.
 * 계수가 바뀌면 활동 데이터를 수정하지 않고도 새 계수로 다시 계산할 수 있어야 하기 때문이다.
 */

import type { ActivityRecord as PrismaActivityRecord } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ActivityRecord } from '../types';
import {
  fromIsoDate,
  toActivityType,
  toActivityUnit,
  toIsoDate,
} from './mappers';

function fromPrismaRow(row: PrismaActivityRecord): ActivityRecord | null {
  const activityType = toActivityType(row.activityType);
  const unit = toActivityUnit(row.unit);
  if (!activityType || !unit) return null;

  return {
    id: row.id,
    productId: row.productId,
    date: toIsoDate(row.activityDate),
    activityType,
    description: row.description,
    amount: row.amount,
    unit,
  };
}

/** 특정 제품의 모든 활동 레코드를 활동 발생일 오름차순으로 가져온다. */
export async function findActivitiesByProductId(
  productId: string,
): Promise<ActivityRecord[]> {
  const rows = await prisma.activityRecord.findMany({
    where: { productId },
    orderBy: { activityDate: 'asc' },
  });

  return rows.map(fromPrismaRow).filter((a): a is ActivityRecord => a !== null);
}

/** 새 활동을 저장하고, 정제된 도메인 형태로 반환한다. */
export async function createActivity(
  input: Omit<ActivityRecord, 'id'>,
): Promise<ActivityRecord> {
  const row = await prisma.activityRecord.create({
    data: {
      productId: input.productId,
      activityType: input.activityType,
      description: input.description,
      amount: input.amount,
      unit: input.unit,
      activityDate: fromIsoDate(input.date),
    },
  });

  const parsed = fromPrismaRow(row);
  if (!parsed) {
    // 방금 저장한 행이 도메인 enum과 어긋난다면 스키마/시드 문제이므로 명시적으로 알린다.
    throw new Error(
      `Saved activity row contains invalid domain values: ${row.id}`,
    );
  }
  return parsed;
}

/**
 * 일괄 삽입용 입력 형태.
 *
 * 도메인 `ActivityRecord`는 `date: IsoDate`(YYYY-MM-DD)지만, 일괄 삽입 경로에서는
 * Excel 파서가 이미 정규화한 `Date`(UTC 자정)를 그대로 받아 변환 비용을 줄인다.
 */
export interface CreateActivityInput {
  productId: string;
  activityType: ActivityRecord['activityType'];
  description: string;
  amount: number;
  unit: ActivityRecord['unit'];
  activityDate: Date;
}

/**
 * 활동 레코드 일괄 삽입.
 *
 * 입력은 호출 측(서비스 레이어)에서 이미 도메인 검증·중복 제거가 끝났다고 가정한다.
 * 빈 배열은 0을 반환하고 DB 호출도 하지 않는다.
 */
export async function createManyActivities(
  rows: readonly CreateActivityInput[],
): Promise<number> {
  if (rows.length === 0) return 0;

  const result = await prisma.activityRecord.createMany({
    data: rows.map((row) => ({
      productId: row.productId,
      activityType: row.activityType,
      description: row.description,
      amount: row.amount,
      unit: row.unit,
      activityDate: row.activityDate,
    })),
  });

  return result.count;
}

/**
 * 중복 감지에 사용하는 활동 식별 키.
 *
 * (productId, activityDate, activityType, description, amount) 조합으로
 * 같은 활동을 두 번 저장하지 않도록 한다. DB에 unique 제약을 추가하는 대신
 * 서비스 레이어에서 비교하므로, 정책이 바뀌어도 스키마 마이그레이션이 필요 없다.
 */
export interface ActivityCompositeKeyRow {
  activityType: string;
  description: string;
  amount: number;
  activityDate: Date;
}

/**
 * 중복 검사용으로 특정 제품의 활동 키 컬럼만 조회한다.
 *
 * 전체 행이 아니라 식별에 필요한 4개 컬럼만 가져와 메모리 사용을 줄인다.
 * 도메인 정제(enum 좁히기)는 수행하지 않는다. 식별이 목적이므로 raw 문자열도 그대로 비교한다.
 */
export async function findActivityKeysByProductId(
  productId: string,
): Promise<ActivityCompositeKeyRow[]> {
  const rows = await prisma.activityRecord.findMany({
    where: { productId },
    select: {
      activityType: true,
      description: true,
      amount: true,
      activityDate: true,
    },
  });
  return rows;
}
