'use client';

import { useCallback, useMemo, useState } from 'react';
import { ActivityInputPanel } from '@/components/dashboard/ActivityInputPanel';
import { ActivityTable } from '@/components/dashboard/ActivityTable';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { DomainExplanation } from '@/components/dashboard/DomainExplanation';
import { EmissionsOverview } from '@/components/dashboard/EmissionsOverview';
import { buildDashboardMetrics } from '@/features/emissions/dashboardMetrics';
import type {
  ActivityRecord,
  EmissionFactor,
} from '@/features/emissions/types';

/**
 * 클라이언트 대시보드 셸.
 *
 * 변경 가능한 상태는 두 가지뿐이다:
 *   1. 사용자가 추가한 활동 레코드 (`extraActivities`)
 *   2. 입력 패널 열림 여부 (`isPanelOpen`)
 *
 * 모든 표시 데이터는 `buildDashboardMetrics` 한 곳에서 파생되므로
 * 제출 직후 KPI·개요·테이블이 항상 같은 계산 결과를 공유한다.
 *
 * 재계산 흐름:
 *   handleAdd → setExtraActivities → useMemo(metrics) 재계산
 *     → DashboardSummary / EmissionsOverview / ActivityTable 동시 갱신
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
  // 패널을 열 때마다 폼을 새 인스턴스로 다시 마운트해 잔여 상태를 제거한다.
  const [activityFormKey, setActivityFormKey] = useState(0);

  const allActivityRecords = useMemo<readonly ActivityRecord[]>(
    () => [...initialActivityRecords, ...extraActivities],
    [initialActivityRecords, extraActivities],
  );

  const metrics = useMemo(
    () => buildDashboardMetrics(allActivityRecords, emissionFactors),
    [allActivityRecords, emissionFactors],
  );

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
