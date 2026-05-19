'use client';

import { useCallback, useMemo, useState } from 'react';
import { ActivityInputPanel } from '@/components/dashboard/ActivityInputPanel';
import { ActivityTable } from '@/components/dashboard/ActivityTable';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { DomainExplanation } from '@/components/dashboard/DomainExplanation';
import { EmissionsOverview } from '@/components/dashboard/EmissionsOverview';
import { buildDashboardMetrics } from '@/features/emissions/dashboardMetrics';
import { calculateActivitiesWithActiveFactors } from '@/features/emissions/services/emissionCalculationService';
import type {
  ActivityRecord,
  CalculatedEmissionRow,
  EmissionFactor,
} from '@/features/emissions/types';

/**
 * 클라이언트 대시보드 셸.
 *
 * 변경 가능한 상태는 두 가지뿐이다:
 *   1. 사용자가 추가한 활동 레코드 (`extraActivities`)
 *   2. 입력 패널 열림 여부 (`isPanelOpen`)
 *
 * 서버에서 활성 계수로 이미 계산한 `initialRows`를 받고,
 * 사용자가 새로 추가한 활동만 클라이언트에서 같은 service 함수로 계산해
 * 두 결과를 합친다. 동일한 매칭 규칙(`pickActiveEmissionFactor`)을 사용하므로
 * 미리보기·테이블·KPI 모두 같은 활성 계수에서 파생된다.
 *
 * 재계산 흐름:
 *   handleAdd → setExtraActivities
 *     → useMemo(extraRows)        // 새 활동만 다시 계산
 *     → useMemo(allRows)          // 서버 rows + 추가 rows
 *     → useMemo(metrics)          // 집계
 *     → Summary/Overview/Table 동시 갱신
 */
export interface DashboardClientProps {
  initialRows: readonly CalculatedEmissionRow[];
  emissionFactors: readonly EmissionFactor[];
  productId: string;
}

export function DashboardClient({
  initialRows,
  emissionFactors,
  productId,
}: DashboardClientProps) {
  const [extraActivities, setExtraActivities] = useState<
    readonly ActivityRecord[]
  >([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  // 패널을 열 때마다 폼을 새 인스턴스로 다시 마운트해 잔여 상태를 제거한다.
  const [activityFormKey, setActivityFormKey] = useState(0);

  const extraRows = useMemo(
    () =>
      calculateActivitiesWithActiveFactors(extraActivities, emissionFactors),
    [extraActivities, emissionFactors],
  );

  const allRows = useMemo<CalculatedEmissionRow[]>(
    () => [...initialRows, ...extraRows],
    [initialRows, extraRows],
  );

  const metrics = useMemo(() => buildDashboardMetrics(allRows), [allRows]);

  const handleAdd = useCallback((record: ActivityRecord): void => {
    setExtraActivities((prev) => [...prev, record]);
    setIsPanelOpen(false);
  }, []);

  const openActivityPanel = useCallback((): void => {
    setActivityFormKey((key) => key + 1);
    setIsPanelOpen(true);
  }, []);

  const closeActivityPanel = useCallback((): void => {
    setIsPanelOpen(false);
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:space-y-8 lg:px-8 lg:py-8">
      <DashboardSummary
        totalKgCO2e={metrics.totalKgCO2e}
        dominantScopeSharePercent={metrics.dominantScopeSharePercent}
        dominantScopeName={metrics.dominantScopeName}
        topContributor={metrics.topContributor}
        peakMonth={metrics.peakMonth}
      />

      <DomainExplanation />

      <EmissionsOverview
        emissionsByActivityType={metrics.activityTypeRows}
        emissionsByScope={metrics.scopeRows}
        monthlyEmissions={metrics.monthlyEmissions}
      />

      <ActivityTable rows={metrics.rows} onAddClick={openActivityPanel} />

      <ActivityInputPanel
        isOpen={isPanelOpen}
        formKey={activityFormKey}
        onClose={closeActivityPanel}
        onSubmit={handleAdd}
        emissionFactors={emissionFactors}
        productId={productId}
      />
    </div>
  );
}
