/**
 * 제품 탄소발자국(PCF) 대시보드용 순수 집계 유틸.
 *
 * 이 파일은 활동·계수 매칭이 끝난 결과(`CalculatedEmissionRow[]`)만 입력으로 받고,
 * 합계·카테고리·월별·기여도 집계만 담당한다. 활성 계수 선택과 매칭 규칙은
 * `services/emissionCalculationService.ts`와 `services/emissionFactorService.ts`에 있다.
 *
 * 설계 규칙:
 *  - 내부 숫자는 모두 kgCO2e. tCO2e 변환은 포맷터에서 처리한다.
 *  - 함수는 순수 함수다. 입력을 바꾸지 않고 외부 상태를 읽지 않는다.
 *  - `isValid: false` 행은 합계에서 제외해 잘못된 0이 섞이지 않게 한다.
 */

import {
  ACTIVITY_TYPES,
  GHG_SCOPES,
  type ActivityType,
  type CalculatedEmissionRow,
  type GhgScope,
} from './types';

/** 유효한 행만 합산한 총 kgCO2e. 유효하지 않은 행은 제외한다. */
export function calculateTotalEmissions(
  rows: readonly CalculatedEmissionRow[],
): number {
  return rows.reduce(
    (sum, row) => (row.isValid ? sum + row.emissionKgCO2e : sum),
    0,
  );
}

/**
 * 활동 유형별 배출량.
 *
 * 합계가 0이어도 모든 활동 유형 키를 반환한다.
 * 대시보드가 카테고리 목록을 조건 없이 안정적으로 그릴 수 있게 한다.
 */
export function calculateEmissionsByActivityType(
  rows: readonly CalculatedEmissionRow[],
): Record<ActivityType, number> {
  const result: Record<ActivityType, number> = {
    electricity: 0,
    material: 0,
    transport: 0,
  };

  for (const row of rows) {
    if (!row.isValid) continue;
    result[row.activity.activityType] += row.emissionKgCO2e;
  }

  return result;
}

/**
 * GHG Scope별 배출량.
 *
 * Scope 1 활동 데이터가 없으면 scope1은 0으로 둔다.
 * 직접 배출을 검토했으나 제공된 데이터가 없음을 보여 주기 위함이다.
 */
export function calculateEmissionsByScope(
  rows: readonly CalculatedEmissionRow[],
): Record<GhgScope, number> {
  const result: Record<GhgScope, number> = {
    scope1: 0,
    scope2: 0,
    scope3: 0,
  };

  for (const row of rows) {
    if (!row.isValid || !row.scope) continue;
    result[row.scope] += row.emissionKgCO2e;
  }

  return result;
}

export interface MonthlyEmission {
  /** `YYYY-MM` 형식. */
  month: string;
  emissionKgCO2e: number;
}

/**
 * 달력 월(`YYYY-MM`)별 배출량. 오름차순 정렬.
 *
 * 월 키는 ISO 날짜 문자열 앞 7자리에서 만든다.
 * `Date` 파싱과 타임존 이슈를 피하기 위한 의도적 선택이다.
 */
export function calculateEmissionsByMonth(
  rows: readonly CalculatedEmissionRow[],
): MonthlyEmission[] {
  const monthToTotal = new Map<string, number>();

  for (const row of rows) {
    if (!row.isValid) continue;
    const month = row.activity.date.slice(0, 7);
    monthToTotal.set(
      month,
      (monthToTotal.get(month) ?? 0) + row.emissionKgCO2e,
    );
  }

  return Array.from(monthToTotal.entries())
    .map(([month, emissionKgCO2e]) => ({ month, emissionKgCO2e }))
    .sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
}

export interface TopContributor {
  /** 설명/계수 이름 (예: "플라스틱 1"). */
  name: string;
  activityType: ActivityType;
  emissionKgCO2e: number;
}

/**
 * 유효한 행 가운데 배출 기여가 가장 큰 설명(예: "플라스틱 1")을 반환한다.
 *
 * 유효한 행이 없으면 `null`을 반환해, 빈 상태와 오해의 소지가 있는 0을 구분할 수 있게 한다.
 */
export function calculateTopContributor(
  rows: readonly CalculatedEmissionRow[],
): TopContributor | null {
  const key = (activityType: ActivityType, name: string): string =>
    `${activityType}::${name}`;

  const totals = new Map<
    string,
    { name: string; activityType: ActivityType; emissionKgCO2e: number }
  >();

  for (const row of rows) {
    if (!row.isValid) continue;
    const k = key(row.activity.activityType, row.activity.description);
    const existing = totals.get(k);
    if (existing) {
      existing.emissionKgCO2e += row.emissionKgCO2e;
    } else {
      totals.set(k, {
        name: row.activity.description,
        activityType: row.activity.activityType,
        emissionKgCO2e: row.emissionKgCO2e,
      });
    }
  }

  let top: TopContributor | null = null;
  for (const candidate of totals.values()) {
    if (!top || candidate.emissionKgCO2e > top.emissionKgCO2e) {
      top = candidate;
    }
  }
  return top;
}

/**
 * 배출량이 가장 큰 월(`YYYY-MM`).
 * 유효한 행이 없으면 `null`을 반환한다.
 */
export function calculatePeakMonth(
  rows: readonly CalculatedEmissionRow[],
): MonthlyEmission | null {
  const monthly = calculateEmissionsByMonth(rows);
  if (monthly.length === 0) return null;

  let peak = monthly[0];
  for (let i = 1; i < monthly.length; i += 1) {
    if (monthly[i].emissionKgCO2e > peak.emissionKgCO2e) {
      peak = monthly[i];
    }
  }
  return peak;
}

/** kgCO2e를 tCO2e로 변환 (1 tCO2e = 1,000 kgCO2e). */
export function kgToTonnes(kg: number): number {
  return kg / 1000;
}

/**
 * UI가 활동 유형과 Scope를 동일한 순서로 렌더링할 수 있도록
 * 도메인 상수 목록을 다시 공개한다.
 */
export { ACTIVITY_TYPES, GHG_SCOPES };
