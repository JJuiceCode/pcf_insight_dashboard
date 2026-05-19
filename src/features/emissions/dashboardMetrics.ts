/**
 * 대시보드 UI에 필요한 파생 지표를 한 곳에서 계산한다.
 *
 * `calculations.ts`는 순수 도메인 집계만 담당하고,
 * 이 모듈은 라벨 포맷·비율·dominant scope 같은
 * UI 친화적인 파생값을 한 번에 만들어 클라이언트 컴포넌트가
 * 단일 진입점(`buildDashboardMetrics`)으로 재계산할 수 있게 한다.
 */

import {
  ACTIVITY_TYPES,
  GHG_SCOPES,
  calculateActivityRowsWithEmissions,
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
import type {
  ActivityRecord,
  CalculatedEmissionRow,
  EmissionFactor,
} from './types';

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
 * 활동 레코드와 배출계수로부터 대시보드 전체 지표를 한 번에 만든다.
 *
 * 재계산 흐름:
 *   activityRecords 변경 → buildDashboardMetrics → KPI·개요·테이블 동시 동기화
 *
 * 모든 표시 데이터가 같은 입력에서 파생되므로,
 * 제출 직후에도 화면 간 수치가 어긋나지 않는다.
 */
export function buildDashboardMetrics(
  activityRecords: readonly ActivityRecord[],
  emissionFactors: readonly EmissionFactor[],
): DashboardMetrics {
  const rows = calculateActivityRowsWithEmissions(
    activityRecords,
    emissionFactors,
  );
  const totalKgCO2e = calculateTotalEmissions(rows);
  const byActivityType = calculateEmissionsByActivityType(rows);
  const byScope = calculateEmissionsByScope(rows);
  const monthlyEmissions = calculateEmissionsByMonth(rows);
  const topContributor = calculateTopContributor(rows);
  const peakMonth = calculatePeakMonth(rows);

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
    rows,
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
