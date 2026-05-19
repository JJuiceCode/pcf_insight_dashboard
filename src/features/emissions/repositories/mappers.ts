/**
 * DB ↔ 도메인 매핑 유틸.
 *
 * Prisma 스키마는 SQLite의 제약상 enum 대신 문자열을 사용한다.
 * 이 유틸은 DB에서 읽은 값을 도메인 union 타입으로 좁혀, repository 바깥에서는
 * 항상 안전한 도메인 타입만 다루게 한다.
 *
 * 알 수 없는 값을 만나면 일반적으로 그 행은 활성 계수 후보에서 제외하고,
 * 호출 측에서 매칭 실패로 처리한다. 데이터 품질 이슈를 숨기지 않기 위함이다.
 */
import { ACTIVITY_TYPES, GHG_SCOPES } from '../types';
import type {
  ActivityType,
  ActivityUnit,
  FactorUnit,
  GhgScope,
} from '../types';

const ACTIVITY_UNIT_VALUES: readonly ActivityUnit[] = ['kWh', 'kg', 'ton-km'];
const FACTOR_UNIT_VALUES: readonly FactorUnit[] = [
  'kgCO2e/kWh',
  'kgCO2e/kg',
  'kgCO2e/ton-km',
];

function isOneOf<T extends string>(
  candidates: readonly T[],
  value: string,
): value is T {
  return (candidates as readonly string[]).includes(value);
}

export function toActivityType(value: string): ActivityType | null {
  return isOneOf(ACTIVITY_TYPES, value) ? value : null;
}

export function toGhgScope(value: string): GhgScope | null {
  return isOneOf(GHG_SCOPES, value) ? value : null;
}

export function toActivityUnit(value: string): ActivityUnit | null {
  return isOneOf(ACTIVITY_UNIT_VALUES, value) ? value : null;
}

export function toFactorUnit(value: string): FactorUnit | null {
  return isOneOf(FACTOR_UNIT_VALUES, value) ? value : null;
}

/** Prisma DateTime → 도메인이 사용하는 `YYYY-MM-DD` ISO 문자열. */
export function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** `YYYY-MM-DD` 문자열을 UTC 자정 기준의 Date로 변환한다. */
export function fromIsoDate(value: string): Date {
  // 타임존 이슈를 피하기 위해 항상 UTC 자정으로 고정.
  return new Date(`${value}T00:00:00.000Z`);
}
