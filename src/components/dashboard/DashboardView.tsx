import { ActivityTable } from '@/components/dashboard/ActivityTable';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { DomainExplanation } from '@/components/dashboard/DomainExplanation';
import { EmissionsOverview } from '@/components/dashboard/EmissionsOverview';
import type { DashboardMetrics } from '@/features/emissions/dashboardMetrics';
import type { EmissionFactor } from '@/features/emissions/types';

/**
 * 대시보드 본문(KPI · 도메인 안내 · 배출 개요 · 활동 테이블)을 모아 둔 공유 뷰.
 *
 * `/`는 사용자가 활동을 추가할 수 있어 `DashboardClient`가 상태를 들고
 * 이 뷰를 래핑하고, `/import`는 가져오기 결과를 검증하는 읽기 전용 화면이라
 * 이 뷰를 서버에서 그대로 렌더링한다.
 *
 * 계산 결과는 모두 `DashboardMetrics`로 미리 정리되어 들어오기 때문에
 * 이 컴포넌트는 표시 역할만 한다. 데이터 fetch, 계산, 정렬 등 비즈니스
 * 로직은 service 레이어에서 처리한 뒤 주입한다.
 *
 * 'use client' 디렉티브를 두지 않아 서버 컴포넌트에서도 그대로 import 할 수 있고,
 * 클라이언트 컴포넌트(`DashboardClient`)에서 import 하면 클라이언트 트리의
 * 일부로 합쳐진다. 자체적인 상태는 갖지 않는다.
 */
export interface DashboardViewProps {
  metrics: DashboardMetrics;
  activeFactors: readonly EmissionFactor[];
  /**
   * ActivityTable 헤더의 "활동 추가" 버튼 콜백.
   * 가져오기 화면처럼 단건 추가가 필요 없는 경우는 생략하면 버튼이 숨겨진다.
   */
  onAddClick?: () => void;
}

export function DashboardView({
  metrics,
  activeFactors,
  onAddClick,
}: DashboardViewProps) {
  return (
    <div className="space-y-6 lg:space-y-8">
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

      <ActivityTable
        rows={metrics.rows}
        activeFactors={activeFactors}
        onAddClick={onAddClick}
      />
    </div>
  );
}
