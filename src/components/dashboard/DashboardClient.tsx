'use client';

import { useCallback, useMemo, useState } from 'react';
import { ActivityInputPanel } from '@/components/dashboard/ActivityInputPanel';
import { ActivityTable } from '@/components/dashboard/ActivityTable';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { DomainExplanation } from '@/components/dashboard/DomainExplanation';
import {
  EmissionsOverview,
  type EmissionBreakdownRow,
} from '@/components/dashboard/EmissionsOverview';
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
} from '@/features/emissions/calculations';
import {
  formatActivityTypeLabel,
  formatScopeLabel,
} from '@/features/emissions/formatters';
import type {
  ActivityRecord,
  EmissionFactor,
} from '@/features/emissions/types';

/**
 * 클라이언트 대시보드 셸.
 *
 * 사용자 입력 상태를 관리하고,
 * 하나의 `useMemo`에서 계산 결과를 파생한다.
 *
 * 하위 컴포넌트는 동일한 `rows`를 기준으로 렌더링되어
 * 제출 이후에도 대시보드 전체 수치가 일관되게 유지된다.
 */
export interface DashboardClientProps {
  initialActivityRecords: readonly ActivityRecord[];
  emissionFactors: readonly EmissionFactor[];
  productId: string;
}

export function DashboardClient({
  initialActivityRecords,
  emissionFactors,
  productId,
}: DashboardClientProps) {
  const [extraActivities, setExtraActivities] = useState<
    readonly ActivityRecord[]
  >([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activityFormKey, setActivityFormKey] = useState(0);

  const allActivityRecords = useMemo(
    () => [...initialActivityRecords, ...extraActivities],
    [initialActivityRecords, extraActivities],
  );

  // 모든 표시 데이터는 이 memo 결과에서 파생한다.
  // 화면마다 개별 계산하지 않아 동일한 집계 기준을 유지한다.
  const calculated = useMemo(() => {
    const rows = calculateActivityRowsWithEmissions(
      allActivityRecords,
      emissionFactors,
    );
    const totalKgCO2e = calculateTotalEmissions(rows);
    const byActivityType = calculateEmissionsByActivityType(rows);
    const byScope = calculateEmissionsByScope(rows);
    const monthlyEmissions = calculateEmissionsByMonth(rows);
    const topContributor = calculateTopContributor(rows);
    const peakMonth = calculatePeakMonth(rows);

    const shareOfTotal = (value: number): number =>
      totalKgCO2e > 0 ? (value / totalKgCO2e) * 100 : 0;

    const activityTypeRows: EmissionBreakdownRow[] = ACTIVITY_TYPES.map(
      (type) => ({
        label: formatActivityTypeLabel(type),
        emissionKgCO2e: byActivityType[type],
        percentage: shareOfTotal(byActivityType[type]),
      }),
    );

    const scopeRows: EmissionBreakdownRow[] = GHG_SCOPES.map((scope) => ({
      label: formatScopeLabel(scope),
      emissionKgCO2e: byScope[scope],
      percentage: shareOfTotal(byScope[scope]),
    }));

    const dominantScope = scopeRows.reduce((max, row) =>
      row.emissionKgCO2e > max.emissionKgCO2e ? row : max,
    );

    return {
      rows,
      totalKgCO2e,
      dominantScopeSharePercent: shareOfTotal(dominantScope.emissionKgCO2e),
      dominantScopeName: dominantScope.label,
      activityTypeRows,
      scopeRows,
      monthlyEmissions,
      topContributor,
      peakMonth,
    };
  }, [allActivityRecords, emissionFactors]);

  const handleAdd = useCallback((record: ActivityRecord): void => {
    setExtraActivities((prev) => [...prev, record]);
    setIsPanelOpen(false);
  }, []);

  const openActivityPanel = useCallback((): void => {
    setActivityFormKey((key) => key + 1);
    setIsPanelOpen(true);
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:space-y-8 lg:px-8 lg:py-8">
      <DashboardSummary
        totalKgCO2e={calculated.totalKgCO2e}
        dominantScopeSharePercent={calculated.dominantScopeSharePercent}
        dominantScopeName={calculated.dominantScopeName}
        topContributor={
          calculated.topContributor
            ? {
                name: calculated.topContributor.name,
                emissionKgCO2e: calculated.topContributor.emissionKgCO2e,
              }
            : null
        }
        peakMonth={calculated.peakMonth}
      />

      <DomainExplanation />

      <EmissionsOverview
        emissionsByActivityType={calculated.activityTypeRows}
        emissionsByScope={calculated.scopeRows}
        monthlyEmissions={calculated.monthlyEmissions}
      />

      <ActivityTable rows={calculated.rows} onAddClick={openActivityPanel} />

      <ActivityInputPanel
        isOpen={isPanelOpen}
        formKey={activityFormKey}
        onClose={() => setIsPanelOpen(false)}
        onSubmit={handleAdd}
        emissionFactors={emissionFactors}
        productId={productId}
      />
    </div>
  );
}
