/**
 * 대시보드 UI에 필요한 파생 지표를 한 곳에서 계산한다.
 *
 * 입력은 이미 활성 계수가 적용된 `CalculatedEmissionRow[]`이다.
 * 계수 매칭(활동 시점·effective 기간 비교)은 service 레이어에서 끝낸 뒤
 * 같은 입력으로 KPI·Scope·월별·테이블을 동시에 만들어 화면 간 수치가
 * 어긋나지 않도록 한다.
 */

import {
  ACTIVITY_TYPES,
  GHG_SCOPES,
  calculateEmissionsByActivityType,
  calculateEmissionsByMonth,
  calculateEmissionsByScope,
  calculatePeakMonth,
  calculateTopContributor,
  calculateTotalEmissions,
  type MonthlyEmission,
  type TopContributor,
} from './calculations';
import { formatActivityTypeLabel, formatScopeLabel } from './formatters';
import type { CalculatedEmissionRow } from './types';

export interface EmissionBreakdownRow {
  /** 표시용 한글 라벨 (예: "전기", "Scope 2"). */
  label: string;
  emissionKgCO2e: number;
  /** 전체 대비 비율(0~100 범위, 표시용). */
  percentage: number;
}

export interface DashboardMetrics {
  rows: CalculatedEmissionRow[];
  totalKgCO2e: number;
  /** 비중이 가장 큰 Scope의 비율(0~100). */
  dominantScopeSharePercent: number;
  /** 비중이 가장 큰 Scope의 표시 라벨. */
  dominantScopeName: string;
  activityTypeRows: EmissionBreakdownRow[];
  scopeRows: EmissionBreakdownRow[];
  monthlyEmissions: MonthlyEmission[];
  topContributor: TopContributor | null;
  peakMonth: MonthlyEmission | null;
}

/** 전체 대비 비율(0~100). 분모가 0이거나 유한하지 않은 값이면 0을 반환한다. */
export function shareOfTotal(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return (part / total) * 100;
}

/**
 * 활성 계수가 적용된 활동 행에서 대시보드 전체 지표를 한 번에 만든다.
 *
 * 재계산 흐름:
 *   계수 또는 활동 변경 → 서비스가 새 rows 생성 → buildDashboardMetrics
 *     → KPI·개요·테이블 동시 동기화
 */
export function buildDashboardMetrics(
  rows: readonly CalculatedEmissionRow[],
): DashboardMetrics {
  const writableRows = [...rows];
  const totalKgCO2e = calculateTotalEmissions(writableRows);
  const byActivityType = calculateEmissionsByActivityType(writableRows);
  const byScope = calculateEmissionsByScope(writableRows);
  const monthlyEmissions = calculateEmissionsByMonth(writableRows);
  const topContributor = calculateTopContributor(writableRows);
  const peakMonth = calculatePeakMonth(writableRows);

  const activityTypeRows: EmissionBreakdownRow[] = ACTIVITY_TYPES.map(
    (type) => ({
      label: formatActivityTypeLabel(type),
      emissionKgCO2e: byActivityType[type],
      percentage: shareOfTotal(byActivityType[type], totalKgCO2e),
    }),
  );

  const scopeRows: EmissionBreakdownRow[] = GHG_SCOPES.map((scope) => ({
    label: formatScopeLabel(scope),
    emissionKgCO2e: byScope[scope],
    percentage: shareOfTotal(byScope[scope], totalKgCO2e),
  }));

  const dominantScope = scopeRows.reduce((max, row) =>
    row.emissionKgCO2e > max.emissionKgCO2e ? row : max,
  );

  return {
    rows: writableRows,
    totalKgCO2e,
    dominantScopeSharePercent: shareOfTotal(
      dominantScope.emissionKgCO2e,
      totalKgCO2e,
    ),
    dominantScopeName: dominantScope.label,
    activityTypeRows,
    scopeRows,
    monthlyEmissions,
    topContributor,
    peakMonth,
  };
}
