import { Card } from '@/components/ui/Card';
import {
  formatKgCO2e,
  formatMonth,
  formatPercentage,
} from '@/features/emissions/formatters';
import { cn } from '@/lib/utils';

/**
 * 배출량 집계와 추이를 시각적으로 보여주는 섹션.
 *
 * 활동 유형·GHG Scope는 전체 대비 비율로,
 * 월별 배출량은 최대 월 기준 상대 막대로 표현한다.
 *
 * 복잡한 차트 라이브러리 대신
 * 가벼운 Tailwind 기반 시각화로 구성한다.
 */
export interface EmissionBreakdownRow {
  label: string;
  emissionKgCO2e: number;
  percentage: number;
}

export interface MonthlyEmissionRow {
  month: string;
  emissionKgCO2e: number;
}

export interface EmissionsOverviewProps {
  emissionsByActivityType: readonly EmissionBreakdownRow[];
  emissionsByScope: readonly EmissionBreakdownRow[];
  monthlyEmissions: readonly MonthlyEmissionRow[];
}

export function EmissionsOverview({
  emissionsByActivityType,
  emissionsByScope,
  monthlyEmissions,
}: EmissionsOverviewProps) {
  const topActivity = pickTopByEmission(emissionsByActivityType);
  const topScope = pickTopByEmission(emissionsByScope);
  const monthlyPeak = monthlyEmissions.reduce(
    (max, m) => (m.emissionKgCO2e > max ? m.emissionKgCO2e : max),
    0,
  );
  const peakMonthKey = monthlyEmissions.find(
    (m) => m.emissionKgCO2e === monthlyPeak && monthlyPeak > 0,
  )?.month;

  return (
    <section aria-label="Emissions overview">
      <div className="grid gap-4 lg:grid-cols-3">
        <BreakdownCard
          title="By activity type"
          caption="Share of total kgCO2e"
          rows={emissionsByActivityType}
          highlightedLabel={topActivity?.label}
        />

        <BreakdownCard
          title="By GHG Scope"
          caption="Scope 1 is shown as 0 — no direct activity data."
          rows={emissionsByScope}
          highlightedLabel={topScope?.label}
        />

        <Card aria-labelledby="overview-monthly-title">
          <CardHeader
            title="Monthly emissions"
            caption="Bars scale against the peak month."
            id="overview-monthly-title"
          />
          <ul className="mt-4 space-y-3">
            {monthlyEmissions.map((row) => (
              <li key={row.month}>
                <MonthlyRow
                  row={row}
                  peakKg={monthlyPeak}
                  isPeak={row.month === peakMonthKey}
                />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  );
}

function BreakdownCard({
  title,
  caption,
  rows,
  highlightedLabel,
}: {
  title: string;
  caption: string;
  rows: readonly EmissionBreakdownRow[];
  highlightedLabel?: string;
}) {
  const sectionId = `overview-${title.toLowerCase().replace(/\s+/g, '-')}-title`;
  return (
    <Card aria-labelledby={sectionId}>
      <CardHeader title={title} caption={caption} id={sectionId} />
      <ul className="mt-4 space-y-4">
        {rows.map((row) => (
          <li key={row.label}>
            <BreakdownRow
              row={row}
              isHighlighted={row.label === highlightedLabel}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function CardHeader({
  title,
  caption,
  id,
}: {
  title: string;
  caption: string;
  id: string;
}) {
  return (
    <div>
      <h3
        id={id}
        className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
      >
        {title}
      </h3>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        {caption}
      </p>
    </div>
  );
}

function BreakdownRow({
  row,
  isHighlighted,
}: {
  row: EmissionBreakdownRow;
  isHighlighted: boolean;
}) {
  const barWidth = clampPercent(row.percentage);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
          {row.label}
        </span>
        <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
          {formatKgCO2e(row.emissionKgCO2e)}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <ProgressTrack>
          <ProgressFill widthPercent={barWidth} isAccent={isHighlighted} />
        </ProgressTrack>
        <span
          className={cn(
            'w-12 shrink-0 text-right text-xs tabular-nums',
            isHighlighted
              ? 'font-medium text-orange-700 dark:text-orange-300'
              : 'text-neutral-500 dark:text-neutral-400',
          )}
        >
          {formatPercentage(row.percentage)}
        </span>
      </div>
    </div>
  );
}

function MonthlyRow({
  row,
  peakKg,
  isPeak,
}: {
  row: MonthlyEmissionRow;
  peakKg: number;
  isPeak: boolean;
}) {
  const barWidth =
    peakKg > 0 ? clampPercent((row.emissionKgCO2e / peakKg) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span
          className={cn(
            'text-sm font-medium',
            isPeak
              ? 'text-orange-700 dark:text-orange-300'
              : 'text-neutral-900 dark:text-neutral-50',
          )}
        >
          {formatMonth(row.month)}
        </span>
        <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
          {formatKgCO2e(row.emissionKgCO2e)}
        </span>
      </div>
      <ProgressTrack className="mt-1.5">
        <ProgressFill widthPercent={barWidth} isAccent={isPeak} />
      </ProgressTrack>
    </div>
  );
}

function ProgressTrack({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800',
        className,
      )}
    >
      {children}
    </div>
  );
}

function ProgressFill({
  widthPercent,
  isAccent,
}: {
  widthPercent: number;
  isAccent: boolean;
}) {
  return (
    <div
      className={cn(
        'h-2 rounded-full transition-[width] duration-300',
        isAccent
          ? 'bg-orange-500 dark:bg-orange-400'
          : 'bg-neutral-300 dark:bg-neutral-600',
      )}
      style={{ width: `${widthPercent}%` }}
      aria-hidden
    />
  );
}

function pickTopByEmission<R extends { label: string; emissionKgCO2e: number }>(
  rows: readonly R[],
): R | undefined {
  let top: R | undefined;
  for (const row of rows) {
    if (row.emissionKgCO2e <= 0) continue;
    if (!top || row.emissionKgCO2e > top.emissionKgCO2e) top = row;
  }
  return top;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}
