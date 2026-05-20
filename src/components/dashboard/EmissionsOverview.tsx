import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import {
  formatKgCO2e,
  formatMonth,
  formatPercentage,
} from '@/features/emissions/formatters';
import type { EmissionBreakdownRow } from '@/features/emissions/dashboardMetrics';
import { clampPercent, cn } from '@/lib/utils';

/**
 * 배출량 집계와 추이를 시각적으로 보여주는 섹션.
 *
 * 활동 유형·GHG Scope는 전체 대비 비율로,
 * 월별 배출량은 최대 월 기준 상대 막대로 표현한다.
 *
 * 차트 라이브러리 없이 Tailwind 막대만 사용해
 * 의존성을 최소화하고 SSR과 동일한 결과를 보장한다.
 */
export type { EmissionBreakdownRow };

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
  const peakMonthKey =
    monthlyPeak > 0
      ? monthlyEmissions.find((m) => m.emissionKgCO2e === monthlyPeak)?.month
      : undefined;

  return (
    <section aria-label="배출량 개요">
      <div className="grid gap-4 lg:grid-cols-3">
        <BreakdownCard
          id="overview-activity"
          title="활동 유형별 배출량"
          caption="총 배출량 대비 비중"
          rows={emissionsByActivityType}
          highlightedLabel={topActivity?.label}
        />

        <BreakdownCard
          id="overview-scope"
          title="GHG Scope별 배출량"
          caption="직접 배출 활동 데이터가 없어 Scope 1은 0으로 표시됩니다."
          rows={emissionsByScope}
          highlightedLabel={topScope?.label}
        />

        <Card aria-labelledby="overview-monthly">
          <SectionHeader
            id="overview-monthly"
            title="월별 배출량 추이"
            caption="막대 크기는 최대 배출 월을 기준으로 표시됩니다."
          />
          {monthlyEmissions.length === 0 ? (
            <EmptyState>표시할 월별 배출 데이터가 없습니다.</EmptyState>
          ) : (
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
          )}
        </Card>
      </div>
    </section>
  );
}

function BreakdownCard({
  id,
  title,
  caption,
  rows,
  highlightedLabel,
}: {
  id: string;
  title: string;
  caption: string;
  rows: readonly EmissionBreakdownRow[];
  highlightedLabel?: string;
}) {
  return (
    <Card aria-labelledby={id}>
      <SectionHeader id={id} title={title} caption={caption} />
      {rows.length === 0 ? (
        <EmptyState>표시할 데이터가 없습니다.</EmptyState>
      ) : (
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
      )}
    </Card>
  );
}

function SectionHeader({
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
        className="text-sm font-semibold tracking-tight text-foreground"
      >
        {title}
      </h3>
      <p className="mt-1 text-xs text-muted">{caption}</p>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-sm text-muted">{children}</p>;
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
        <span className="text-sm font-medium text-foreground">{row.label}</span>
        <span className="text-xs text-muted tabular-nums">
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
            isHighlighted ? 'font-medium text-accent' : 'text-muted',
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
            isPeak ? 'text-accent' : 'text-foreground',
          )}
        >
          {formatMonth(row.month)}
        </span>
        <span className="text-xs text-muted tabular-nums">
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
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'h-2 w-full overflow-hidden rounded-full bg-accent-soft',
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
        isAccent ? 'bg-accent' : 'bg-muted/40',
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
