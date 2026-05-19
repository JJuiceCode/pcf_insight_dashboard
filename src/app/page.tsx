import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { DomainExplanation } from '@/components/dashboard/DomainExplanation';
import {
  EmissionsOverview,
  type EmissionBreakdownRow,
} from '@/components/dashboard/EmissionsOverview';
import { AppShell } from '@/components/layout/AppShell';
import { Header } from '@/components/layout/Header';
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
import {
  activityRecords,
  emissionFactors,
} from '@/features/emissions/seed';

/**
 * 대시보드 페이지 조립.
 *
 * 도메인 계산은 이 서버 컴포넌트 상단에서 한 번만 수행한다.
 * 계산된 값만 표시용 하위 컴포넌트에 넘겨,
 * 깊은 트리 어디에서도 집계·포맷을 다시 하지 않게 한다.
 */
export default function Home() {
  const rows = calculateActivityRowsWithEmissions(
    activityRecords,
    emissionFactors,
  );

  const totalKgCO2e = calculateTotalEmissions(rows);
  const emissionsByActivityType = calculateEmissionsByActivityType(rows);
  const emissionsByScope = calculateEmissionsByScope(rows);
  const monthlyEmissions = calculateEmissionsByMonth(rows);
  const topContributor = calculateTopContributor(rows);
  const peakMonth = calculatePeakMonth(rows);

  // 총량 대비 비율(%) — 진행 막대·KPI·분해 행이 같은 분모를 쓰도록 여기서 한 번만 계산.
  const shareOfTotal = (value: number): number =>
    totalKgCO2e > 0 ? (value / totalKgCO2e) * 100 : 0;

  const activityTypeRows: EmissionBreakdownRow[] = ACTIVITY_TYPES.map(
    (type) => ({
      label: formatActivityTypeLabel(type),
      emissionKgCO2e: emissionsByActivityType[type],
      percentage: shareOfTotal(emissionsByActivityType[type]),
    }),
  );

  const scopeRows: EmissionBreakdownRow[] = GHG_SCOPES.map((scope) => ({
    label: formatScopeLabel(scope),
    emissionKgCO2e: emissionsByScope[scope],
    percentage: shareOfTotal(emissionsByScope[scope]),
  }));

  const dominantScope = scopeRows.reduce((max, row) => 
    row.emissionKgCO2e > max.emissionKgCO2e ? row : max,
  );
  const dominantScopeSharePercent = shareOfTotal(dominantScope.emissionKgCO2e);

  return (
    <AppShell>
      <Header />

      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:space-y-8 lg:px-8 lg:py-8">
        <DashboardSummary
          totalKgCO2e={totalKgCO2e}
          dominantScopeSharePercent={dominantScopeSharePercent}
          dominantScopeName={dominantScope.label}
          topContributor={
            topContributor
              ? {
                  name: topContributor.name,
                  emissionKgCO2e: topContributor.emissionKgCO2e,
                }
              : null
          }
          peakMonth={peakMonth}
        />

        <DomainExplanation />

        <EmissionsOverview
          emissionsByActivityType={activityTypeRows}
          emissionsByScope={scopeRows}
          monthlyEmissions={monthlyEmissions}
        />
      </div>
    </AppShell>
  );
}
