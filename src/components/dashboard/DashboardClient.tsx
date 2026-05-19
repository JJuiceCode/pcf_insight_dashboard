'use client';

import { useCallback, useMemo, useState } from 'react';
import { ActivityInputPanel } from '@/components/dashboard/ActivityInputPanel';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { buildDashboardMetrics } from '@/features/emissions/dashboardMetrics';
import { calculateActivitiesWithActiveFactors } from '@/features/emissions/services/emissionCalculationService';
import { listActiveFactorsAt } from '@/features/emissions/services/emissionFactorService';
import type {
  ActivityRecord,
  CalculatedEmissionRow,
  EmissionFactor,
} from '@/features/emissions/types';

/** 오늘 날짜를 `YYYY-MM-DD` ISO 문자열로 반환한다. */
function todayIsoDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * `/` 라우트의 클라이언트 셸.
 *
 * 가시화는 공용 `DashboardView`가 맡고, 이 컴포넌트는 시드 대시보드에서만
 * 필요한 상호작용 두 가지만 관리한다:
 *   1. 사용자가 추가한 활동 레코드 (`extraActivities`)
 *   2. 입력 패널 열림 여부 (`isPanelOpen`)
 *
 * 서버에서 활성 계수로 이미 계산한 `initialRows`를 받고, 사용자가 새로
 * 추가한 활동만 같은 service 함수로 다시 계산해 합친다. 동일한 매칭 규칙
 * (`pickActiveEmissionFactor`)을 사용하므로 미리보기·테이블·KPI 모두 같은
 * 활성 계수에서 파생된다.
 *
 * 재계산 흐름:
 *   handleAdd → setExtraActivities
 *     → useMemo(extraRows)        // 새 활동만 다시 계산
 *     → useMemo(allRows)          // 서버 rows + 추가 rows
 *     → useMemo(metrics)          // 집계
 *     → DashboardView 전역 갱신
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

  // 오늘 기준 카테고리별 활성 계수. 같은 (activityType, name)에 여러 버전이
  // 동시에 유효해도 service가 가장 최근 effectiveFrom을 활성으로 선택한다.
  // 페이지가 새로고침되어 새 props가 들어오기 전까지는 같은 결과를 캐시한다.
  const activeFactors = useMemo(
    () => listActiveFactorsAt(emissionFactors, todayIsoDate()),
    [emissionFactors],
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
      <DashboardView
        metrics={metrics}
        activeFactors={activeFactors}
        onAddClick={openActivityPanel}
      />

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
