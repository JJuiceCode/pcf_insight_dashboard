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
