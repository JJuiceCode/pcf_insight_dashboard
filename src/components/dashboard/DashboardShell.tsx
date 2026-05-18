'use client';

import { useMemo, useState } from 'react';

import { ActivityInputPanel } from '@/components/dashboard/ActivityInputPanel';
import { ActivityTable } from '@/components/dashboard/ActivityTable';
import { DashboardSummary } from '@/components/dashboard/DashboardSummary';
import { DomainExplanation } from '@/components/dashboard/DomainExplanation';
import { EmissionsOverview } from '@/components/dashboard/EmissionsOverview';
import { projectDashboardData } from '@/features/emissions/selectors';
import type {
  ActivityRecord,
  EmissionFactor,
} from '@/features/emissions/types';

import type { NewActivityInput } from './ActivityForm';

/**
 * Client-side dashboard composition.
 *
 * Owns the live activity records list. Every dashboard surface
 * downstream — KPI tiles, overview breakdowns, audit table — derives
 * from a single call to `projectDashboardData()`, so adding a record
 * via the slide-over panel triggers exactly one recalculation pass:
 *
 *   setActivityRecords([...prev, new])
 *     → useMemo dependency change
 *       → projectDashboardData() recomputes the full DashboardData
 *         → React re-renders the consumers
 *
 * No effects, no per-section recalculation, no stale derived values.
 */
export interface DashboardShellProps {
  initialActivityRecords: readonly ActivityRecord[];
  emissionFactors: readonly EmissionFactor[];
}

export function DashboardShell({
  initialActivityRecords,
  emissionFactors,
}: DashboardShellProps) {
  const [activityRecords, setActivityRecords] = useState<
    readonly ActivityRecord[]
  >(initialActivityRecords);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const data = useMemo(
    () => projectDashboardData(activityRecords, emissionFactors),
    [activityRecords, emissionFactors],
  );

  const handleAddActivity = (input: NewActivityInput): void => {
    setActivityRecords((previous) => [
      ...previous,
      { id: generateActivityId(), ...input },
    ]);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:space-y-8 lg:px-8 lg:py-8">
        <DashboardSummary
          totalKgCO2e={data.totalKgCO2e}
          scope3SharePercent={data.scope3SharePercent}
          topContributor={
            data.topContributor
              ? {
                  name: data.topContributor.name,
                  emissionKgCO2e: data.topContributor.emissionKgCO2e,
                }
              : null
          }
          peakMonth={data.peakMonth}
        />

        <DomainExplanation />

        <EmissionsOverview
          emissionsByActivityType={data.activityTypeRows}
          emissionsByScope={data.scopeRows}
          monthlyEmissions={data.monthlyEmissions}
        />

        <ActivityTable
          rows={data.rows}
          onAddActivity={() => setIsPanelOpen(true)}
        />
      </div>

      <ActivityInputPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onSubmit={handleAddActivity}
        emissionFactors={emissionFactors}
      />
    </>
  );
}

/**
 * Locally unique activity id.
 *
 * `crypto.randomUUID()` is preferred when available (modern browsers,
 * Node 18+); the fallback is fine for non-persisted in-memory state.
 */
function generateActivityId(): string {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return `activity-${globalThis.crypto.randomUUID()}`;
  }
  return `activity-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
