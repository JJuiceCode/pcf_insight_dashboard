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
 * Dashboard page composition.
 *
 * All domain calculation happens once at the top of this server
 * component. The resulting numbers are then passed down to
 * presentation-only components, so no deeply nested component ever
 * re-implements aggregation or formatting.
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

  // Share-of-total percentages — computed here once so progress bars,
  // KPI tiles, and breakdown rows agree on the same denominator.
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

  const scope3SharePercent = shareOfTotal(emissionsByScope.scope3);

  return (
    <AppShell>
      <Header />

      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:space-y-8 lg:px-8 lg:py-8">
        <DashboardSummary
          totalKgCO2e={totalKgCO2e}
          scope3SharePercent={scope3SharePercent}
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
