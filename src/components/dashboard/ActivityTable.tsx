import { Badge } from '@/components/ui/Badge';
import {
  formatActivityTypeLabel,
  formatKgCO2e,
  formatNumber,
  formatScopeLabel,
} from '@/features/emissions/formatters';
import type { CalculatedEmissionRow } from '@/features/emissions/types';
import { cn } from '@/lib/utils';

/**
 * Read-only verification table.
 *
 * Operators use this to audit the full calculation flow per record:
 *   activity → factor match → emission → GHG scope → factor version.
 *
 * No calculation, mutation, or formatting decision happens at the row
 * level — values come from `CalculatedEmissionRow` and dedicated
 * formatters, so a missing emission factor is surfaced as `Needs
 * review` without falling back to a fake number.
 */
export interface ActivityTableProps {
  rows: readonly CalculatedEmissionRow[];
}

const PLACEHOLDER = '—';

export function ActivityTable({ rows }: ActivityTableProps) {
  const invalidCount = rows.reduce(
    (count, row) => (row.isValid ? count : count + 1),
    0,
  );

  return (
    <section aria-labelledby="activity-table-title">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Operator verification
            </p>
            <h3
              id="activity-table-title"
              className="mt-1 text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
            >
              Activity records & factor matching
            </h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Read-only audit view of each activity, the resolved emission factor, and the calculated kgCO2e.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">{rows.length} records</Badge>
            {invalidCount > 0 ? (
              <Badge variant="warning">{invalidCount} need review</Badge>
            ) : (
              <Badge variant="success">All matched</Badge>
            )}
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-sm">
            <thead className="bg-neutral-50 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:bg-neutral-950/60 dark:text-neutral-400">
              <tr>
                <Th>Date</Th>
                <Th>Activity</Th>
                <Th>Description</Th>
                <Th align="right">Amount</Th>
                <Th>Unit</Th>
                <Th align="right">Factor</Th>
                <Th>Factor unit</Th>
                <Th align="right">Emissions</Th>
                <Th>Scope</Th>
                <Th>Version</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <ActivityRow key={row.activity.id} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ActivityRow({ row }: { row: CalculatedEmissionRow }) {
  const { activity, emissionFactor, scope, isValid } = row;

  return (
    <tr
      className={cn(
        'border-t border-neutral-200 align-middle dark:border-neutral-800',
        isValid
          ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
          : 'bg-amber-50/60 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/30',
      )}
    >
      <Td mono>{activity.date}</Td>
      <Td>
        <span className="font-medium text-neutral-900 dark:text-neutral-50">
          {formatActivityTypeLabel(activity.activityType)}
        </span>
      </Td>
      <Td>{activity.description}</Td>
      <Td align="right" mono>
        {formatNumber(activity.amount)}
      </Td>
      <Td muted>{activity.unit}</Td>
      <Td align="right" mono>
        {emissionFactor ? formatNumber(emissionFactor.factor) : PLACEHOLDER}
      </Td>
      <Td muted>{emissionFactor?.factorUnit ?? PLACEHOLDER}</Td>
      <Td align="right" mono>
        {isValid ? (
          <span className="font-medium text-neutral-900 dark:text-neutral-50">
            {formatKgCO2e(row.emissionKgCO2e)}
          </span>
        ) : (
          PLACEHOLDER
        )}
      </Td>
      <Td>{scope ? <Badge variant="neutral">{formatScopeLabel(scope)}</Badge> : PLACEHOLDER}</Td>
      <Td muted mono>
        {emissionFactor?.version ?? PLACEHOLDER}
      </Td>
      <Td>
        {isValid ? (
          <Badge variant="neutral">Matched</Badge>
        ) : (
          <Badge
            variant="warning"
            title={row.errorMessage}
            aria-label={row.errorMessage}
          >
            Needs review
          </Badge>
        )}
      </Td>
    </tr>
  );
}

/** Header cell. */
function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap px-3 py-2.5',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      {children}
    </th>
  );
}

/** Body cell. */
function Td({
  children,
  align = 'left',
  muted = false,
  mono = false,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  muted?: boolean;
  mono?: boolean;
}) {
  return (
    <td
      className={cn(
        'whitespace-nowrap px-3 py-2.5',
        align === 'right' ? 'text-right' : 'text-left',
        mono && 'tabular-nums',
        muted
          ? 'text-neutral-500 dark:text-neutral-400'
          : 'text-neutral-700 dark:text-neutral-200',
      )}
    >
      {children}
    </td>
  );
}
