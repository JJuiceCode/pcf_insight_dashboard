import { KpiCard } from '@/components/dashboard/KpiCard';
import {
  formatKgCO2e,
  formatMonth,
  formatPercentage,
  formatTCO2e,
} from '@/features/emissions/formatters';

/**
 * 핵심 데이터 요약 KPI 행.
 * 넘겨받은 값으로 대표 KPI 카드만 보여준다.
 */
export interface DashboardSummaryProps {
  totalKgCO2e: number;
  dominantScopeSharePercent: number;
  dominantScopeName: string;
  topContributor: {
    name: string;
    emissionKgCO2e: number;
  } | null;
  peakMonth: {
    month: string;
    emissionKgCO2e: number;
  } | null;
}

const EMPTY = '—';

export function DashboardSummary({
  totalKgCO2e,
  dominantScopeSharePercent,
  dominantScopeName,
  topContributor,
  peakMonth,
}: DashboardSummaryProps) {
  return (
    <section aria-label="Executive summary">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          accent
          label="Total PCF"
          value={formatTCO2e(totalKgCO2e)}
          supportingValue={formatKgCO2e(totalKgCO2e)}
          badge="CT-045"
          description="Total cradle-to-gate emissions across the reporting period."
        />

        <KpiCard
          label="최대 Scope 비중"
          value={formatPercentage(dominantScopeSharePercent)}
          badge={dominantScopeName}
          description={`${dominantScopeName}가 전체 배출량에서 가장 큰 비중을 차지하고 있습니다.`}
        />

        <KpiCard
          label="Top contributor"
          value={topContributor ? topContributor.name : EMPTY}
          supportingValue={
            topContributor
              ? formatKgCO2e(topContributor.emissionKgCO2e)
              : undefined
          }
          description="Largest single emission source across all activities."
        />

        <KpiCard
          label="Peak month"
          value={peakMonth ? formatMonth(peakMonth.month) : EMPTY}
          supportingValue={
            peakMonth ? formatKgCO2e(peakMonth.emissionKgCO2e) : undefined
          }
          description="Month with the highest aggregated emissions."
        />
      </div>
    </section>
  );
}
