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
 * 특정 제품의 모든 활동 레코드를 삭제한다.
 *
 * 가져오기 화면의 replace-import 흐름에서 사용한다.
 * `productId` 범위를 벗어난 행이나 다른 도메인(EmissionFactor 등)에는 영향을 주지 않는다.
 */
export async function deleteActivitiesByProductId(
  productId: string,
): Promise<number> {
  const result = await prisma.activityRecord.deleteMany({
    where: { productId },
  });
  return result.count;
}

/**
 * 특정 제품의 활동을 "원자적으로 교체"한다.
 *
 * 흐름:
 *   1. 같은 productId의 기존 ActivityRecord를 모두 삭제한다.
 *   2. 새 행을 일괄 삽입한다.
 *
 * 두 작업을 단일 트랜잭션으로 묶어, 중간 실패 시 어느 쪽도 반영되지 않도록 한다.
 * (예: 삭제 직후 insert가 실패하면 운영자가 빈 테이블을 보지 않게 한다.)
 *
 * EmissionFactor 테이블에는 손대지 않는다. 버전 히스토리는 그대로 유지되어,
 * 가져온 활동이 시점에 맞는 활성 계수와 다시 매칭된다.
 *
 * 반환값:
 *  - `deletedCount`: 삭제된 기존 행 수
 *  - `insertedCount`: 새로 적재된 행 수
 */
export async function replaceActivitiesForProductId(
  productId: string,
  rows: readonly CreateActivityInput[],
): Promise<{ deletedCount: number; insertedCount: number }> {
  return prisma.$transaction(async (tx) => {
    const deleted = await tx.activityRecord.deleteMany({
      where: { productId },
    });

    if (rows.length === 0) {
      return { deletedCount: deleted.count, insertedCount: 0 };
    }

    const inserted = await tx.activityRecord.createMany({
      data: rows.map((row) => ({
        productId: row.productId,
        activityType: row.activityType,
        description: row.description,
        amount: row.amount,
        unit: row.unit,
        activityDate: row.activityDate,
      })),
    });

    return { deletedCount: deleted.count, insertedCount: inserted.count };
  });
}
