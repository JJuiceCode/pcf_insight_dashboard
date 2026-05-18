import { KpiCard } from '@/components/dashboard/KpiCard';
import {
  formatKgCO2e,
  formatMonth,
  formatPercentage,
  formatTCO2e,
} from '@/features/emissions/formatters';

/**
 * Executive summary row. Renders the four headline KPI tiles using
 * already-calculated values — no domain math happens in this file.
 */
export interface DashboardSummaryProps {
  totalKgCO2e: number;
  scope3SharePercent: number;
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
  scope3SharePercent,
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
          label="Scope 3 share"
          value={formatPercentage(scope3SharePercent)}
          badge="Scope 3"
          description="Share of total emissions from upstream materials and indirect logistics."
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
